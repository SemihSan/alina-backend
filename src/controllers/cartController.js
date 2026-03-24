// src/controllers/cartController.js

const prisma = require('../lib/prisma');

/**
 * Kullanıcının sepetini getir
 * GET /api/cart
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId; // Token'da userId olarak geliyor

    // Kullanıcının sepetini bul veya oluştur
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          items: { create: [] },
        },
        include: {
          items: true,
        },
      });
    }

    // Her item için ürün bilgilerini çek
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: product || null, // Ürün silinmişse null döner
        };
      })
    );

    // Silinmiş ürünleri filtrele
    const validItems = itemsWithProducts.filter(item => item.product !== null);

    res.json({
      ok: true,
      cart: {
        id: cart.id,
        items: validItems,
      },
    });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ ok: false, message: 'Sepet getirilirken hata oluştu' });
  }
};

/**
 * Sepete ürün ekle
 * POST /api/cart/items
 * Body: { productId, quantity }
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ ok: false, message: 'Ürün ID gerekli' });
    }

    // Ürün var mı kontrol et
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ ok: false, message: 'Ürün bulunamadı' });
    }

    // Kullanıcının sepetini bul veya oluştur
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Sepette bu ürün var mı?
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Varsa miktarı artır
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Yoksa yeni ekle
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Güncel sepeti döndür
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    const itemsWithProducts = await Promise.all(
      updatedCart.items.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: prod,
        };
      })
    );

    res.json({
      ok: true,
      message: 'Ürün sepete eklendi',
      cart: {
        id: updatedCart.id,
        items: itemsWithProducts,
      },
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ ok: false, message: 'Sepete eklenirken hata oluştu' });
  }
};

/**
 * Sepetteki ürün miktarını güncelle
 * PUT /api/cart/items/:itemId
 * Body: { quantity }
 */
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ ok: false, message: 'Geçerli bir miktar giriniz' });
    }

    // Bu item kullanıcının sepetinde mi?
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      return res.status(404).json({ ok: false, message: 'Sepet bulunamadı' });
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ ok: false, message: 'Ürün sepette bulunamadı' });
    }

    // Miktarı güncelle
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    // Güncel sepeti döndür
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    const itemsWithProducts = await Promise.all(
      updatedCart.items.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: prod,
        };
      })
    );

    res.json({
      ok: true,
      message: 'Miktar güncellendi',
      cart: {
        id: updatedCart.id,
        items: itemsWithProducts,
      },
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ ok: false, message: 'Miktar güncellenirken hata oluştu' });
  }
};

/**
 * Sepetten ürün sil
 * DELETE /api/cart/items/:itemId
 */
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.itemId);

    // Bu item kullanıcının sepetinde mi?
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      return res.status(404).json({ ok: false, message: 'Sepet bulunamadı' });
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ ok: false, message: 'Ürün sepette bulunamadı' });
    }

    // Item'i sil
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    // Güncel sepeti döndür
    const updatedCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    const itemsWithProducts = await Promise.all(
      updatedCart.items.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        });
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: prod,
        };
      })
    );

    res.json({
      ok: true,
      message: 'Ürün sepetten çıkarıldı',
      cart: {
        id: updatedCart.id,
        items: itemsWithProducts,
      },
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ ok: false, message: 'Üründen çıkarılırken hata oluştu' });
  }
};

/**
 * Sepeti tamamen temizle
 * DELETE /api/cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.json({ ok: true, message: 'Sepet zaten boş' });
    }

    // Tüm item'ları sil
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      ok: true,
      message: 'Sepet temizlendi',
      cart: {
        id: cart.id,
        items: [],
      },
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ ok: false, message: 'Sepet temizlenirken hata oluştu' });
  }
};
