// src/controllers/healthController.js

// Health check endpoint'inin controller fonksiyonu.
// Amaç: Backend server'ın çalışıp çalışmadığını hızlıca kontrol etmek.
// Örneğin: GET /health isteği geldiğinde bu fonksiyon çalışır.
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Alina backend is running 🚀',
  });
};

// Bu fonksiyonu diğer dosyalarda kullanabilmek için export ediyoruz.
module.exports = {
  healthCheck,
};
