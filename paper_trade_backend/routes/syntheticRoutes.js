const express    = require('express');
const router     = express.Router();
const brain      = require('../engine/marketBrain');
const fetchuser  = require('../middleware/fetchuser');
const { SUPPORTED_SYMBOLS } = require('../utils/validators');

// Note: CORS is handled globally in server.js — no need to apply it per-router

// Use the shared SUPPORTED_SYMBOLS set so every supported stock is seeded
const ALL_SYMBOLS = [...SUPPORTED_SYMBOLS];

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
// Returns { time, value } for the AreaSeries (line chart)
router.get('/history/:symbol', (req, res) => {
  try {
    const symbol  = decodeURIComponent(req.params.symbol).toUpperCase();
    const history = brain.getSyntheticHistory(symbol);
    res.json(history.map(c => ({ time: c.time, value: c.close })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Returns full OHLC data for the CandlestickSeries (candlestick chart)
router.get('/history-ohlc/:symbol', (req, res) => {
  try {
    const symbol  = decodeURIComponent(req.params.symbol).toUpperCase();
    const history = brain.getSyntheticHistory(symbol);
    // Return full candle objects: { time, open, high, low, close, volume }
    res.json(history);
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

// ─────────────────────────────────────────────────────────────────
// 💬 AI CHAT — Smart rule-based engine using live MarketBrain data
// ─────────────────────────────────────────────────────────────────
router.post('/chat', (req, res) => {
  try {
    const { message = '' } = req.body;
    const msg = message.toLowerCase().trim();

    if (!msg) return res.json({ reply: 'Please ask me something about the markets!' });

    // ── 1. Try to detect a stock symbol in the message ──────────────
    const symbolMap = {
      'reliance': 'RELIANCE', 'tcs': 'TCS', 'hdfc': 'HDFCBANK', 'hdfcbank': 'HDFCBANK',
      'icici': 'ICICIBANK', 'infosys': 'INFY', 'infy': 'INFY', 'itc': 'ITC',
      'sbi': 'SBIN', 'sbin': 'SBIN', 'airtel': 'BHARTIARTL', 'bhartiartl': 'BHARTIARTL',
      'lt': 'LT', 'larsen': 'LT', 'axis': 'AXISBANK', 'axisbank': 'AXISBANK',
      'nifty': 'NIFTY 50', 'sensex': 'SENSEX', 'bank nifty': 'NIFTY BANK',
    };

    let detectedSymbol = null;
    for (const [keyword, sym] of Object.entries(symbolMap)) {
      if (msg.includes(keyword)) { detectedSymbol = sym; break; }
    }

    // ── 2. Get live brain data if a stock was detected ───────────────
    if (detectedSymbol) {
      const bias = brain.getBiasSummary(detectedSymbol);
      const history = brain.getSyntheticHistory(detectedSymbol);
      const lastCandle = history?.[history.length - 1];
      const prevCandle = history?.[history.length - 2];
      const price = lastCandle?.close?.toFixed(2) || 'N/A';
      const prevPrice = prevCandle?.close || lastCandle?.close || lastCandle?.close;
      const change = lastCandle && prevCandle ? (((lastCandle.close - prevCandle.close) / prevCandle.close) * 100).toFixed(2) : '0.00';
      const direction = parseFloat(change) >= 0 ? '📈' : '📉';

      if (bias) {
        const regime = bias.regime?.replace('_', ' ') || 'NEUTRAL';
        const rsi = bias.rsi?.toFixed(1) || 'N/A';
        const macd = bias.macd?.toFixed(2) || 'N/A';
        const signal = bias.signal || 'HOLD';

        // Is user asking about analysis, buy/sell, trend?
        const wantsBuySell = msg.includes('buy') || msg.includes('sell') || msg.includes('should i') || msg.includes('trade');
        const wantsTrend   = msg.includes('trend') || msg.includes('direction') || msg.includes('going');
        const wantsRSI     = msg.includes('rsi') || msg.includes('overbought') || msg.includes('oversold');

        if (wantsBuySell) {
          const action = signal === 'BUY' ? 'bullish setup — AI model suggests a BUY signal' : signal === 'SELL' ? 'bearish pressure — AI model flags a SELL signal' : 'neutral territory — no strong directional signal';
          return res.json({ reply: `**${detectedSymbol}** is currently at ₹${price} (${direction} ${change}%). The AI Market Brain sees ${action} based on RSI: ${rsi} and MACD: ${macd}. Regime: ${regime}.\n\n⚠️ This is simulated analysis only — not real financial advice.` });
        }
        if (wantsTrend) {
          return res.json({ reply: `**${detectedSymbol}** trend analysis: The AI engine detects a **${regime}** market regime. Price: ₹${price} (${direction} ${change}% last bar). RSI at ${rsi} — ${parseFloat(rsi) > 70 ? 'overbought zone 🔴' : parseFloat(rsi) < 30 ? 'oversold zone 🟢' : 'neutral zone ⚪'}.` });
        }
        if (wantsRSI) {
          return res.json({ reply: `**${detectedSymbol}** RSI: **${rsi}**. ${parseFloat(rsi) > 70 ? 'The asset is in overbought territory — a pullback may be likely.' : parseFloat(rsi) < 30 ? 'The asset is in oversold territory — a bounce may be approaching.' : 'RSI is in a neutral range — no extreme conditions detected.'}` });
        }

        // Default full analysis
        return res.json({ reply: `📊 **${detectedSymbol} Market Intelligence**\n\n• Price: ₹${price} (${direction} ${change}%)\n• Regime: ${regime}\n• RSI: ${rsi} ${parseFloat(rsi) > 70 ? '🔴 Overbought' : parseFloat(rsi) < 30 ? '🟢 Oversold' : '⚪ Neutral'}\n• MACD: ${macd}\n• AI Signal: **${signal}**\n\n${bias.marketOpen ? '🟢 Live market data' : '🟣 AI synthetic simulation (market closed)'}` });
      } else {
        return res.json({ reply: `I'm still analyzing **${detectedSymbol}**. Market Brain is warming up. Try again in a moment!` });
      }
    }

    // ── 3. Generic market questions ──────────────────────────────────
    if (msg.includes('market open') || msg.includes('market status') || msg.includes('is market')) {
      const open = brain.isMarketOpen();
      return res.json({ reply: open ? '🟢 The NSE/BSE market is currently **OPEN** (9:15 AM – 3:30 PM IST, Mon–Fri). Live data is streaming.' : '🔴 The market is currently **CLOSED**. The AI synthetic engine is active, simulating realistic market behavior.' });
    }

    if (msg.includes('portfolio') || msg.includes('my stocks') || msg.includes('holdings')) {
      return res.json({ reply: 'I can see your portfolio is active! Head to the **Portfolio** tab for a full breakdown of your holdings, P&L, and performance metrics.' });
    }

    if (msg.includes('help') || msg.includes('what can you') || msg.includes('hi') || msg.includes('hello')) {
      return res.json({ reply: `👋 I'm your **Market Brain AI** — here's what I can do:\n\n• **Stock analysis** — "Analyze RELIANCE" or "Should I buy TCS?"\n• **Trend detection** — "What's the trend for HDFC?"\n• **RSI signals** — "Is INFY overbought?"\n• **Market status** — "Is the market open?"\n\nJust ask naturally — I'm powered by live synthetic market intelligence!` });
    }

    if (msg.includes('best stock') || msg.includes('top stock') || msg.includes('which stock')) {
      const allBiases = ALL_SYMBOLS.filter(s => !s.includes('NIFTY') && s !== 'SENSEX')
        .map(s => ({ s, b: brain.getBiasSummary(s) }))
        .filter(x => x.b && x.b.signal === 'BUY');
      const picks = allBiases.slice(0, 3).map(x => `• **${x.s}** (RSI: ${x.b.rsi?.toFixed(1)})`).join('\n') || '• No strong BUY signals right now.';
      return res.json({ reply: `🔍 **AI Top Picks (BUY signal)**:\n\n${picks}\n\n⚠️ Simulated signals only — not financial advice.` });
    }

    // ── 4. Fallback ──────────────────────────────────────────────────
    return res.json({ reply: `I'm your Market Brain! Try asking:\n• "Analyze RELIANCE"\n• "What's the RSI of TCS?"\n• "Is the market open?"\n• "Best stocks to watch?"` });

  } catch (err) {
    console.error('[Chat Error]:', err.message);
    res.status(500).json({ reply: 'Market Brain encountered an error. Please try again.' });
  }
});

module.exports = router;