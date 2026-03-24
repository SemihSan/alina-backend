
// src/controllers/dbTestController.js

// Prisma client'i içeri alıyoruz.
// Bu client üzerinden veritabanına sorgu atacağız.
const prisma = require('../lib/prisma');

// Basit bir test endpoint'i:
// Veritabanına bağlanıp User tablosundaki kayıt sayısını döndürür.
const dbTest = async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.status(200).json({
      ok: true,
      userCount: users.length,
    });
  } catch (error) {
    console.error('DB test error:', error);
    res.status(500).json({
      ok: false,
      error: 'Database connection failed',
    });
  }
};

// Bu fonksiyonu diğer dosyalarda kullanmak için export ediyoruz.
module.exports = {
  dbTest,
};

