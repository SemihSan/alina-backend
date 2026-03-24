// src/controllers/productController.js

// Bu controller, mağaza ürünlerini ve bayi ödül ürünlerini döner.
// Şimdilik ilişkileri (category vs.) zorlamadan, direkt Product tablosundan çekiyoruz.

const prisma = require('../lib/prisma');

// GET /products
// Tüm ürünleri verir (hem normal mağaza hem ödül ürünleri)
const getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Arama varsa filtreleme yap
    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true, // Kategori bilgisini de dahil et
      },
      orderBy: {
        id: 'asc',
      },
    });

    return res.json(products);
  } catch (error) {
    console.error('getAllProducts error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Ürünler alınırken bir hata oluştu.',
      detail: error.message,
    });
  }
};

// GET /products/rewards/all?audience=CUSTOMER (veya DEALER)
// Sadece ödül ürünlerini (isRewardProduct = true) döner
// audience parametresiyle müşteri/bayi ödül ürünlerini filtreler
const getAllRewardProducts = async (req, res) => {
  try {
    const { audience } = req.query; // CUSTOMER, DEALER veya boş (hepsi)
    
    const whereClause = {
      isRewardProduct: true,
    };
    
    // Eğer audience belirtilmişse, ona göre filtrele
    if (audience === 'CUSTOMER') {
      whereClause.targetAudience = { in: ['CUSTOMER', 'BOTH'] };
    } else if (audience === 'DEALER') {
      whereClause.targetAudience = { in: ['DEALER', 'BOTH'] };
    }
    // audience yoksa tüm ödül ürünlerini döner

    const rewardProducts = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        coinPrice: 'asc',
      },
    });

    return res.json({
      ok: true,
      count: rewardProducts.length,
      products: rewardProducts,
      audience: audience || 'ALL',
    });
  } catch (error) {
    console.error('getAllRewardProducts error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Ödül ürünleri alınırken bir hata oluştu.',
      detail: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getAllRewardProducts,
};
