const express    = require('express');
const router     = express.Router();
const brain      = require('../engine/marketBrain');
const fetchuser  = require('../middleware/fetchuser');
const { SUPPORTED_SYMBOLS, canonicalizeSymbol, isValidSymbol } = require('../utils/validators');

// Note: CORS is handled globally in server.js — no need to apply it per-router

// Use the shared SUPPORTED_SYMBOLS set so every supported stock is seeded
const ALL_SYMBOLS = [...SUPPORTED_SYMBOLS];

// ✅ Seed all symbols ONCE at startup — not per request
const seedAll = async () => {
  console.log('🌱 [MarketBrain] Seeding synthetic history for all symbols...');
  if (brain.isMarketOpen()) {
    console.log('ℹ️  [MarketBrain] NSE normal market is live; simulation will seed on demand after close.');
    brain.startTicker(ALL_SYMBOLS);
    return;
  }
  for (const symbol of ALL_SYMBOLS) {
    try {
      const history = await brain.ensureSyntheticHistory(symbol);
      console.log(`🌱 [MarketBrain] Seeded ${symbol} from ₹${history[0]?.close || 0}`);
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
  const session = brain.getMarketSession();
  const biases = ALL_SYMBOLS.map(sym => brain.getBiasSummary(sym)).filter(Boolean);
  res.json({ marketOpen: session.isLiveTrading, mode: session.mode, session, biases });
});

router.get('/bias/:symbol', async (req, res) => {
  try {
    const symbol = canonicalizeSymbol(decodeURIComponent(req.params.symbol));
    if (!isValidSymbol(symbol)) return res.status(400).json({ message: 'Unsupported symbol.' });
    await brain.analyze(symbol);
    res.json(brain.getBiasSummary(symbol));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Now just returns pre-seeded data instantly — no blocking loop
// Returns { time, value } for the AreaSeries (line chart)
router.get('/history/:symbol', async (req, res) => {
  try {
    const symbol = canonicalizeSymbol(decodeURIComponent(req.params.symbol));
    if (!isValidSymbol(symbol)) return res.status(400).json({ message: 'Unsupported symbol.' });
    const history = await brain.ensureSyntheticHistory(symbol);
    res.json(history.map(c => ({ time: c.time, value: c.close })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Returns full OHLC data for the CandlestickSeries (candlestick chart)
router.get('/history-ohlc/:symbol', async (req, res) => {
  try {
    const symbol = canonicalizeSymbol(decodeURIComponent(req.params.symbol));
    if (!isValidSymbol(symbol)) return res.status(400).json({ message: 'Unsupported symbol.' });
    const history = await brain.ensureSyntheticHistory(symbol);
    // Return full candle objects: { time, open, high, low, close, volume }
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stream/:symbol', async (req, res) => {
  const symbol = canonicalizeSymbol(decodeURIComponent(req.params.symbol));
  if (!isValidSymbol(symbol)) return res.status(400).json({ message: 'Unsupported symbol.' });

  try {
    await brain.ensureSyntheticHistory(symbol);
  } catch (error) {
    return res.status(503).json({ message: 'Simulation is warming up. Please retry shortly.' });
  }

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
    const canonicalSymbol = canonicalizeSymbol(symbol);
    const numericPrice = Number(lastRealPrice);
    if (!isValidSymbol(canonicalSymbol) || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'A supported symbol and positive anchor price are required.' });
    }
    await brain.seedFromRealClose(
      canonicalSymbol,
      numericPrice,
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
router.post('/chat', async (req, res) => {
  try {
    const { message = '' } = req.body;
    const msg = message.toLowerCase().trim();

    if (!msg) return res.json({ reply: 'Ask a question about market structure, risk, or a supported symbol.' });

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
      await brain.analyze(detectedSymbol);
      const bias = brain.getBiasSummary(detectedSymbol);
      const history = brain.getSyntheticHistory(detectedSymbol);
      const lastCandle = history?.[history.length - 1];
      const prevCandle = history?.[history.length - 2];
      const resolvedPrice = lastCandle?.close ?? bias?.lastPrice;
      const price = Number.isFinite(resolvedPrice) ? resolvedPrice.toFixed(2) : 'N/A';
      const change = lastCandle && prevCandle ? (((lastCandle.close - prevCandle.close) / prevCandle.close) * 100).toFixed(2) : '0.00';
      const direction = parseFloat(change) >= 0 ? 'up' : 'down';

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
          const action = signal === 'BUY' ? 'a bullish rule-engine signal' : signal === 'SELL' ? 'a bearish rule-engine signal' : 'no strong directional signal';
          return res.json({ reply: `${detectedSymbol} is at ₹${price} (${direction} ${change}%). The signal engine sees ${action}. RSI: ${rsi}; MACD: ${macd}; regime: ${regime}. This is educational analysis, not financial advice.` });
        }
        if (wantsTrend) {
          return res.json({ reply: `${detectedSymbol} trend: ${regime}. Price: ₹${price} (${direction} ${change}% on the latest bar). RSI ${rsi} is ${parseFloat(rsi) > 70 ? 'in the overbought zone' : parseFloat(rsi) < 30 ? 'in the oversold zone' : 'in the neutral zone'}.` });
        }
        if (wantsRSI) {
          return res.json({ reply: `${detectedSymbol} RSI: ${rsi}. ${parseFloat(rsi) > 70 ? 'Momentum is overbought; wait for price confirmation rather than assuming a reversal.' : parseFloat(rsi) < 30 ? 'Momentum is oversold; wait for price confirmation rather than assuming a bounce.' : 'Momentum is neutral, with no RSI extreme.'}` });
        }

        // Default full analysis
        return res.json({ reply: `${detectedSymbol} market brief\nPrice: ₹${price} (${direction} ${change}%)\nRegime: ${regime}\nRSI: ${rsi}\nMACD: ${macd}\nSignal: ${signal}\nMode: ${bias.marketMode === 'LIVE' ? 'live market data' : 'after-hours simulation'}` });
      } else {
        return res.json({ reply: `${detectedSymbol} analysis is still warming up. Try again in a moment.` });
      }
    }

    // ── 3. Generic market questions ──────────────────────────────────
    if (msg.includes('market open') || msg.includes('market status') || msg.includes('is market')) {
      const open = brain.isMarketOpen();
      const session = brain.getMarketSession();
      return res.json({ reply: open ? 'The NSE normal market is open (9:15 AM–3:30 PM IST). Paper Trade is using live quote mode.' : `${session.label}. Paper Trade is using clearly labelled simulation mode.` });
    }

    if (msg.includes('portfolio') || msg.includes('my stocks') || msg.includes('holdings')) {
      return res.json({ reply: 'Open Portfolio for positions, average cost, marked value and unrealized P&L. Open Ledger for executions and realized P&L.' });
    }

    if (msg.includes('nifty')) {
      return res.json({ reply: 'NIFTY 50 is an NSE benchmark index representing 50 large, liquid listed companies across major sectors. It is an index value, not a share you buy directly in this simulator.' });
    }

    if (msg.includes('p&l') || msg.includes('profit and loss') || msg.includes('profit loss')) {
      return res.json({ reply: 'Unrealized P&L is the difference between the current marked value and cost basis of an open position. Realized P&L is recorded when shares are sold. Account equity equals virtual cash plus marked position value.' });
    }

    if (msg.includes('stop-loss') || msg.includes('stop loss')) {
      return res.json({ reply: 'A stop-loss is an exit instruction or predefined invalidation level intended to limit loss if price moves against a trade. Paper Trade does not currently execute stop orders, so use the level as part of your practice plan rather than as an automated order.' });
    }

    if (msg.includes('paper trading') || msg.includes('paper trade')) {
      return res.json({ reply: 'Paper trading rehearses decisions with virtual funds. It can help test a repeatable process, but it does not fully reproduce slippage, order-book depth, fees, taxes or the emotions of risking real capital.' });
    }

    if (msg.includes('rsi')) {
      return res.json({ reply: 'RSI is a momentum oscillator from 0 to 100. Readings above 70 or below 30 describe strong recent momentum; they do not guarantee an immediate reversal. Use trend and price confirmation as context.' });
    }

    if (msg.includes('size') || msg.includes('sizing') || msg.includes('risk per trade')) {
      return res.json({ reply: 'Start with an invalidation level. Risk per share is the distance between entry and invalidation; divide the virtual rupee amount you are willing to risk by that distance to estimate quantity.' });
    }

    if (msg.includes('help') || msg.includes('what can you') || msg.includes('hi') || msg.includes('hello')) {
      return res.json({ reply: 'The market desk can explain supported symbols, trend regimes, RSI, current market mode and basic risk concepts. Try: “Analyse RELIANCE”, “Explain RSI”, or “Is the market open?”' });
    }

    if (msg.includes('best stock') || msg.includes('top stock') || msg.includes('which stock')) {
      const allBiases = ALL_SYMBOLS.filter(s => !s.includes('NIFTY') && s !== 'SENSEX')
        .map(s => ({ s, b: brain.getBiasSummary(s) }))
        .filter(x => x.b && x.b.signal === 'BUY');
      const picks = allBiases.slice(0, 3).map(x => `${x.s} (RSI: ${x.b.rsi?.toFixed(1)})`).join(', ') || 'No supported symbol currently meets the engine threshold.';
      return res.json({ reply: `Signal-screen result: ${picks}. This is an educational screen, not a recommendation.` });
    }

    // ── 4. Fallback ──────────────────────────────────────────────────
    return res.json({ reply: 'Try asking: “Analyse RELIANCE”, “What is RSI?”, “Is the market open?”, or “How should I size a paper trade?”' });

  } catch (err) {
    console.error('[Chat Error]:', err.message);
    res.status(500).json({ reply: 'The market desk encountered an error. Please try again.' });
  }
});

module.exports = router;
