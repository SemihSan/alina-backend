// src/controllers/favoriteController.js

const prisma = require('../lib/prisma');

/**
 * GET /api/favorites
 * Kullanıcının tüm favori ürünlerini getir
 */
exports.getFavorites = async (req, res) => {
  try {
    // JWT'den gelen userId (hem normal kullanıcı hem bayi için aynı userId)
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      console.log('getFavorites - req.user:', req.user);
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Sadece ürün bilgilerini döndür
    const products = favorites.map(fav => fav.product);

    return res.json({ 
      ok: true, 
      favorites: products,
      count: products.length
    });
  } catch (error) {
    console.error('getFavorites error:', error);
    return res.status(500).json({ error: 'Favoriler alınırken bir hata oluştu.' });
  }
};

/**
 * POST /api/favorites/:productId
 * Ürünü favorilere ekle
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      console.log('addFavorite - req.user:', req.user);
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }

    const productId = parseInt(req.params.productId);
    if (!productId) {
      return res.status(400).json({ error: 'Geçersiz ürün ID.' });
    }

    // Ürün var mı kontrol et
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    // Zaten favoride mi kontrol et
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Bu ürün zaten favorilerde.' });
    }

    // Favoriye ekle
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        productId
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    return res.json({ 
      ok: true, 
      message: 'Ürün favorilere eklendi.',
      favorite: favorite.product
    });
  } catch (error) {
    console.error('addFavorite error:', error);
    return res.status(500).json({ error: 'Favorilere eklenirken bir hata oluştu.' });
  }
};

/**
 * DELETE /api/favorites/:productId
 * Ürünü favorilerden çıkar
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      console.log('removeFavorite - req.user:', req.user);
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }

    const productId = parseInt(req.params.productId);
    if (!productId) {
      return res.status(400).json({ error: 'Geçersiz ürün ID.' });
    }

    // Favoride var mı kontrol et
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Bu ürün favorilerde değil.' });
    }

    // Favoriden çıkar
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return res.json({ 
      ok: true, 
      message: 'Ürün favorilerden çıkarıldı.'
    });
  } catch (error) {
    console.error('removeFavorite error:', error);
    return res.status(500).json({ error: 'Favorilerden çıkarılırken bir hata oluştu.' });
  }
};

/**
 * GET /api/favorites/check/:productId
 * Ürünün favoride olup olmadığını kontrol et
 */
exports.checkFavorite = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.json({ isFavorite: false });
    }

    const productId = parseInt(req.params.productId);
    if (!productId) {
      return res.status(400).json({ error: 'Geçersiz ürün ID.' });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    return res.json({ 
      ok: true,
      isFavorite: !!favorite
    });
  } catch (error) {
    console.error('checkFavorite error:', error);
    return res.status(500).json({ error: 'Kontrol edilirken bir hata oluştu.' });
  }
};
