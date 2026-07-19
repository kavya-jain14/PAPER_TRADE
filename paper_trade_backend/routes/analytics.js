const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const fetchuser = require('../middleware/fetchuser');

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Get Portfolio Analytics Metrics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/metrics', fetchuser, async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) return res.status(400).json({ message: 'Authentication failure.' });

    // Fetch all transactions for the user, sorted chronologically
    const txns = await Transaction.find({ userId: uid }).sort({ createdAt: 1 });

    if (!txns || txns.length === 0) {
      return res.json({
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        realizedPnL: 0,
        bestTrade: null,
        worstTrade: null,
        history: [] // For equity curve
      });
    }

    // --- Analytics Engine ---
    let totalRealizedPnL = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    // Track state per symbol to calculate Realized P&L using Average Cost
    const positions = {}; // { [symbol]: { qty, totalCost } }
    
    // For equity curve
    let runningRealizedPnL = 0;
    const equityCurve = [];
    
    let bestTrade = { symbol: '', pnl: -Infinity };
    let worstTrade = { symbol: '', pnl: Infinity };

    for (const txn of txns) {
      const { symbol, transactionType, quantity, totalAmount, createdAt } = txn;

      if (!positions[symbol]) {
        positions[symbol] = { qty: 0, totalCost: 0 };
      }

      const pos = positions[symbol];

      if (transactionType === 'BUY') {
        pos.qty += quantity;
        pos.totalCost += totalAmount;
      } else if (transactionType === 'SELL') {
        // Calculate realized PnL for this specific sell transaction
        if (pos.qty > 0) {
          const avgCostPerShare = pos.totalCost / pos.qty;
          const costBasisOfSoldShares = avgCostPerShare * quantity;
          const realizedTradePnL = totalAmount - costBasisOfSoldShares;

          totalRealizedPnL += realizedTradePnL;
          runningRealizedPnL += realizedTradePnL;
          
          if (realizedTradePnL > 0) {
            winningTrades++;
            grossProfit += realizedTradePnL;
          } else if (realizedTradePnL < 0) {
            losingTrades++;
            grossLoss += Math.abs(realizedTradePnL);
          }

          // Track extremes
          if (realizedTradePnL > bestTrade.pnl) bestTrade = { symbol, pnl: realizedTradePnL };
          if (realizedTradePnL < worstTrade.pnl) worstTrade = { symbol, pnl: realizedTradePnL };

          // Adjust position state
          pos.qty -= quantity;
          pos.totalCost -= costBasisOfSoldShares;
        }
      }

      // Add point to equity curve for each transaction (using date string to group later if needed)
      equityCurve.push({
        date: new Date(createdAt).toISOString().split('T')[0],
        time: new Date(createdAt).getTime(),
        pnl: runningRealizedPnL
      });
    }

    // Consolidate equity curve by day (take the last value of each day)
    const dailyCurveMap = new Map();
    equityCurve.forEach(point => {
      dailyCurveMap.set(point.date, point.pnl);
    });
    
    const finalEquityCurve = Array.from(dailyCurveMap.entries())
      .map(([date, pnl]) => ({ time: date, value: Number(pnl.toFixed(2)) }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    const totalClosedTrades = winningTrades + losingTrades;
    const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 999 : 0);

    res.json({
      totalClosedTrades,
      totalRealizedPnL: Number(totalRealizedPnL.toFixed(2)),
      winRate: Number(winRate.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      bestTrade: bestTrade.pnl !== -Infinity ? { ...bestTrade, pnl: Number(bestTrade.pnl.toFixed(2)) } : null,
      worstTrade: worstTrade.pnl !== Infinity ? { ...worstTrade, pnl: Number(worstTrade.pnl.toFixed(2)) } : null,
      equityCurve: finalEquityCurve
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Failed to generate analytics.' });
  }
});

module.exports = router;
