const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fetchuser = require('../middleware/fetchuser');
const brain = require('../engine/marketBrain');
const { canonicalizeSymbol, isValidSymbol } = require('../utils/validators');
const {
  resolveMarkPrices,
  getFreshLeaderboardCache,
  getStaleLeaderboardCache,
  setLeaderboardCache
} = require('../services/marketPriceService');

const formatName = (fullName) => {
  if (!fullName) return 'Anonymous';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build a ranked snapshot: returns array of { rank, id, name, equity }
// or null when LIVE mark prices are incomplete (any symbol returned null).
// ─────────────────────────────────────────────────────────────────────────────
async function buildSnapshot() {
  // 1. Eligible users: no deposits
  const eligibleUsers = await User.find({
    $or: [{ totalDeposited: 0 }, { totalDeposited: { $exists: false } }]
  }).select('name virtualBalance _id');

  const userIds = eligibleUsers.map(u => u._id);

  // 2. Aggregate net holdings via MongoDB pipeline
  const holdingsAgg = await Transaction.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: { userId: '$userId', symbol: '$symbol' },
        netQty: {
          $sum: {
            $cond: [{ $eq: ['$transactionType', 'BUY'] }, '$quantity', { $multiply: ['$quantity', -1] }]
          }
        }
      }
    }
  ]);

  const userHoldings = {};
  const symbolsHeld = new Set();
  let hasUnsupportedSymbols = false;

  holdingsAgg.forEach(doc => {
    const rawSymbol = doc._id.symbol;
    const canSymbol = canonicalizeSymbol(rawSymbol);
    if (!canSymbol || !isValidSymbol(canSymbol)) {
      hasUnsupportedSymbols = true;
      return;
    }

    const uid = doc._id.userId.toString();
    if (!userHoldings[uid]) userHoldings[uid] = {};
    if (!userHoldings[uid][canSymbol]) userHoldings[uid][canSymbol] = 0;
    userHoldings[uid][canSymbol] += doc.netQty;
  });

  Object.keys(userHoldings).forEach(uid => {
    Object.keys(userHoldings[uid]).forEach(sym => {
      if (userHoldings[uid][sym] <= 0) {
        delete userHoldings[uid][sym];
      } else {
        symbolsHeld.add(sym);
      }
    });
  });

  if (hasUnsupportedSymbols) return null; // Reject snapshot if any legacy symbol is unsupported

  // 3. Batch fetch mark prices
  const livePricesData = await resolveMarkPrices(Array.from(symbolsHeld));

  // Determine authoritative mode if we hold 0 symbols
  let finalPriceMode = null;
  if (symbolsHeld.size === 0) {
    finalPriceMode = brain.isMarketOpen() ? 'LIVE' : 'SIMULATED';
  } else {
    finalPriceMode = Object.values(livePricesData)[0]?.priceMode;
  }

  // Reject the snapshot if any required price came back null/invalid
  for (const sym of symbolsHeld) {
    const data = livePricesData[sym];
    if (!data || data.price === null || data.price === undefined || data.price <= 0 || !Number.isFinite(data.price)) {
      return null; // signal failure to caller (incomplete/missing prices)
    }
  }

  // 4. Compute marked-to-market equity for every eligible user
  const usersWithEquity = eligibleUsers.map(u => {
    const uId = u._id.toString();
    let equity = u.virtualBalance;
    const holdings = userHoldings[uId] || {};
    Object.keys(holdings).forEach(sym => {
      const qty = holdings[sym];
      const priceEntry = livePricesData[sym];
      equity += qty * priceEntry.price;
    });
    return {
      _id: u._id,
      id: u._id.toString(),
      name: u.name,
      equity: parseFloat(equity.toFixed(2))
    };
  });

  // 5. Sort descending by equity, alphabetically on tie
  usersWithEquity.sort((a, b) => {
    if (b.equity !== a.equity) return b.equity - a.equity;
    return a.name.localeCompare(b.name);
  });

  return {
    priceMode: finalPriceMode,
    users: usersWithEquity.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: formatName(u.name),
      equity: u.equity
    }))
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Get Global Leaderboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', fetchuser, async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) return res.status(400).json({ message: 'Authentication failure.' });

    const currentMode = brain.isMarketOpen() ? 'LIVE' : 'SIMULATED';

    // Try fresh cache first
    let allRankedUsers = getFreshLeaderboardCache(currentMode)?.allRankedUsers || null;

    if (!allRankedUsers) {
      // Build a new snapshot
      const built = await buildSnapshot();

      if (built !== null && built.priceMode === currentMode) {
        // Successfully built — store in both caches
        setLeaderboardCache({ allRankedUsers: built.users }, currentMode);
        allRankedUsers = built.users;
      } else {
        // Mark prices incomplete — try stale snapshot
        const stale = getStaleLeaderboardCache(currentMode);
        if (stale) {
          allRankedUsers = stale.allRankedUsers;
        } else {
          // No snapshot at all — 503
          return res.status(503).json({
            message: 'Market prices temporarily unavailable. Try again shortly.'
          });
        }
      }
    }

    const topUsers = allRankedUsers.slice(0, 100);

    const requestLeaderboard = topUsers.map(u => ({
      ...u,
      isCurrentUser: u.id === uid
    }));

    let currentUserRankData = requestLeaderboard.find(u => u.isCurrentUser) || null;

    // If current user not in top 100, look up their info
    if (!currentUserRankData) {
      const currentUser = await User.findById(uid).select('name virtualBalance totalDeposited');
      if (currentUser) {
        const cachedEntry = allRankedUsers.find(u => u.id === uid);

        if (currentUser.totalDeposited > 0) {
          // Compute their marked-to-market equity too (so the panel is accurate)
          const myTxns = await Transaction.aggregate([
            { $match: { userId: currentUser._id } },
            {
              $group: {
                _id: '$symbol',
                netQty: {
                  $sum: {
                    $cond: [{ $eq: ['$transactionType', 'BUY'] }, '$quantity', { $multiply: ['$quantity', -1] }]
                  }
                }
              }
            }
          ]);

          let equity = currentUser.virtualBalance;
          let isValidSnapshot = true;
          if (myTxns.length > 0) {
            const syms = [];
            const qtyMap = {};
            myTxns.forEach(t => {
              const cs = canonicalizeSymbol(t._id);
              if (!cs || !isValidSymbol(cs)) {
                isValidSnapshot = false;
              } else {
                qtyMap[cs] = (qtyMap[cs] || 0) + t.netQty;
              }
            });

            Object.keys(qtyMap).forEach(sym => {
              if (qtyMap[sym] > 0) syms.push(sym);
              else delete qtyMap[sym];
            });

            if (isValidSnapshot) {
              const prices = await resolveMarkPrices(syms);
              syms.forEach(sym => {
                const p = prices[sym];
                if (!p || p.price === null || p.price === undefined || p.price <= 0 || !Number.isFinite(p.price)) {
                  isValidSnapshot = false;
                } else {
                  equity += qtyMap[sym] * p.price;
                }
              });
            }
          }

          if (!isValidSnapshot) {
            return res.status(503).json({ message: 'Market prices temporarily unavailable. Try again shortly.' });
          }

          currentUserRankData = {
            rank: '—',
            id: uid,
            name: formatName(currentUser.name),
            equity: parseFloat(equity.toFixed(2)),
            isCurrentUser: true,
            unrankedReason: 'UNRANKED · FUNDS ADDED'
          };
        } else if (cachedEntry) {
          currentUserRankData = { ...cachedEntry, isCurrentUser: true };
        } else {
          // New user with no transactions yet
          currentUserRankData = {
            rank: allRankedUsers.length + 1,
            id: uid,
            name: formatName(currentUser.name),
            equity: currentUser.virtualBalance,
            isCurrentUser: true
          };
        }
      }
    }

    res.json({
      leaderboard: requestLeaderboard,
      currentUser: currentUserRankData
    });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard.' });
  }
});

module.exports = router;
