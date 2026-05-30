const express    = require('express');
const router     = express.Router();
const brain      = require('../engine/marketBrain');
const fetchuser  = require('../middleware/fetchuser');

// Note: CORS is handled globally in server.js — no need to apply it per-router

const ALL_SYMBOLS = [
  'RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY',
  'ITC','SBIN','BHARTIARTL','LT','AXISBANK',
  'NIFTY 50','SENSEX','NIFTY BANK',
];

// ✅ Seed all symbols ONCE at startup — not per request
const seedAll = async () => {
  console.log('🌱 [MarketBrain] Seeding synthetic history for all symbols...');
  for (const symbol of ALL_SYMBOLS) {
    try {
      const bias = await brain.analyze(symbol);
      const seedPrice = bias.lastRealPrice || 1000;
      const seedTime  = Math.floor(Date.now() / 1000) - 300 * 78;
      await brain.seedFromRealClose(symbol, seedPrice, seedTime);
      for (let i = 0; i < 78; i++) await brain.getNextCandle(symbol);
      console.log(`🌱 [MarketBrain] Seeded ${symbol} from ₹${seedPrice}`);
    } catch (err) {
      console.error(`🚨 Seed failed for ${symbol}:`, err.message);
    }
  }
  console.log('✅ [MarketBrain] All symbols seeded. Starting ticker...');
  brain.startTicker(ALL_SYMBOLS);
};

seedAll(); // ← runs once when server starts

// Routes
router.get('/status', (req, res) => {
  const marketOpen = brain.isMarketOpen();
  const biases = ALL_SYMBOLS.map(sym => brain.getBiasSummary(sym)).filter(Boolean);
  res.json({ marketOpen, biases, serverTime: new Date().toISOString() });
});

router.get('/bias/:symbol', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol).toUpperCase();
    await brain.analyze(symbol);
    res.json(brain.getBiasSummary(symbol));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Now just returns pre-seeded data instantly — no blocking loop
router.get('/history/:symbol', (req, res) => {
  try {
    const symbol  = decodeURIComponent(req.params.symbol).toUpperCase();
    const history = brain.getSyntheticHistory(symbol);
    res.json(history.map(c => ({ time: c.time, value: c.close })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stream/:symbol', async (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol).toUpperCase();

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control',  'no-cache');
  res.setHeader('Connection',     'keep-alive');
  res.flushHeaders();

  try {
    const summary = brain.getBiasSummary(symbol);
    if (summary) res.write(`data: ${JSON.stringify({ type: 'BIAS', ...summary })}\n\n`);
  } catch (_) {}

  brain.addClient(symbol, res);

  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) { clearInterval(keepAlive); }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    brain.removeClient(symbol, res);
  });
});

router.post('/seed', fetchuser, async (req, res) => {
  try {
    const { symbol, lastRealPrice, lastRealTime } = req.body;
    await brain.seedFromRealClose(
      symbol.toUpperCase(),
      Number(lastRealPrice),
      lastRealTime ? Math.floor(new Date(lastRealTime).getTime() / 1000) : undefined
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;