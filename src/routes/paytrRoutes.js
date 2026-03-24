// src/routes/paytrRoutes.js

const express = require('express');
const router = express.Router();
const { createPayment, paytrCallback, getOrderPaymentStatus } = require('../controllers/paytrController');
const { authMiddleware } = require('../middleware/authMiddleware');

// PayTR Ödeme Başlat (Kullanıcı login gerekli)
router.post('/create-payment', authMiddleware, createPayment);

// PayTR Callback (Webhook) - AUTH GEREKMİYOR, PayTR'dan gelir
router.post('/callback', paytrCallback);

// Sipariş Ödeme Durumu (Kullanıcı login gerekli)
router.get('/order-status/:orderId', authMiddleware, getOrderPaymentStatus);

module.exports = router;
