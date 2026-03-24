// src/services/badgeService.js

// Rozet sistemi servisi:
// - Referans sayısına göre rozet güncelleme
// - Rozetlere göre indirim oranları
// - Rozetlere göre coin kazanma oranları

const prisma = require('../lib/prisma');

// Rozet eşikleri (referans sayısına göre)
const BADGE_THRESHOLDS = {
  STANDARD: 0,
  BRONZE: 5,
  GOLD: 20,
  PLATINUM: 50,
};

// Rozetlere göre indirim oranları (yüzde olarak)
const BADGE_DISCOUNT_RATES = {
  STANDARD: 0,    // %0 indirim
  BRONZE: 5,      // %5 indirim
  GOLD: 10,       // %10 indirim
  PLATINUM: 15,   // %15 indirim
};

// Rozetlere göre puan kazanma bonus oranları (çarpım faktörü)
// Örnek: GOLD rozetli bayi normalde 100 puan kazanacaksa, 1.2x ile 120 puan kazanır
const BADGE_COIN_BONUS_RATES = {
  STANDARD: 1.0,   // %0 bonus
  BRONZE: 1.1,     // %10 bonus
  GOLD: 1.2,       // %20 bonus
  PLATINUM: 1.5,   // %50 bonus
};

// Bir bayinin referans sayısına göre rozetini hesapla ve güncelle
async function updateDealerBadge(dealerId) {
  // Bayinin referans sayısını al
  const dealer = await prisma.dealer.findUnique({
    where: { id: dealerId },
    include: {
      user: {
        include: {
          referrals: true, // Bu bayinin referans kodunu kullananlar
        },
      },
    },
  });

  if (!dealer) {
    throw new Error('Bayi bulunamadı.');
  }

  // Referans sayısı (bu bayinin userId'si ile referrerUserId eşleşenler)
  const referralCount = dealer.user.referrals.length;

  // Referans sayısına göre rozet belirle
  let newBadge = 'STANDARD';
  if (referralCount >= BADGE_THRESHOLDS.PLATINUM) {
    newBadge = 'PLATINUM';
  } else if (referralCount >= BADGE_THRESHOLDS.GOLD) {
    newBadge = 'GOLD';
  } else if (referralCount >= BADGE_THRESHOLDS.BRONZE) {
    newBadge = 'BRONZE';
  }

  // Eğer rozet değiştiyse güncelle
  if (dealer.badge !== newBadge) {
    await prisma.dealer.update({
      where: { id: dealerId },
      data: { badge: newBadge },
    });
  }

  return {
    badge: newBadge,
    referralCount,
    previousBadge: dealer.badge,
    badgeUpgraded: dealer.badge !== newBadge,
  };
}

// Bir bayinin rozetine göre indirim oranını al
function getDiscountRate(badge) {
  return BADGE_DISCOUNT_RATES[badge] || 0;
}

// Bir bayinin rozetine göre puan bonus oranını al
function getCoinBonusRate(badge) {
  return BADGE_COIN_BONUS_RATES[badge] || 1.0;
}

// Bir bayinin rozetine göre indirimli fiyatı hesapla
function calculateDiscountedPrice(originalPriceCents, badge) {
  const discountRate = getDiscountRate(badge);
  const discountAmount = Math.round((originalPriceCents * discountRate) / 100);
  return originalPriceCents - discountAmount;
}

// Bir bayinin rozetine göre puan kazanma miktarını hesapla
function calculateCoinEarning(baseCoinAmount, badge) {
  const bonusRate = getCoinBonusRate(badge);
  return Math.round(baseCoinAmount * bonusRate);
}

// Rozet bilgilerini al (frontend için)
function getBadgeInfo(badge) {
  const nextBadge = getNextBadge(badge);
  return {
    badge,
    name: getBadgeDisplayName(badge),
    discountRate: getDiscountRate(badge),
    coinBonusRate: getCoinBonusRate(badge),
    threshold: BADGE_THRESHOLDS[badge],
    nextBadge: nextBadge,
    nextBadgeThreshold: nextBadge ? BADGE_THRESHOLDS[nextBadge] : null,
    referralsNeeded: getReferralsNeededForNextBadge(badge),
  };
}

// Rozet görünen adı
function getBadgeDisplayName(badge) {
  const names = {
    STANDARD: 'Standart',
    BRONZE: 'Bronz',
    GOLD: 'Altın',
    PLATINUM: 'Platin',
  };
  return names[badge] || 'Bilinmeyen';
}

// Bir sonraki rozet
function getNextBadge(badge) {
  const order = ['STANDARD', 'BRONZE', 'GOLD', 'PLATINUM'];
  const currentIndex = order.indexOf(badge);
  if (currentIndex < order.length - 1) {
    return order[currentIndex + 1];
  }
  return null; // En üst rozet
}

// Bir sonraki rozet için gereken referans sayısı
function getReferralsNeededForNextBadge(badge) {
  const nextBadge = getNextBadge(badge);
  if (!nextBadge) return null;
  return BADGE_THRESHOLDS[nextBadge];
}

module.exports = {
  updateDealerBadge,
  getDiscountRate,
  getCoinBonusRate,
  calculateDiscountedPrice,
  calculateCoinEarning,
  getBadgeInfo,
  BADGE_THRESHOLDS,
  BADGE_DISCOUNT_RATES,
  BADGE_COIN_BONUS_RATES,
};

