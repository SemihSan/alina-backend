// src/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Tüm cart route'ları authenticate gerektirir
router.use(authMiddleware);

// GET /api/cart - Sepeti getir
router.get('/', cartController.getCart);

// POST /api/cart/items - Sepete ürün ekle
router.post('/items', cartController.addToCart);

// PUT /api/cart/items/:itemId - Ürün miktarını güncelle
router.put('/items/:itemId', cartController.updateCartItem);

// DELETE /api/cart/items/:itemId - Sepetten ürün çıkar
router.delete('/items/:itemId', cartController.removeFromCart);

// DELETE /api/cart - Sepeti tamamen temizle
router.delete('/', cartController.clearCart);

module.exports = router;
