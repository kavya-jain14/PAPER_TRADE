const express = require('express');
const router = express.Router();
const User = require('../models/User');
const fetchuser = require('../middleware/fetchuser');

// Helper to anonymize name (e.g., "Kavya Jain" -> "Kavya J.")
const formatName = (fullName) => {
  if (!fullName) return 'Anonymous';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 ROUTE: Get Global Leaderboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', fetchuser, async (req, res) => {
  try {
    const uid = req.user.userId;
    if (!uid) return res.status(400).json({ message: 'Authentication failure.' });

    // Fetch top 100 users, sorted by balance (desc) and name (asc) for tie-breaking
    const topUsers = await User.find()
      .sort({ virtualBalance: -1, name: 1 })
      .limit(100)
      .select('name virtualBalance _id');

    // Format the list
    const leaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u._id.toString(),
      name: formatName(u.name),
      balance: u.virtualBalance,
      isCurrentUser: u._id.toString() === uid
    }));

    // Check if current user is in top 100
    let currentUserRankData = leaderboard.find(u => u.isCurrentUser);

    // If not in top 100, calculate their real rank
    if (!currentUserRankData) {
      const currentUser = await User.findById(uid).select('virtualBalance name');
      if (currentUser) {
        // Count how many users have a strictly greater balance
        // Or same balance but name is alphabetically before
        const higherBalanceCount = await User.countDocuments({
          virtualBalance: { $gt: currentUser.virtualBalance }
        });
        
        const sameBalanceHigherNameCount = await User.countDocuments({
          virtualBalance: currentUser.virtualBalance,
          name: { $lt: currentUser.name }
        });

        const actualRank = higherBalanceCount + sameBalanceHigherNameCount + 1;

        currentUserRankData = {
          rank: actualRank,
          id: uid,
          name: formatName(currentUser.name),
          balance: currentUser.virtualBalance,
          isCurrentUser: true
        };
      }
    }

    res.json({
      leaderboard,
      currentUser: currentUserRankData
    });

  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard.' });
  }
});

module.exports = router;
