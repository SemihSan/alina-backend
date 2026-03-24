// src/routes/productRoutes.js

const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getAllRewardProducts,
} = require('../controllers/productController');

// Normal mağaza + tüm ürünler
router.get('/', getAllProducts);

// Bayi ödül mağazası ürünleri
router.get('/rewards/all', getAllRewardProducts);

module.exports = router;
