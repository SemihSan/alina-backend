// src/controllers/dealerController.js

const prisma = require('../lib/prisma');
const {
  addCoinsToDealer,
  spendCoinsFromDealer,
  redeemRewardForDealer,
} = require('../services/coinService');
const { getBadgeInfo, updateDealerBadge } = require('../services/badgeService');

// GET /dealers/me/wallet
const getMyWallet = async (req, res) => {
  try {
    const { userId } = req.user;

    const dealer = await prisma.dealer.findUnique({
      where: { userId },
      include: {
        coinWallet: true,
        coinTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!dealer) {
      return res.status(404).json({
        ok: false,
        message: 'Bu kullanıcıya ait bayi kaydı bulunamadı.',
      });
    }

    // Rozet bilgisini al
    const badgeInfo = getBadgeInfo(dealer.badge);

    return res.json({
      ok: true,
      dealer: {
        id: dealer.id,
        companyName: dealer.companyName,
        status: dealer.status,
        referralCode: dealer.referralCode,
        badge: dealer.badge,
        badgeInfo,
      },
      wallet: {
        balance: dealer.coinWallet ? dealer.coinWallet.balance : 0,
      },
      recentTransactions: dealer.coinTransactions.map((tx) => ({
        id: tx.id,
        change: tx.change,
        type: tx.type,
        description: tx.description,
        relatedOrderId: tx.relatedOrderId,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error('getMyWallet error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Cüzdan bilgisi alınırken bir hata oluştu.',
    });
  }
};

// POST /dealers/me/wallet/earn
const addCoinsToMyWallet = async (req, res) => {
  try {
    const { userId } = req.user; // JWT'den gelen userId
    const { amount, type, description, relatedOrderId } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({
        ok: false,
        message: 'amount alanı zorunludur ve number olmalıdır.',
      });
    }

    const txType = type || 'ADMIN_ADJUST';

    const dealer = await prisma.dealer.findUnique({
      where: { userId },
    });

    if (!dealer) {
      return res.status(404).json({
        ok: false,
        message: 'Bu kullanıcıya ait bayi kaydı bulunamadı.',
      });
    }

    const result = await addCoinsToDealer({
      dealerId: dealer.id,
      amount,
      type: txType,
      description,
      relatedOrderId,
    });

    return res.status(200).json({
      ok: true,
      message: 'Puan işlemi başarılı.',
      wallet: {
        balance: result.wallet.balance,
      },
      transaction: {
        id: result.transaction.id,
        change: result.transaction.change,
        type: result.transaction.type,
        description: result.transaction.description,
        relatedOrderId: result.transaction.relatedOrderId,
        createdAt: result.transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('addCoinsToMyWallet error:', error);
    return res.status(400).json({
      ok: false,
      message: error.message || 'Puan ekleme sırasında bir hata oluştu.',
    });
  }
};

// POST /dealers/me/wallet/spend
const spendCoinsFromMyWallet = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, description, relatedOrderId } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({
        ok: false,
        message: 'amount alanı zorunludur ve number olmalıdır.',
      });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId },
    });

    if (!dealer) {
      return res.status(404).json({
        ok: false,
        message: 'Bu kullanıcıya ait bayi kaydı bulunamadı.',
      });
    }

    const result = await spendCoinsFromDealer({
      dealerId: dealer.id,
      amount,
      description,
      relatedOrderId,
    });

    return res.status(200).json({
      ok: true,
      message: 'Puan harcama işlemi başarılı.',
      wallet: {
        balance: result.wallet.balance,
      },
      transaction: {
        id: result.transaction.id,
        change: result.transaction.change,
        type: result.transaction.type,
        description: result.transaction.description,
        relatedOrderId: result.transaction.relatedOrderId,
        createdAt: result.transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('spendCoinsFromMyWallet error:', error);
    return res.status(400).json({
      ok: false,
      message: error.message || 'Puan harcama sırasında bir hata oluştu.',
    });
  }
};

// POST /dealers/me/rewards/redeem
const redeemReward = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productSlug } = req.body;

    if (!productSlug) {
      return res.status(400).json({
        ok: false,
        message: 'productSlug alanı zorunludur.',
      });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId },
    });

    if (!dealer) {
      return res.status(404).json({
        ok: false,
        message: 'Bu kullanıcıya ait bayi kaydı bulunamadı.',
      });
    }

    const result = await redeemRewardForDealer({
      dealerId: dealer.id,
      productSlug,
    });

    return res.status(200).json({
      ok: true,
      message: 'Ödül ürünü başarıyla kullanıldı.',
      wallet: {
        balance: result.wallet.balance,
      },
      reward: {
        productId: result.product.id,
        name: result.product.name,
        slug: result.product.slug,
        coinPrice: result.product.coinPrice,
      },
      transaction: {
        id: result.transaction.id,
        change: result.transaction.change,
        type: result.transaction.type,
        description: result.transaction.description,
        relatedOrderId: result.transaction.relatedOrderId,
        createdAt: result.transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('redeemReward error:', error);
    return res.status(400).json({
      ok: false,
      message: error.message || 'Ödül ürünü kullanılırken bir hata oluştu.',
    });
  }
};

// GET /dealers/me/referrals
// Bu bayi üzerinden kayıt olan kullanıcıları listeler
const getMyReferrals = async (req, res) => {
  try {
    const { userId } = req.user;

    // 1) Kullanıcıya ait bayi kaydı var mı?
    const dealer = await prisma.dealer.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        referralCode: true,
        badge: true,
      },
    });

    if (!dealer) {
      return res.status(404).json({
        ok: false,
        message: 'Bu kullanıcıya ait bayi kaydı bulunamadı.',
      });
    }

    // 2) Bu kullanıcı (dealer.userId) referrerUserId olarak Referral tablosunda geçiyor mu?
    const referrals = await prisma.referral.findMany({
      where: { referrerUserId: userId },
      include: {
        referredUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Rozet bilgisini al ve güncelle (referans sayısı değişmiş olabilir)
    const badgeUpdateResult = await updateDealerBadge(dealer.id);
    const updatedDealer = await prisma.dealer.findUnique({
      where: { id: dealer.id },
      select: {
        id: true,
        companyName: true,
        referralCode: true,
        badge: true,
      },
    });
    const badgeInfo = getBadgeInfo(updatedDealer.badge);

    return res.json({
      ok: true,
      dealer: {
        ...updatedDealer,
        badgeInfo,
      },
      stats: {
        totalReferrals: referrals.length,
        badgeUpgraded: badgeUpdateResult.badgeUpgraded,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        user: {
          id: r.referredUser.id,
          fullName: r.referredUser.fullName,
          email: r.referredUser.email,
          role: r.referredUser.role,
        },
      })),
    });
  } catch (error) {
    console.error('getMyReferrals error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Referans listesi alınırken bir hata oluştu.',
    });
  }
};

// GET /dealers/me/analytics
const getDealerAnalytics = async (req, res) => {
  try {
    const { userId } = req.user;

    // 1. Mevcut bayinin referans sayısını al
    const myReferralsCount = await prisma.referral.count({
      where: { referrerUserId: userId },
    });

    // 2. Tüm bayilerin referans sayılarını hesapla
    const allDealersReferralCounts = await prisma.referral.groupBy({
      by: ['referrerUserId'],
      _count: {
        referrerUserId: true,
      },
    });

    let totalReferrals = 0;
    let topReferrals = 0;
    allDealersReferralCounts.forEach(group => {
      const count = group._count.referrerUserId;
      totalReferrals += count;
      if (count > topReferrals) {
        topReferrals = count;
      }
    });

    const totalDealers = await prisma.dealer.count();
    const averageReferrals = totalDealers > 0 ? totalReferrals / totalDealers : 0;
    
    // 3. Rozet ilerlemesini hesapla
    const dealer = await prisma.dealer.findUnique({ where: { userId } });
    const badgeInfo = getBadgeInfo(dealer.badge);
    
    const nextBadgeGoal = badgeInfo.nextBadgeThreshold || myReferralsCount;
    const referralsForNextBadge = badgeInfo.nextBadge 
      ? Math.max(0, badgeInfo.nextBadgeThreshold - myReferralsCount)
      : 0;

    return res.json({
      ok: true,
      data: {
        // Rakip Karşılaştırma Grafiği için veri
        performanceComparison: {
          myReferrals: myReferralsCount,
          averageReferrals: Math.round(averageReferrals),
          topReferrals: topReferrals,
        },
        // Dairesel Satış Grafiği için veri
        badgeProgress: {
          currentReferrals: myReferralsCount,
          nextBadgeGoal: nextBadgeGoal,
          referralsNeeded: referralsForNextBadge,
          currentBadgeName: badgeInfo.name,
          nextBadgeName: badgeInfo.nextBadge ? getBadgeInfo(badgeInfo.nextBadge).name : null,
        },
      },
    });

  } catch (error) {
    console.error('getDealerAnalytics error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Analitik verileri alınırken bir hata oluştu.',
    });
  }
};


// GET /dealers/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { userId } = req.user;
    const { period = 'all' } = req.query; // 'week', 'month', 'all'

    // Tarih filtresi
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { gte: monthAgo } };
    }

    // Tüm bayileri referans sayılarıyla birlikte getir
    const dealers = await prisma.dealer.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            referrals: {
              where: dateFilter,
            },
          },
        },
      },
    });

    // Sıralama için referans sayılarını hesapla
    const leaderboardData = dealers.map((dealer) => {
      const referralCount = (dealer.user?.referrals && Array.isArray(dealer.user.referrals)) 
        ? dealer.user.referrals.length 
        : 0;
      const badgeInfo = getBadgeInfo(dealer.badge);
      
      return {
        id: dealer.id,
        companyName: dealer.companyName,
        referralCode: dealer.referralCode,
        badge: dealer.badge,
        badgeInfo,
        referralCount,
        isCurrentUser: dealer.userId === userId,
      };
    });

    // Referans sayısına göre sırala
    leaderboardData.sort((a, b) => b.referralCount - a.referralCount);

    // Sıralama numarası ekle
    leaderboardData.forEach((dealer, index) => {
      dealer.rank = index + 1;
    });

    // Kendi sıralamayı bul
    const currentDealerRank = leaderboardData.find(d => d.isCurrentUser);

    return res.json({
      ok: true,
      period,
      leaderboard: leaderboardData,
      currentUserRank: currentDealerRank ? currentDealerRank.rank : null,
      totalDealers: leaderboardData.length,
    });

  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Sıralama tablosu alınırken bir hata oluştu.',
    });
  }
};


module.exports = {
  getMyWallet,
  addCoinsToMyWallet,
  spendCoinsFromMyWallet,
  redeemReward,
  getMyReferrals,
  getDealerAnalytics,
  getLeaderboard,
};
