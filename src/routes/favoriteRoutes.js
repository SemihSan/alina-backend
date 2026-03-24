// src/routes/favoriteRoutes.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
} = require('../controllers/favoriteController');

// Check endpoint doesn't require auth (returns false if not logged in)
router.get('/check/:productId', checkFavorite);

// All other routes require authentication
router.get('/', authMiddleware, getFavorites);
router.post('/:productId', authMiddleware, addFavorite);
router.delete('/:productId', authMiddleware, removeFavorite);

module.exports = router;
