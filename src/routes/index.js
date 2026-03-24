// src/routes/index.js

const express = require('express');
const router = express.Router();

const { healthCheck } = require('../controllers/healthController');
const { dbTest } = require('../controllers/dbTestController');
const authRoutes = require('./authRoutes');
const dealerRoutes = require('./dealerRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const reviewRoutes = require('./reviewRoutes');
const cartRoutes = require('./cartRoutes');
const paytrRoutes = require('./paytrRoutes');

// Sağlık kontrolü
router.get('/health', healthCheck);

// DB bağlantı testi
router.get('/db-test', dbTest);

// Auth ile ilgili tüm endpointler: /auth/...
router.use('/auth', authRoutes);

// Bayi ile ilgili endpointler: /dealers/...
router.use('/dealers', dealerRoutes);

// Ürünlerle ilgili endpointler: /products/...
router.use('/products', productRoutes);

// Siparişlerle ilgili endpointler: /orders/...
router.use('/orders', orderRoutes);

// Favorilerle ilgili endpointler: /favorites/...
router.use('/favorites', favoriteRoutes);

// Sepet ile ilgili endpointler: /cart/...
router.use('/cart', cartRoutes);

// PayTR ödeme endpointleri: /paytr/...
router.use('/paytr', paytrRoutes);

// Yorumlarla ilgili endpointler: /products/:id/reviews & /reviews/:id/helpful
router.use('/', reviewRoutes);

module.exports = router;
