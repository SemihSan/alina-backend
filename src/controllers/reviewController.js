// src/controllers/reviewController.js

const prisma = require('../lib/prisma');

// GET /api/products/:productId/reviews
// Bir ürünün tüm yorumlarını getir
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: {
        productId: parseInt(productId),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Rating istatistiklerini hesapla
    const stats = {
      average: 0,
      total: reviews.length,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (reviews.length > 0) {
      let totalRating = 0;
      reviews.forEach(review => {
        stats.distribution[review.rating]++;
        totalRating += review.rating;
      });
      stats.average = parseFloat((totalRating / reviews.length).toFixed(1));
    }

    return res.json({
      ok: true,
      reviews: reviews.map(review => ({
        id: review.id,
        userName: review.user.fullName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images || [],
        helpful: review.helpful,
        verified: review.verified,
        date: review.createdAt,
      })),
      stats,
    });
  } catch (error) {
    console.error('getProductReviews error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Yorumlar alınırken bir hata oluştu.',
      detail: error.message,
    });
  }
};

// POST /api/products/:productId/reviews
// Ürüne yorum ekle (giriş yapmış kullanıcı)
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user.id; // authMiddleware'den gelecek

    // Validasyon
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        ok: false,
        message: 'Geçerli bir puan (1-5) giriniz.',
      });
    }

    if (!title || !comment) {
      return res.status(400).json({
        ok: false,
        message: 'Başlık ve yorum zorunludur.',
      });
    }

    // Kullanıcı bu ürünü daha önce satın aldı mı kontrol et (verified için)
    const userOrders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'DELIVERED',
      },
    });

    let verified = false;
    for (const order of userOrders) {
      const items = order.items || [];
      if (items.some(item => item.productId === parseInt(productId))) {
        verified = true;
        break;
      }
    }

    // Yorumu oluştur
    const review = await prisma.review.create({
      data: {
        userId,
        productId: parseInt(productId),
        rating: parseInt(rating),
        title,
        comment,
        images: images || [],
        verified,
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return res.json({
      ok: true,
      message: 'Yorumunuz başarıyla eklendi!',
      review: {
        id: review.id,
        userName: review.user.fullName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        helpful: review.helpful,
        verified: review.verified,
        date: review.createdAt,
      },
    });
  } catch (error) {
    console.error('createReview error:', error);

    // Unique constraint hatası - kullanıcı zaten yorum yapmış
    if (error.code === 'P2002') {
      return res.status(400).json({
        ok: false,
        message: 'Bu ürüne daha önce yorum yaptınız.',
      });
    }

    return res.status(500).json({
      ok: false,
      message: 'Yorum eklenirken bir hata oluştu.',
      detail: error.message,
    });
  }
};

// PUT /api/reviews/:reviewId/helpful
// Yorumu yararlı bul
const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.update({
      where: {
        id: parseInt(reviewId),
      },
      data: {
        helpful: {
          increment: 1,
        },
      },
    });

    return res.json({
      ok: true,
      helpful: review.helpful,
    });
  } catch (error) {
    console.error('markReviewHelpful error:', error);
    return res.status(500).json({
      ok: false,
      message: 'İşlem başarısız.',
      detail: error.message,
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  markReviewHelpful,
};
