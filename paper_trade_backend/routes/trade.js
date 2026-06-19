const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fetchuser = require('../middleware/fetchuser');
const brain = require('../engine/marketBrain');
const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Validate trade inputs (FIX #9)
// ─────────────────────────────────────────────────────────────────────────────
const validateTradeInput = (symbol, quantity, currentPrice) => {
  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    return 'Symbol is required.';
  }
  const qty = Number(quantity);
  const price = Number(currentPrice);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    return 'Quantity must be a positive whole number.';
  }
  if (!Number.isFinite(price) || price <= 0) {
    return 'Price must be a positive number.';
  }
  return null; // No error
};

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: BUY STOCK (FIX #2 consistent uid, FIX #9 validation)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/buy', fetchuser, async (req, res) => {
  try {
    // ✅ FIX: JWT payload is now always { userId }, so use req.user.userId
    const uid = req.user.userId;
    if (!uid) return res.status(400).json({ message: 'Authentication failure: User ID missing.' });

    const { symbol, quantity, currentPrice } = req.body;

    // ✅ FIX #9: Validate all inputs
    const validationError = validateTradeInput(symbol, quantity, currentPrice);
    if (validationError) return res.status(400).json({ message: validationError });

    const qtyNumber = Number(quantity);
    const priceNumber = Number(currentPrice);
    const totalCost = qtyNumber * priceNumber;

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.virtualBalance < totalCost) {
      return res.status(400).json({ message: 'Insufficient Margin!' });
    }

    user.virtualBalance = parseFloat((user.virtualBalance - totalCost).toFixed(2));
    await user.save();

    const newTxn = new Transaction({
      userId: uid,
      symbol: symbol.trim().toUpperCase(),
      transactionType: 'BUY',
      quantity: qtyNumber,
      pricePerShare: priceNumber,
      totalAmount: totalCost,
    });
    await newTxn.save();

    res.json({ success: true, message: 'Buy Order Executed!', balance: user.virtualBalance });
  } catch (error) {
    console.error('Buy Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔴 ROUTE: SELL STOCK (FIX #2 crash, FIX #9 validation)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sell', fetchuser, async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) return res.status(400).json({ message: 'Authentication failure: User ID missing.' });

    const { symbol, quantity, currentPrice } = req.body;

    // ✅ FIX #9: Validate all inputs
    const validationError = validateTradeInput(symbol, quantity, currentPrice);
    if (validationError) return res.status(400).json({ message: validationError });

    const symClean = symbol.trim().toUpperCase();
    const qtyNumber = Number(quantity);
    const priceNumber = Number(currentPrice);
    // ✅ FIX #2: Correctly named 'earnings' — money gained from selling
    const earnings = qtyNumber * priceNumber;

    // Check if user has enough shares
    const userTxns = await Transaction.find({ userId: uid, symbol: symClean });
    let totalQty = 0;
    userTxns.forEach(t => {
      if (t.transactionType === 'BUY') totalQty += t.quantity;
      if (t.transactionType === 'SELL') totalQty -= t.quantity;
    });

    if (totalQty < qtyNumber) {
      return res.status(400).json({ message: `Insufficient holdings! You only have ${totalQty} shares of ${symClean}.` });
    }

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ FIX #2: ADD earnings to balance (selling gives money back)
    user.virtualBalance = parseFloat((user.virtualBalance + earnings).toFixed(2));
    await user.save();

    const newTxn = new Transaction({
      userId: uid,
      symbol: symClean,
      transactionType: 'SELL',
      quantity: qtyNumber,
      pricePerShare: priceNumber,
      totalAmount: earnings,
    });
    await newTxn.save();

    res.json({ success: true, message: 'Sell Order Executed!', balance: user.virtualBalance });
  } catch (error) {
    console.error('Sell Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 📌 ROUTE: Add Funds to Wallet (Deposit)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/deposit', fetchuser, async (req, res) => {
  try {
    const { amount } = req.body;
    // ✅ FIX: Was using req.user.userId || req.user.userId (same field twice)
    const userId = req.user.userId;

    // ✅ FIX #9: Validate deposit amount
    const depositAmount = Number(amount);
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: 'Deposit amount must be a positive number.' });
    }
    if (depositAmount > 10000000) { // Max ₹1 crore per deposit
      return res.status(400).json({ message: 'Deposit amount cannot exceed ₹1,00,00,000.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found!' });

    user.virtualBalance = parseFloat((user.virtualBalance + depositAmount).toFixed(2));
    await user.save();

    res.status(200).json({ message: 'Deposit successful', balance: user.virtualBalance });
  } catch (error) {
    console.error('Deposit Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 📌 ROUTE: Get Order History
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', fetchuser, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Sort ascending for cost-basis calc, then reverse at the end for display
    const orders = await Transaction.find({ userId }).sort({ createdAt: 1 });

    const costBasis = {};
    const enriched = orders.map(t => {
      const sym = t.symbol;
      if (!costBasis[sym]) costBasis[sym] = { qty: 0, invested: 0 };

      if (t.transactionType === 'BUY') {
        costBasis[sym].qty += t.quantity;
        costBasis[sym].invested += t.quantity * t.pricePerShare;
        return { ...t._doc, realizedPnL: null };
      } else {
        const avgCost = costBasis[sym].qty > 0
          ? costBasis[sym].invested / costBasis[sym].qty
          : t.pricePerShare;
        const pnl = (t.pricePerShare - avgCost) * t.quantity;
        costBasis[sym].qty -= t.quantity;
        costBasis[sym].invested = Math.max(0, costBasis[sym].qty * avgCost);
        return { ...t._doc, realizedPnL: parseFloat(pnl.toFixed(2)) };
      }
    });

    res.json(enriched.reverse()); // Newest first to frontend
  } catch (error) {
    console.error('History Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Fetch Live Prices (Public — no auth needed for market data)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/live-prices', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols)) return res.json({});

    const symbolMap = {};
    symbols.forEach(sym => {
      if (sym === 'NIFTY 50') symbolMap[sym] = '^NSEI';
      else if (sym === 'SENSEX') symbolMap[sym] = '^BSESN';
      else if (sym === 'NIFTY BANK') symbolMap[sym] = '^NSEBANK';
      else symbolMap[sym] = sym.includes('.NS') ? sym : `${sym}.NS`;
    });

    // ✅ FIX: Per-symbol 8-second timeout so a slow/rate-limited symbol
    //         never hangs the entire live-prices response
    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms)),
      ]);

    const quotes = await Promise.allSettled(
      Object.values(symbolMap).map(sym =>
        withTimeout(yahooFinance.quote(sym, undefined, { validateResult: false }), 8000)
      )
    );

    const livePrices = {};
    const isMarketOpenNow = brain.isMarketOpen();

    Object.keys(symbolMap).forEach((originalSym, index) => {
      const result = quotes[index];
      let p = 0, c = 0, h = 0, l = 0;

      if (result.status === 'fulfilled' && result.value) {
        const q = result.value;
        p = Number(q.regularMarketPrice?.toFixed(2)) || 0;
        c = Number(q.regularMarketChangePercent?.toFixed(2)) || 0;
        h = q.regularMarketDayHigh || 0;
        l = q.regularMarketDayLow || 0;
      }

      // If market is closed, override current price with synthetic price
      // and recalculate change% from the real seed price so it reflects synthetic movement
      if (!isMarketOpenNow) {
        const history = brain.getSyntheticHistory(originalSym);
        if (history && history.length > 0) {
          const lastCandle = history[history.length - 1];
          const seedPrice  = brain.getSeedPrice(originalSym);
          p = lastCandle.close;
          h = Math.max(h, lastCandle.high);
          l = l === 0 ? lastCandle.low : Math.min(l, lastCandle.low);
          // Recalculate % change from seed (real close) price
          if (seedPrice && seedPrice > 0) {
            c = parseFloat((((p - seedPrice) / seedPrice) * 100).toFixed(2));
          }
        }
      }

      livePrices[originalSym] = { price: p, change: c, high: h, low: l };
    });

    res.json(livePrices);
  } catch (error) {
    console.error('LIVE PRICE ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch live prices' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Fetch Historical Chart Data
// ─────────────────────────────────────────────────────────────────────────────
router.get('/chart/:symbol', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);

    let yfSymbol = symbol;
    if (symbol === 'NIFTY 50') yfSymbol = '^NSEI';
    else if (symbol === 'SENSEX') yfSymbol = '^BSESN';
    else if (symbol === 'NIFTY BANK') yfSymbol = '^NSEBANK';
    else if (!symbol.includes('.NS') && !symbol.includes('^')) yfSymbol = `${symbol}.NS`;

    const queryOptions = {
      period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      interval: '15m',
    };

    // ✅ FIX: Timeout wrapper — Yahoo Finance can hang indefinitely off-hours
    const fetchWithTimeout = (timeoutMs) => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Yahoo Finance request timed out')), timeoutMs)
      );
      return Promise.race([
        yahooFinance.chart(yfSymbol, queryOptions, { validateResult: false }),
        timeoutPromise,
      ]);
    };

    const result = await fetchWithTimeout(10000); // 10 second max

    if (!result || !result.quotes || result.quotes.length === 0) {
      return res.status(404).json({ message: 'No chart data available for this symbol' });
    }

    const chartData = result.quotes
      .filter(candle => candle.close !== null && candle.close !== undefined)
      .map(candle => ({
        time: Math.floor(new Date(candle.date).getTime() / 1000),
        value: Number(candle.close.toFixed(2)),
      }));

    res.json(chartData);
  } catch (error) {
    console.error(`Chart Error for ${req.params.symbol}:`, error.message);
    res.status(500).json({ message: 'Chart fetch failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Get Active Portfolio
// ─────────────────────────────────────────────────────────────────────────────
router.get('/portfolio', fetchuser, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId }).sort({ date: 1 });
    const holdings = {};

    transactions.forEach(t => {
      const sym = t.symbol.trim().toUpperCase();
      if (!holdings[sym]) holdings[sym] = { quantity: 0, investedValue: 0 };

      if (t.transactionType === 'BUY') {
        holdings[sym].investedValue += t.quantity * t.pricePerShare;
        holdings[sym].quantity += t.quantity;
      } else if (t.transactionType === 'SELL') {
        if (holdings[sym].quantity > 0) {
          const avgPrice = holdings[sym].investedValue / holdings[sym].quantity;
          holdings[sym].quantity -= t.quantity;
          holdings[sym].investedValue = holdings[sym].quantity <= 0 ? 0 : holdings[sym].quantity * avgPrice;
        } else {
          holdings[sym].quantity -= t.quantity;
          holdings[sym].investedValue = 0;
        }
      }
    });

    const activeHoldings = Object.keys(holdings)
      .filter(sym => holdings[sym].quantity !== 0)
      .map(sym => {
        const qty = holdings[sym].quantity;
        const invVal = holdings[sym].investedValue;
        return {
          symbol: sym,
          quantity: qty,
          avgPrice: qty > 0 ? invVal / qty : 0,
          investedValue: qty > 0 ? invVal : 0,
        };
      });

    res.json(activeHoldings);
  } catch (error) {
    res.status(500).json({ message: 'Portfolio Sync Error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Reset Portfolio & Balance
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/reset', fetchuser, async (req, res) => {
  try {
    const userId = req.user.userId;
    await Transaction.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, { virtualBalance: 1000000 });
    res.json({ success: true, message: 'Portfolio & Ledger reset successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;