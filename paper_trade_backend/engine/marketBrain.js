const YahooFinance = require('yahoo-finance2').default;
const { getMarketSession } = require('../services/marketSession');

// 🚀 FIX: V3 Initialization to prevent backend crashes
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
});

const PERSONALITIES = {
  'RELIANCE':    { volMult: 0.80, momentumPersist: 0.75, meanReversion: 0.30, name: 'Trend Stable'     },
  'TCS':         { volMult: 0.70, momentumPersist: 0.72, meanReversion: 0.35, name: 'Slow Steady'      },
  'HDFCBANK':    { volMult: 0.75, momentumPersist: 0.70, meanReversion: 0.40, name: 'Moderate Trend'   },
  'ICICIBANK':   { volMult: 0.90, momentumPersist: 0.68, meanReversion: 0.35, name: 'Active Mover'     },
  'INFY':        { volMult: 0.85, momentumPersist: 0.68, meanReversion: 0.38, name: 'Tech Stable'      },
  'ITC':         { volMult: 0.50, momentumPersist: 0.60, meanReversion: 0.60, name: 'Slow Mean Rev'    },
  'SBIN':        { volMult: 1.20, momentumPersist: 0.80, meanReversion: 0.25, name: 'Momentum Heavy'   },
  'BHARTIARTL':  { volMult: 1.00, momentumPersist: 0.72, meanReversion: 0.32, name: 'Balanced Mover'  },
  'LT':          { volMult: 0.90, momentumPersist: 0.73, meanReversion: 0.33, name: 'Infrastructure'   },
  'ZOMATO':      { volMult: 1.80, momentumPersist: 0.55, meanReversion: 0.20, name: 'High Volatility'  },
  'AXISBANK':    { volMult: 0.95, momentumPersist: 0.70, meanReversion: 0.36, name: 'Banking Mover'    },
  'DEFAULT':     { volMult: 1.00, momentumPersist: 0.65, meanReversion: 0.40, name: 'Standard'         },
};

const toYFSymbol = (sym) => {
  if (sym === 'NIFTY 50')   return '^NSEI';
  if (sym === 'SENSEX')     return '^BSESN';
  if (sym === 'NIFTY BANK') return '^NSEBANK';
  if (sym.startsWith('^') || sym.includes('.')) return sym;
  return `${sym}.NS`;
};

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgG / avgL)).toFixed(2));
}

function calcEMA(closes, period) {
  if (closes.length === 0) return 0;
  if (closes.length < period) return closes[closes.length - 1];
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return parseFloat(ema.toFixed(4));
}

function calcATR(candles, period = 14) {
  if (candles.length < 2) return 0;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const recent = trs.slice(-period);
  return parseFloat((recent.reduce((a, b) => a + b, 0) / recent.length).toFixed(4));
}

function calcMACD(closes) {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const macdLine = calcEMA(closes, 12) - calcEMA(closes, 26);
  const macdSeries = [];
  for (let i = 26; i <= closes.length; i++) {
    macdSeries.push(calcEMA(closes.slice(0, i), 12) - calcEMA(closes.slice(0, i), 26));
  }
  const signal = calcEMA(macdSeries, 9);
  return { macd: parseFloat(macdLine.toFixed(4)), signal: parseFloat(signal.toFixed(4)), histogram: parseFloat((macdLine - signal).toFixed(4)) };
}

function calcBollinger(closes, period = 20) {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 100;
    return { upper: last * 1.02, middle: last, lower: last * 0.98, bandwidth: 0.02 };
  }
  const recent = closes.slice(-period);
  const middle = recent.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(recent.reduce((s, p) => s + Math.pow(p - middle, 2), 0) / period);
  return { upper: parseFloat((middle + 2 * stdDev).toFixed(2)), middle: parseFloat(middle.toFixed(2)), lower: parseFloat((middle - 2 * stdDev).toFixed(2)), bandwidth: parseFloat(((4 * stdDev) / middle).toFixed(6)) };
}

function detectPatterns(candles) {
  const patterns = [];
  if (candles.length < 3) return patterns;

  const c  = candles[candles.length - 1];
  const c1 = candles[candles.length - 2];
  const c2 = candles[candles.length - 3];

  const body    = Math.abs(c.close - c.open);
  const range   = c.high - c.low;
  const upWick  = c.high - Math.max(c.open, c.close);
  const lowWick = Math.min(c.open, c.close) - c.low;

  const body1   = Math.abs(c1.close - c1.open);
  const body2   = Math.abs(c2.close - c2.open);

  // ── Single-candle patterns ──────────────────────────────────────────
  if (range > 0 && body / range < 0.10)                            patterns.push('DOJI');
  if (lowWick > body * 2 && upWick < body * 0.5)                   patterns.push('HAMMER');
  if (upWick > body * 2 && lowWick < body * 0.5)                   patterns.push('SHOOTING_STAR');
  if (range > 0 && body / range < 0.10 && upWick > range * 0.8)   patterns.push('GRAVESTONE_DOJI');
  if (range > 0 && body / range < 0.10 && lowWick > range * 0.8)  patterns.push('DRAGONFLY_DOJI');

  // ── Two-candle patterns ─────────────────────────────────────────────
  if (c1.close < c1.open && c.close > c.open && c.open < c1.close && c.close > c1.open)
    patterns.push('BULLISH_ENGULFING');
  if (c1.close > c1.open && c.close < c.open && c.open > c1.close && c.close < c1.open)
    patterns.push('BEARISH_ENGULFING');

  // Piercing Line: bearish candle followed by bullish that closes above midpoint of c1
  const midpointC1 = (c1.open + c1.close) / 2;
  if (c1.close < c1.open && c.close > c.open && c.open < c1.close && c.close > midpointC1 && c.close < c1.open)
    patterns.push('PIERCING_LINE');

  // Dark Cloud Cover: bullish candle followed by bearish that opens above c1 high & closes below midpoint
  const midpointC1Bull = (c1.open + c1.close) / 2;
  if (c1.close > c1.open && c.close < c.open && c.open > c1.high && c.close < midpointC1Bull && c.close > c1.open)
    patterns.push('DARK_CLOUD_COVER');

  // ── Three-candle patterns ───────────────────────────────────────────
  // Morning Star
  if (c2.close < c2.open && body1 / ((c1.high - c1.low) || 1) < 0.15 && c.close > c.open && body > body2 * 0.5)
    patterns.push('MORNING_STAR');

  // Evening Star
  if (c2.close > c2.open && body1 / ((c1.high - c1.low) || 1) < 0.15 && c.close < c.open && body > body2 * 0.5)
    patterns.push('EVENING_STAR');

  // Three White Soldiers: 3 consecutive bullish candles, each closing higher
  if (c2.close > c2.open && c1.close > c1.open && c.close > c.open &&
      c1.close > c2.close && c.close > c1.close &&
      body2 > 0 && body1 > body2 * 0.6 && body > body1 * 0.6)
    patterns.push('THREE_WHITE_SOLDIERS');

  // Three Black Crows: 3 consecutive bearish candles, each closing lower
  if (c2.close < c2.open && c1.close < c1.open && c.close < c.open &&
      c1.close < c2.close && c.close < c1.close &&
      body2 > 0 && body1 > body2 * 0.6 && body > body1 * 0.6)
    patterns.push('THREE_BLACK_CROWS');

  return patterns;
}

function detectRegime(closes, rsi, macd, ema20, ema50, bb) {
  const recent = closes.slice(-20);
  const priceChange = (recent[recent.length - 1] - recent[0]) / recent[0];
  const highVol = bb.bandwidth > 0.04;
  const bullishTrend = ema20 > ema50 && priceChange > 0.005;
  const bearishTrend = ema20 < ema50 && priceChange < -0.005;
  const overbought = rsi > 70, oversold = rsi < 30;

  if (oversold  && macd.histogram > 0) return 'REVERSAL_BULLISH';
  if (overbought && macd.histogram < 0) return 'REVERSAL_BEARISH';
  if (bullishTrend && highVol) return 'BREAKOUT_BULLISH';
  if (bearishTrend && highVol) return 'BREAKOUT_BEARISH';
  if (bullishTrend && !overbought) return 'TRENDING_BULLISH';
  if (bearishTrend && !oversold) return 'TRENDING_BEARISH';
  return 'SIDEWAYS';
}

function calculateBias(rsi, macd, ema20, ema50, bb, regime, patterns, closes) {
  let bullProb = 50;

  // RSI contribution
  if (rsi < 30) bullProb += 15; else if (rsi < 45) bullProb += 7;
  else if (rsi > 70) bullProb -= 15; else if (rsi > 55) bullProb -= 5;

  // EMA trend
  if (ema20 > ema50) bullProb += 10; else bullProb -= 10;

  // MACD
  if (macd.histogram > 0) bullProb += 8; else bullProb -= 8;

  // Bollinger Band position
  const last = closes[closes.length - 1];
  if (last <= bb.lower) bullProb += 10;
  if (last >= bb.upper) bullProb -= 10;
  if (bb.bandwidth < 0.01) bullProb += 3; // squeeze = potential breakout

  // ── Bullish patterns ──
  if (patterns.includes('BULLISH_ENGULFING'))    bullProb += 12;
  if (patterns.includes('MORNING_STAR'))          bullProb += 14;
  if (patterns.includes('DRAGONFLY_DOJI'))        bullProb += 10;
  if (patterns.includes('HAMMER'))                bullProb += 8;
  if (patterns.includes('PIERCING_LINE'))         bullProb += 9;
  if (patterns.includes('THREE_WHITE_SOLDIERS'))  bullProb += 16;

  // ── Bearish patterns ──
  if (patterns.includes('BEARISH_ENGULFING'))    bullProb -= 12;
  if (patterns.includes('EVENING_STAR'))          bullProb -= 14;
  if (patterns.includes('GRAVESTONE_DOJI'))       bullProb -= 10;
  if (patterns.includes('SHOOTING_STAR'))         bullProb -= 8;
  if (patterns.includes('DARK_CLOUD_COVER'))      bullProb -= 9;
  if (patterns.includes('THREE_BLACK_CROWS'))     bullProb -= 16;

  // ── Neutral / uncertainty ──
  if (patterns.includes('DOJI')) bullProb += (bullProb > 50 ? -3 : 3);

  // ── Regime overlay ──
  if (regime === 'TRENDING_BULLISH')   bullProb += 10;
  if (regime === 'TRENDING_BEARISH')   bullProb -= 10;
  if (regime === 'REVERSAL_BULLISH')   bullProb += 15;
  if (regime === 'REVERSAL_BEARISH')   bullProb -= 15;
  if (regime === 'BREAKOUT_BULLISH')   bullProb += 12;
  if (regime === 'BREAKOUT_BEARISH')   bullProb -= 12;

  return Math.min(82, Math.max(18, Math.round(bullProb)));
}

function generateCandle(prevClose, bias, atr, personality, time) {
  const { volMult, momentumPersist, meanReversion } = personality;
  const baseVol = atr * volMult;
  const goUp = Math.random() * 100 < bias.bullishProbability;
  const vol = baseVol * (0.7 + Math.random() * 0.6);
  const bodySize = vol * (0.3 + Math.random() * 0.5);

  const open  = prevClose;
  const close = goUp
    ? open + bodySize * (0.5 + Math.random() * 0.5)
    : open - bodySize * (0.5 + Math.random() * 0.5);

  const high = Math.max(open, close) + vol * (goUp ? 0.1 + Math.random() * 0.3 : 0.2 + Math.random() * 0.5);
  const low  = Math.min(open, close) - vol * (goUp ? 0.2 + Math.random() * 0.5 : 0.1 + Math.random() * 0.3);

  const midPoint      = bias.fairValue || prevClose;
  const deviation     = (prevClose - midPoint) / (midPoint || 1);
  const reversionNudge = -deviation * meanReversion * vol;

  const finalClose = parseFloat((close + reversionNudge).toFixed(2));
  const finalOpen  = parseFloat(open.toFixed(2));

  return {
    time,
    open:   finalOpen,
    high:   parseFloat(Math.max(high, finalClose, finalOpen).toFixed(2)),
    low:    parseFloat(Math.min(low,  finalClose, finalOpen).toFixed(2)),
    close:  finalClose,
    volume: Math.round(100000 + Math.random() * 500000),
  };
}

class MarketBrain {
  constructor() {
    this.cache            = {};
    this.syntheticHistory = {};
    this.clients          = {};
    this.macroEvents      = {}; // Labelled simulation shocks; never presented as real news.
    this.seedPrices       = {}; // Track seed prices per symbol for % change calculation
    this.simulationKeys   = {}; // Prevent stale anchors across pre/post-market sessions
    this.ticker           = null;
  }

  // ─── Macro Event System ───────────────────────────────────────────────────
  _tickMacroEvent(symbol) {
    const ev = this.macroEvents[symbol];
    if (!ev) return 0;
    if (ev.remainingCandles <= 0) { delete this.macroEvents[symbol]; return 0; }
    ev.remainingCandles--;
    return ev.bullImpact;
  }

  _maybeInjectMacroEvent(symbol, bias) {
    if (this.macroEvents[symbol]) return; // Already one active
    if (Math.random() > 0.015) return;    // ~1.5% chance per candle

    const events = [
      { name: 'SIM_DEMAND_IMBALANCE', bullImpact: 16, candles: 8, label: 'Simulation scenario: positive demand imbalance' },
      { name: 'SIM_SUPPLY_IMBALANCE', bullImpact: -16, candles: 8, label: 'Simulation scenario: negative supply imbalance' },
      { name: 'SIM_VOLATILITY_UP', bullImpact: 8, candles: 5, label: 'Simulation scenario: volatility expansion' },
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    this.macroEvents[symbol] = { remainingCandles: ev.candles, bullImpact: ev.bullImpact, event: ev };
    console.log(`📰 [MacroEvent] ${symbol}: ${ev.label} (${ev.candles} candles)`);

    // Broadcast the event to SSE clients
    const eventData = { type: 'MACRO_EVENT', symbol, event: ev.name, label: ev.label, bullImpact: ev.bullImpact };
    const clients = this.clients[symbol] || [];
    clients.forEach(res => { try { res.write(`data: ${JSON.stringify(eventData)}\n\n`); } catch (_) {} });
  }

  getMarketSession(value = new Date()) {
    return getMarketSession(value);
  }

  isMarketOpen(value = new Date()) {
    return this.getMarketSession(value).isLiveTrading;
  }

  async analyze(symbol, { force = false } = {}) {
    const cached = this.cache[symbol];
    const now = Date.now();
    if (!force && cached && now - cached.analyzedAt < 10 * 60 * 1000) return cached.bias;

    try {
      const yfSym = toYFSymbol(symbol);
      const end = new Date();
      const start1m = new Date(); start1m.setMonth(start1m.getMonth() - 1);
      const start5m = new Date(); start5m.setDate(start5m.getDate() - 5);

      let dailyRaw = [];
      try {
        const dailyResult = await yahooFinance.chart(yfSym, { period1: start1m, period2: end, interval: '1d' }, { validateResult: false });
        dailyRaw = dailyResult?.quotes ?? [];
      } catch (err) { console.warn(`[MarketBrain] Daily fetch failed for ${yfSym}`); }

      let intraRaw = [];
      try {
        const intraResult = await yahooFinance.chart(yfSym, { period1: start5m, period2: end, interval: '5m' }, { validateResult: false });
        intraRaw = intraResult?.quotes ?? [];
      } catch (_) {}

      const dailyCandles = dailyRaw.filter(d => d.close != null).map(d => ({ open: d.open, high: d.high, low: d.low, close: d.close }));
      const intraCandles = intraRaw.filter(q => q.close != null).map(q => ({ open: q.open, high: q.high, low: q.low, close: q.close }));

      const workingCandles = intraCandles.length > 20 ? intraCandles : dailyCandles;
      const closes = workingCandles.map(c => c.close);
      if (closes.length < 5) throw new Error('Insufficient data');

      const rsi     = calcRSI(closes);
      const ema20   = calcEMA(closes, 20);
      const ema50   = calcEMA(closes, 50);
      const macd    = calcMACD(closes);
      const atr     = calcATR(workingCandles);
      const bb      = calcBollinger(closes);
      const patterns = detectPatterns(workingCandles.slice(-3));
      const regime  = detectRegime(closes, rsi, macd, ema20, ema50, bb);
      const bullishProbability = calculateBias(rsi, macd, ema20, ema50, bb, regime, patterns, closes);

      const lastRealPrice = closes[closes.length - 1];

      // Store seed price for % change calculation when market is closed
      if (!this.seedPrices[symbol]) {
        this.seedPrices[symbol] = lastRealPrice;
      }

      const bias = {
        symbol, bullishProbability, regime, rsi, ema20, ema50, macd,
        atr, bb, patterns, fairValue: bb.middle,
        lastRealPrice, lastDirection: 'up', analyzedAt: now,
      };

      this.cache[symbol] = { bias, analyzedAt: now };
      console.log(`🧠 [MarketBrain] ${symbol} → Regime: ${regime} | BullProb: ${bullishProbability}%`);
      return bias;
    } catch (err) {
      console.error(`🚨 [MarketBrain] Fallback Triggered for ${symbol}:`, err.message);
      const fallbackBias = {
        symbol, bullishProbability: 50, regime: 'SIDEWAYS', rsi: 50,
        atr: 0.005, fairValue: 1000, lastRealPrice: 1000, lastDirection: 'up', analyzedAt: now,
      };
      this.cache[symbol] = { bias: fallbackBias, analyzedAt: now };
      return fallbackBias;
    }
  }

  getSyntheticHistory(symbol)     { return this.syntheticHistory[symbol] || []; }
  getSeedPrice(symbol)            { return this.seedPrices[symbol] || null; }

  async getNextCandle(symbol, prevClose = null, targetTime = null) {
    let bias = await this.analyze(symbol);
    const personality = PERSONALITIES[symbol] || PERSONALITIES['DEFAULT'];
    const history = this.syntheticHistory[symbol] || [];
    const lastCandle = history[history.length - 1];

    const startPrice = prevClose ?? lastCandle?.close ?? bias.lastRealPrice ?? 1000;
    const nextTime = targetTime == null
      ? (lastCandle?.time ?? Math.floor(Date.now() / 1000)) + 300
      : Math.max(targetTime, lastCandle?.time ?? targetTime);

    // Apply macro event bias modifier
    this._maybeInjectMacroEvent(symbol, bias);
    const macroBias = this._tickMacroEvent(symbol);
    const effectiveBias = { ...bias, bullishProbability: Math.min(90, Math.max(10, bias.bullishProbability + macroBias)) };

    const generated = generateCandle(startPrice, effectiveBias, bias.atr || startPrice * 0.005, personality, nextTime);
    const isCurrentBucketUpdate = targetTime != null && lastCandle?.time === nextTime;
    const candle = isCurrentBucketUpdate
      ? {
          ...generated,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, generated.high, generated.close),
          low: Math.min(lastCandle.low, generated.low, generated.close),
          volume: lastCandle.volume + Math.max(1, Math.round(generated.volume / 12)),
        }
      : generated;

    if (!this.cache[symbol]) this.cache[symbol] = { bias };
    if (!this.cache[symbol].bias) this.cache[symbol].bias = bias;
    this.cache[symbol].bias.lastDirection = candle.close >= candle.open ? 'up' : 'down';

    if (this.cache[symbol].bias.fairValue) {
      this.cache[symbol].bias.fairValue = this.cache[symbol].bias.fairValue * 0.995 + candle.close * 0.005;
    }

    if (!this.syntheticHistory[symbol]) this.syntheticHistory[symbol] = [];
    if (isCurrentBucketUpdate) {
      this.syntheticHistory[symbol][this.syntheticHistory[symbol].length - 1] = candle;
    } else {
      this.syntheticHistory[symbol].push(candle);
    }
    if (this.syntheticHistory[symbol].length > 500) this.syntheticHistory[symbol].shift();

    return candle;
  }

  async seedFromRealClose(symbol, lastRealPrice, lastRealTime) {
    this.seedPrices[symbol] = lastRealPrice; // Store for % change calculation
    this.syntheticHistory[symbol] = [{
      time: lastRealTime ?? Math.floor(Date.now() / 1000),
      open: lastRealPrice, high: lastRealPrice, low: lastRealPrice, close: lastRealPrice, volume: 0,
    }];
    await this.analyze(symbol);
  }

  async ensureSyntheticHistory(symbol) {
    const session = this.getMarketSession();
    const phase = session.state === 'POST_MARKET' ? 'POST' : 'PRE';
    const sessionKey = `${session.dateKey}:${phase}`;
    const history = this.syntheticHistory[symbol] || [];

    if (history.length > 0 && this.simulationKeys[symbol] === sessionKey) {
      return history;
    }

    const bias = await this.analyze(symbol, { force: true });
    const anchor = Number(bias.lastRealPrice) > 0 ? Number(bias.lastRealPrice) : 1000;
    const anchorTime = Math.floor(Date.now() / 300000) * 300 - 300 * 78;

    this.seedPrices[symbol] = anchor;
    this.syntheticHistory[symbol] = [{
      time: anchorTime,
      open: anchor,
      high: anchor,
      low: anchor,
      close: anchor,
      volume: 0,
    }];
    this.simulationKeys[symbol] = sessionKey;

    for (let i = 0; i < 78; i += 1) {
      await this.getNextCandle(symbol);
    }

    return this.syntheticHistory[symbol];
  }

  addClient(symbol, res) {
    if (!this.clients[symbol]) this.clients[symbol] = [];
    this.clients[symbol].push(res);
  }
  removeClient(symbol, res) {
    if (!this.clients[symbol]) return;
    this.clients[symbol] = this.clients[symbol].filter(c => c !== res);
  }
  broadcast(symbol, candle) {
    const clients = this.clients[symbol] || [];
    const data = `data: ${JSON.stringify(candle)}\n\n`;
    clients.forEach(res => { try { res.write(data); } catch (_) { this.removeClient(symbol, res); } });
  }

  startTicker(activeSymbols = []) {
    if (this.ticker) return this.ticker;
    console.log('⚙️  [MarketBrain] Simulation ticker started');
    this.ticker = setInterval(async () => {
      if (this.isMarketOpen()) return;
      const currentBucket = Math.floor(Date.now() / 300000) * 300;
      for (const symbol of activeSymbols) {
        try {
          await this.ensureSyntheticHistory(symbol);
          const candle = await this.getNextCandle(symbol, null, currentBucket);
          this.broadcast(symbol, { type: 'CANDLE', candle, symbol });
        } catch (err) {}
      }
    }, 5000);
    this.ticker.unref?.();
    return this.ticker;
  }

  getBiasSummary(symbol) {
    const cached = this.cache[symbol];
    if (!cached) return null;
    const bullishProbability = cached.bias.bullishProbability;
    const signal = bullishProbability >= 62
      ? 'BUY'
      : bullishProbability <= 38
        ? 'SELL'
        : 'WAIT';
    return {
      symbol:              cached.bias.symbol,
      regime:              cached.bias.regime,
      bullishProbability,
      rsi:                 cached.bias.rsi,
      macd:                cached.bias.macd?.macd ?? 0,
      macdSignal:          cached.bias.macd?.signal ?? 0,
      patterns:            cached.bias.patterns,
      lastPrice:           (this.syntheticHistory[symbol] || []).at(-1)?.close ?? cached.bias.lastRealPrice,
      signal,
      marketMode:          this.isMarketOpen() ? 'LIVE' : 'SIMULATED',
    };
  }
}

module.exports = new MarketBrain();
