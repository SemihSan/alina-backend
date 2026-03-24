// src/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getProductReviews,
  createReview,
  markReviewHelpful,
} = require('../controllers/reviewController');

// Ürünün yorumlarını getir (herkes görebilir)
router.get('/products/:productId/reviews', getProductReviews);

// Yorum ekle (giriş yapmış kullanıcı)
router.post('/products/:productId/reviews', authMiddleware, createReview);

// Yorumu yararlı bul (herkes)
router.put('/reviews/:reviewId/helpful', markReviewHelpful);

module.exports = router;
