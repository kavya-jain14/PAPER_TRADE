const YahooFinance = require('yahoo-finance2').default;
const brain = require('../engine/marketBrain');
const { toYahooSymbol } = require('../utils/validators');

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
});

// Maximum age for a cached LIVE quote used in mark-price context (10 s).
// After this age a cached entry is considered stale and will not be served
// as a fresh LIVE price.  Execution prices never use any cached value.
const LIVE_QUOTE_MAX_AGE_MS = 10000;

// Leaderboard snapshot: fresh bucket (30 s TTL) and stale bucket (5 min max age).
let freshSnapshotCache = { timestamp: 0, data: null, priceMode: null };
let staleSnapshotCache = { timestamp: 0, data: null, priceMode: null };

// Per-symbol quote cache used only by resolveMarkPrices (never by execution).
const liveQuoteCache = new Map();

function quoteTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getTime();
  if (Number.isFinite(value)) return value > 1000000000000 ? value : value * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveExecutionPrice — strict, no-cache, no-fallback.
// Called BEFORE a MongoDB transaction is opened.
// ─────────────────────────────────────────────────────────────────────────────
async function resolveExecutionPrice(canonicalSymbol) {
  const isMarketOpenNow = brain.isMarketOpen();
  const yahooTarget = toYahooSymbol(canonicalSymbol);

  if (isMarketOpenNow) {
    try {
      const q = await Promise.race([
        yahooFinance.quote(yahooTarget, undefined, { validateResult: false }),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 8000))
      ]);
      const p = Number(q?.regularMarketPrice?.toFixed(2)) || 0;
      const asOf = quoteTimestamp(q?.regularMarketTime);
      if (p > 0) return { price: p, mode: 'LIVE', asOf, source: 'YAHOO_FINANCE' };
      return { price: 0, mode: 'LIVE', asOf, source: 'YAHOO_FINANCE' };   // strict fail — no synthetic fallback
    } catch {
      return { price: 0, mode: 'LIVE' };   // strict fail — do not fallback
    }
  } else {
    // Market closed — use latest synthetic candle close
    const history = await brain.ensureSyntheticHistory(canonicalSymbol);
    if (history && history.length > 0) {
      const p = Number(history[history.length - 1].close.toFixed(2)) || 0;
      if (p > 0) return { price: p, mode: 'SIMULATED', asOf: Date.now(), source: 'MARKET_BRAIN' };
    }
    return { price: 0, mode: 'SIMULATED', asOf: Date.now(), source: 'MARKET_BRAIN' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveMarkPrices — batch, bounded-concurrency.
// Returns { symbol: { price, change, high, low, priceMode } }.
// On LIVE mode: returns null for a symbol if no fresh or stale cache exists
// (caller must check and reject the whole batch if any price is null).
// On SIMULATED mode: always succeeds from synthetic history.
// ─────────────────────────────────────────────────────────────────────────────
async function resolveMarkPrices(canonicalSymbols) {
  const isMarketOpenNow = brain.isMarketOpen();
  const results = {};
  const uniqueSymbols = [...new Set(canonicalSymbols)];

  if (!isMarketOpenNow) {
    await Promise.allSettled(uniqueSymbols.map(sym => brain.ensureSyntheticHistory(sym)));
    uniqueSymbols.forEach(sym => {
      const history = brain.getSyntheticHistory(sym);
      if (history && history.length > 0) {
        let p = 0, c = 0, h = 0, l = 0;
        const lastCandle = history[history.length - 1];
        const seedPrice = brain.getSeedPrice(sym);
        p = lastCandle.close;
        h = lastCandle.high;
        l = lastCandle.low;
        if (seedPrice && seedPrice > 0) {
          c = parseFloat((((p - seedPrice) / seedPrice) * 100).toFixed(2));
        }
        results[sym] = { price: p, change: c, high: h, low: l, priceMode: 'SIMULATED', asOf: Date.now(), source: 'MARKET_BRAIN' };
      } else {
        results[sym] = null; // Strict requirement: return null if missing
      }
    });
    return results;
  }

  // Market is open: batch fetch with bounded concurrency
  const CONCURRENCY_LIMIT = 5;
  const now = Date.now();
  const toFetch = [];

  for (const sym of uniqueSymbols) {
    const cached = liveQuoteCache.get(sym);
    // Only serve cached value if it is within LIVE_QUOTE_MAX_AGE_MS
    if (cached && (now - cached.timestamp < LIVE_QUOTE_MAX_AGE_MS)) {
      results[sym] = cached.data;
    } else {
      toFetch.push(sym);
    }
  }

  for (let i = 0; i < toFetch.length; i += CONCURRENCY_LIMIT) {
    const chunk = toFetch.slice(i, i + CONCURRENCY_LIMIT);
    const promises = chunk.map(async (sym) => {
      try {
        const yfSym = toYahooSymbol(sym);
        const q = await Promise.race([
          yahooFinance.quote(yfSym, undefined, { validateResult: false }),
          new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 8000))
        ]);

        const p = Number(q?.regularMarketPrice?.toFixed(2)) || 0;
        const c = Number(q?.regularMarketChangePercent?.toFixed(2)) || 0;
        const h = q?.regularMarketDayHigh || 0;
        const l = q?.regularMarketDayLow || 0;

        const data = {
          price: p,
          change: c,
          high: h,
          low: l,
          priceMode: 'LIVE',
          asOf: quoteTimestamp(q?.regularMarketTime),
          source: 'YAHOO_FINANCE',
        };
        if (p > 0) {
          liveQuoteCache.set(sym, { timestamp: Date.now(), data });
          results[sym] = data;
        } else {
          // No valid price — check stale cache (within max age)
          const cached = liveQuoteCache.get(sym);
          if (cached && (now - cached.timestamp < LIVE_QUOTE_MAX_AGE_MS)) {
            results[sym] = cached.data;
          } else {
            // Signal that this symbol has no usable price
            results[sym] = null;
          }
        }
      } catch {
        const cached = liveQuoteCache.get(sym);
        if (cached && (now - cached.timestamp < LIVE_QUOTE_MAX_AGE_MS)) {
          results[sym] = cached.data;
        } else {
          results[sym] = null;
        }
      }
    });

    await Promise.allSettled(promises);
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard cache helpers — two-tier (fresh 30 s + stale max 5 min).
// ─────────────────────────────────────────────────────────────────────────────

function getFreshLeaderboardCache(currentMode) {
  const now = Date.now();
  if (
    freshSnapshotCache.data &&
    freshSnapshotCache.priceMode === currentMode &&
    (now - freshSnapshotCache.timestamp < 30000)
  ) {
    return freshSnapshotCache.data;
  }
  return null;
}

function getStaleLeaderboardCache(currentMode) {
  const now = Date.now();
  const MAX_STALE_AGE = 5 * 60 * 1000; // 5 minutes
  if (
    staleSnapshotCache.data &&
    staleSnapshotCache.priceMode === currentMode &&
    (now - staleSnapshotCache.timestamp < MAX_STALE_AGE)
  ) {
    return staleSnapshotCache.data;
  }
  return null;
}

function setLeaderboardCache(data, priceMode) {
  const now = Date.now();
  data.generatedAt = new Date(now).toISOString();
  data.priceMode = priceMode;
  freshSnapshotCache = { timestamp: now, data, priceMode };
  staleSnapshotCache = { timestamp: now, data, priceMode };
}

function invalidateLeaderboardCache() {
  freshSnapshotCache = { timestamp: 0, data: null, priceMode: null };
}

// Legacy alias expected by old callers
function getLeaderboardCache() {
  return getFreshLeaderboardCache();
}

module.exports = {
  resolveExecutionPrice,
  resolveMarkPrices,
  getLeaderboardCache,
  getFreshLeaderboardCache,
  getStaleLeaderboardCache,
  setLeaderboardCache,
  invalidateLeaderboardCache
};
