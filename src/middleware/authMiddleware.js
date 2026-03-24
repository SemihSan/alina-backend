// src/middleware/authMiddleware.js

// Bu middleware, gelen isteğin Authorization header'ında
// geçerli bir JWT token olup olmadığını kontrol eder.
// Eğer token geçerliyse, çözülmüş kullanıcı bilgisini req.user içine koyar.

const jwt = require('jsonwebtoken');

// .env'den JWT_SECRET değerini alıyoruz.
// Token'ı doğrularken bu secret ile imza kontrolü yapacağız.
const JWT_SECRET = process.env.JWT_SECRET;

// Temel auth middleware'i:
// - Header'da Authorization: Bearer <token> var mı?
// - Varsa token'ı verify et
// - Doğruysa req.user içine decoded payload'ı koy
// - Yanlışsa 401 döndür
const authMiddleware = (req, res, next) => {
  try {
    // Authorization header'ını alıyoruz (örn: "Bearer eyJhbGciOiJIUzI1NiIs...")
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: 'Authorization header eksik. Lütfen giriş yapın.',
      });
    }

    // Header "Bearer <token>" formatında olmalı
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        ok: false,
        message: 'Geçersiz Authorization formatı. "Bearer <token>" olmalı.',
      });
    }

    const token = parts[1];

    // Token'ı doğruluyoruz
    const decoded = jwt.verify(token, JWT_SECRET);

    // decoded içinde: userId, role, email gibi alanlar var (authController'da öyle oluşturduk)
    req.user = decoded;

    // Her şey yolundaysa bir sonraki middleware/handler'a geç
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      ok: false,
      message: 'Geçersiz veya süresi dolmuş token. Lütfen tekrar giriş yapın.',
    });
  }
};

// İleride sadece bayilerin erişmesini istediğimiz endpointler için
// ekstra bir middleware de yazabiliriz:
const requireDealer = (req, res, next) => {
  if (!req.user || req.user.role !== 'DEALER') {
    return res.status(403).json({
      ok: false,
      message: 'Bu işlem için bayi yetkisi gerekiyor.',
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  requireDealer,
};
