// src/routes/authRoutes.js

const express = require('express');
const router = express.Router();

const { register, login, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Kullanıcı / bayi kayıt endpoint'i
router.post('/register', register);

// Giriş endpoint'i
router.post('/login', login);

// Giriş yapmış kullanıcının profil bilgisi
// Header: Authorization: Bearer <token>
router.get('/me', authMiddleware, me);

module.exports = router;
