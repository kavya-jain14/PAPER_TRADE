const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const YahooFinance = require('yahoo-finance2').default;
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fetchuser = require('../middleware/fetchuser');
const brain = require('../engine/marketBrain');
const aiCoach = require('../engine/aiCoach');
const {
  resolveExecutionPrice,
  resolveMarkPrices,
  invalidateLeaderboardCache
} = require('../services/marketPriceService');

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
});

const {
  isValidSymbol,
  canonicalizeSymbol,
  toYahooSymbol,
  validateQuantity,
  normalizeInterval
} = require('../utils/validators');

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: BUY STOCK
// ─────────────────────────────────────────────────────────────────────────────
router.post('/buy', fetchuser, async (req, res) => {
  // Validate inputs before touching the DB
  const uid = req.user?.userId;
  if (!uid) return res.status(400).json({ message: 'Authentication failure: User ID missing.' });

  const { symbol, quantity } = req.body;
  if (!isValidSymbol(symbol)) return res.status(400).json({ message: 'Invalid or unsupported symbol.' });
  if (!validateQuantity(quantity)) return res.status(400).json({ message: 'Quantity must be a positive whole number.' });

  const symClean = canonicalizeSymbol(symbol);
  const qtyNumber = Number(quantity);

  // Resolve execution price BEFORE opening any transaction (network call)
  const resolved = await resolveExecutionPrice(symClean);
  if (!(resolved.price > 0)) {
    return res.status(400).json({ message: 'Quote unavailable. Execution rejected.' });
  }

  const priceNumber = resolved.price;
  const totalCost = Number((qtyNumber * priceNumber).toFixed(2));

  const session = await mongoose.startSession();
  try {
    let resultData = null;
    await session.withTransaction(async () => {
      // All DB work inside the transaction
      const user = await User.findOneAndUpdate(
        { _id: uid, virtualBalance: { $gte: totalCost } },
        [{ $set: { virtualBalance: { $round: [{ $subtract: ['$virtualBalance', totalCost] }, 2] } } }],
        { new: true, session }
      );
      if (!user) throw new Error('Insufficient Margin or user not found!');

      const newTxn = new Transaction({
        userId: uid,
        symbol: symClean,
        transactionType: 'BUY',
        quantity: qtyNumber,
        pricePerShare: priceNumber,
        totalAmount: totalCost,
      });
      await newTxn.save({ session });

      const recentTrades = await Transaction.find({ userId: uid })
        .sort({ createdAt: -1 }).limit(10).session(session);
      const bias = brain.getBiasSummary(symClean);
      const aiFeedback = aiCoach.evaluateTrade(symClean, 'BUY', qtyNumber, priceNumber, bias, recentTrades);

      resultData = {
        success: true,
        message: 'Buy Order Executed!',
        balance: user.virtualBalance,
        executedPrice: priceNumber,
        priceMode: resolved.mode,
        aiFeedback
      };
    });

    if (resultData) {
      invalidateLeaderboardCache();
      return res.json(resultData);
    }
  } catch (error) {
    console.error('Buy Error:', error.message);
    const knownMsgs = ['Insufficient Margin', 'user not found', 'Authentication'];
    const msg = knownMsgs.some(k => error.message.includes(k)) ? error.message : 'Internal Server Error';
    return res.status(msg === 'Internal Server Error' ? 500 : 400).json({ message: msg });
  } finally {
    await session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔴 ROUTE: SELL STOCK
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sell', fetchuser, async (req, res) => {
  // Validate inputs before touching the DB
  const uid = req.user?.userId;
  if (!uid) return res.status(400).json({ message: 'Authentication failure: User ID missing.' });

  const { symbol, quantity } = req.body;
  if (!isValidSymbol(symbol)) return res.status(400).json({ message: 'Invalid or unsupported symbol.' });
  if (!validateQuantity(quantity)) return res.status(400).json({ message: 'Quantity must be a positive whole number.' });

  const symClean = canonicalizeSymbol(symbol);
  const qtyNumber = Number(quantity);

  // Resolve execution price BEFORE opening any transaction (network call)
  const resolved = await resolveExecutionPrice(symClean);
  if (!(resolved.price > 0)) {
    return res.status(400).json({ message: 'Quote unavailable. Execution rejected.' });
  }

  const priceNumber = resolved.price;
  const earnings = Number((qtyNumber * priceNumber).toFixed(2));

  const session = await mongoose.startSession();
  try {
    let resultData = null;
    await session.withTransaction(async () => {
      // All DB work inside the transaction (concurrent-SELL protection)
      const userTxns = await Transaction.find({ userId: uid }).session(session);
      let totalQty = 0;
      userTxns.forEach(t => {
        if (canonicalizeSymbol(t.symbol) === symClean) {
          if (t.transactionType === 'BUY') totalQty += t.quantity;
          if (t.transactionType === 'SELL') totalQty -= t.quantity;
        }
      });

      if (totalQty < qtyNumber) {
        throw new Error(`Insufficient holdings! You only have ${totalQty} shares of ${symClean}.`);
      }

      const user = await User.findOneAndUpdate(
        { _id: uid },
        [{ $set: { virtualBalance: { $round: [{ $add: ['$virtualBalance', earnings] }, 2] } } }],
        { new: true, session }
      );
      if (!user) throw new Error('User not found');

      const newTxn = new Transaction({
        userId: uid,
        symbol: symClean,
        transactionType: 'SELL',
        quantity: qtyNumber,
        pricePerShare: priceNumber,
        totalAmount: earnings,
      });
      await newTxn.save({ session });

      const recentTrades = await Transaction.find({ userId: uid })
        .sort({ createdAt: -1 }).limit(10).session(session);
      const bias = brain.getBiasSummary(symClean);
      const aiFeedback = aiCoach.evaluateTrade(symClean, 'SELL', qtyNumber, priceNumber, bias, recentTrades);

      resultData = {
        success: true,
        message: 'Sell Order Executed!',
        balance: user.virtualBalance,
        executedPrice: priceNumber,
        priceMode: resolved.mode,
        aiFeedback
      };
    });

    if (resultData) {
      invalidateLeaderboardCache();
      return res.json(resultData);
    }
  } catch (error) {
    console.error('Sell Error:', error.message);
    const knownMsgs = ['Insufficient holdings', 'User not found', 'Authentication'];
    const msg = knownMsgs.some(k => error.message.includes(k)) ? error.message : 'Internal Server Error';
    return res.status(msg === 'Internal Server Error' ? 500 : 400).json({ message: msg });
  } finally {
    await session.endSession();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 📌 ROUTE: Add Funds to Wallet (Deposit)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/deposit', fetchuser, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    let depositAmount = Number(amount);
    if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: 'Deposit amount must be a positive number.' });
    }

    // Normalize to two decimals before pipeline
    depositAmount = Math.round(depositAmount * 100) / 100;

    if (depositAmount <= 0) {
      return res.status(400).json({ message: 'Deposit amount must be greater than zero.' });
    }
    if (depositAmount > 10000000) {
      return res.status(400).json({ message: 'Deposit amount cannot exceed ₹1,00,00,000.' });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId },
      [{ $set: {
          virtualBalance: { $round: [{ $add: ['$virtualBalance', depositAmount] }, 2] },
          totalDeposited: { $round: [{ $add: [{ $ifNull: ['$totalDeposited', 0] }, depositAmount] }, 2] }
      } }],
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found!' });

    invalidateLeaderboardCache();
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

    res.json(enriched.reverse());
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

    // Validate and de-duplicate symbols, enforcing max batch size (e.g. 50)
    const validSymbols = [...new Set(symbols)].filter(s => isValidSymbol(s)).slice(0, 50);
    if (validSymbols.length === 0) return res.json({});

    const canonicals = validSymbols.map(s => canonicalizeSymbol(s));

    // Process prices via MarketPriceService
    const resolved = await resolveMarkPrices(canonicals);

    // Map canonicals back to requested original symbols (if client passed e.g., RELIANCE.NS, wait client should pass canonical now but in case it passed original)
    const livePrices = {};
    validSymbols.forEach((orig, idx) => {
      livePrices[orig] = resolved[canonicals[idx]];
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

    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ message: 'Unsupported symbol' });
    }

    const yahooTarget = toYahooSymbol(canonicalizeSymbol(symbol));
    const interval = normalizeInterval(req.query.interval || '15m');
    if (!interval) {
      return res.status(400).json({ message: 'Invalid interval' });
    }

    let period1Time = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (interval === '1m') {
      period1Time = Date.now() - 7 * 24 * 60 * 60 * 1000;
    } else if (['2m', '5m', '15m', '30m', '1h'].includes(interval)) {
      period1Time = Date.now() - 59 * 24 * 60 * 60 * 1000;
    } else if (['1d', '1wk', '1mo'].includes(interval)) {
      period1Time = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000;
    }

    const queryOptions = {
      period1: new Date(period1Time),
      interval: interval,
    };

    const fetchWithTimeout = (timeoutMs) => {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Yahoo Finance request timed out')), timeoutMs)
      );
      return Promise.race([
        yahooFinance.chart(yahooTarget, queryOptions, { validateResult: false }),
        timeoutPromise,
      ]);
    };

    const result = await fetchWithTimeout(10000);

    if (!result || !result.quotes || result.quotes.length === 0) {
      return res.status(404).json({ message: 'No chart data available for this symbol' });
    }

    const chartData = result.quotes
      .filter(c => c.close !== null && c.close !== undefined)
      .map(c => ({
        time: Math.floor(new Date(c.date).getTime() / 1000),
        value: Number(c.close.toFixed(2)),
        open: Number(c.open?.toFixed(2) || c.close.toFixed(2)),
        high: Number(c.high?.toFixed(2) || c.close.toFixed(2)),
        low: Number(c.low?.toFixed(2) || c.close.toFixed(2)),
        close: Number(c.close.toFixed(2)),
        volume: c.volume || 0
      }));

    res.json(chartData);
  } catch (error) {
    console.error('Chart Error for ' + req.params.symbol + ':', error.message);
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
      const sym = canonicalizeSymbol(t.symbol);
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
    await User.findByIdAndUpdate(userId, { virtualBalance: 1000000, totalDeposited: 0 });
    invalidateLeaderboardCache();
    res.json({ success: true, message: 'Portfolio & Ledger reset successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;