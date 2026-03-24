const express = require('express');
const router = express.Router();

const { authMiddleware, requireDealer } = require('../middleware/authMiddleware');

const {
  getMyWallet,
  addCoinsToMyWallet,
  spendCoinsFromMyWallet,
  redeemReward,
  getMyReferrals,
  getDealerAnalytics,
  getLeaderboard,
} = require('../controllers/dealerController');

router.get('/me/wallet', authMiddleware, requireDealer, getMyWallet);
router.post('/me/wallet/earn', authMiddleware, requireDealer, addCoinsToMyWallet);
router.post('/me/wallet/spend', authMiddleware, requireDealer, spendCoinsFromMyWallet);
router.post('/me/rewards/redeem', authMiddleware, requireDealer, redeemReward);
router.get('/me/referrals', authMiddleware, requireDealer, getMyReferrals);
router.get('/me/analytics', authMiddleware, requireDealer, getDealerAnalytics);
router.get('/leaderboard', authMiddleware, requireDealer, getLeaderboard);

module.exports = router;
