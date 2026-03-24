// src/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Tüm route'ların toplandığı ana router
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Test endpoint - EN BAŞTA
app.get('/test', (req, res) => {
  console.log('TEST endpoint hit!');
  res.json({ message: 'Test OK' });
});

// JSON body parse
app.use(express.json());

// URL-encoded body parse (PayTR callback için gerekli)
app.use(express.urlencoded({ extended: true }));

// CORS (frontend başka origin'den gelecek)
app.use(cors({
  origin: '*', // Tüm origin'lere izin ver
  credentials: true,
}));

// Static files - ürün görselleri
// Not: Prod sunucuda resimleri `backend/public/uploads` içine atıyoruz.
// O yüzden `/uploads/...` isteklerini bu klasöre yönlendiriyoruz.
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// Reward images - ödül ürün görselleri
app.use('/reward-images', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}, express.static(path.join(__dirname, '../public/reward-images')));

// Tüm API endpoint'lerini routes/index.js üzerinden yönetiyoruz
// Örneğin:
// GET /api/health
// GET /api/products
// GET /api/products/rewards/all
// POST /api/auth/login
app.use('/api', routes);

// Vercel serverless ortamında listen yapma, sadece app'i export et
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Alina backend server is running on port ${PORT}`);
  });
  module.exports = app;
}
