const VALID_INTERVALS = ['1m', '5m', '15m', '1h', '1d'];

// A basic set of supported indices/stocks for paper trading
const SUPPORTED_SYMBOLS = new Set([
  'NIFTY 50', 'SENSEX', 'NIFTY BANK',
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'SBIN', 'HINDUNILVR', 'ITC', 'BHARTIARTL', 'KOTAKBANK',
  'LT', 'AXISBANK'
]);

function canonicalizeSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return null;
  let sym = symbol.trim().toUpperCase();
  if (sym.endsWith('.NS')) {
    sym = sym.slice(0, -3);
  }
  return sym;
}

function toYahooSymbol(canonicalSymbol) {
  if (!canonicalSymbol) return null;
  const sym = canonicalSymbol;
  if (sym === 'NIFTY 50') return '^NSEI';
  if (sym === 'SENSEX') return '^BSESN';
  if (sym === 'NIFTY BANK') return '^NSEBANK';
  // Normal equities get .NS
  return `${sym}.NS`;
}

function isValidSymbol(symbol) {
  const sym = canonicalizeSymbol(symbol);
  return sym && SUPPORTED_SYMBOLS.has(sym);
}

// Ensure old code that expected normalizeSymbol gets canonicalizeSymbol to avoid breaking,
// or we can export normalizeSymbol as canonicalizeSymbol if needed, but we will explicitly refactor it.
function normalizeSymbol(symbol) {
  return canonicalizeSymbol(symbol);
}

function normalizeInterval(interval) {
  if (!interval || typeof interval !== 'string') return null;
  const i = interval.trim().toLowerCase();
  return VALID_INTERVALS.includes(i) ? i : null;
}

function validateQuantity(quantity) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    return false;
  }
  return true;
}

function validateReplayDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  // strict YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  // reject invalid dates like 2024-02-31 which js might normalize
  const dNum = d.toISOString().slice(0, 10);
  if (dNum !== dateStr) return false;

  // reject future dates
  if (d.getTime() > Date.now()) return false;

  return true;
}

module.exports = {
  VALID_INTERVALS,
  SUPPORTED_SYMBOLS,
  canonicalizeSymbol,
  toYahooSymbol,
  isValidSymbol,
  normalizeSymbol,
  normalizeInterval,
  validateQuantity,
  validateReplayDate
};
