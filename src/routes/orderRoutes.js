// src/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// POST /orders - Yeni sipariş oluştur
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, dealerReferenceCode } = req.body;
    const userId = req.user?.userId || req.user?.id;
    
    console.log('🛒 Order creation started:', { userId, itemsCount: items?.length, dealerReferenceCode });

    // Validasyon
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Sepet boş veya geçersiz format' 
      });
    }
    
    // Kullanıcıyı kontrol et - bayi mi müşteri mi?
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dealer: true }
    });
    
    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }
    
    // Normal müşteriler için bayi referans kodu zorunlu
    let dealerId = null;
    if (!user.dealer) {
      // Bu normal bir müşteri, referans kodu gerekli
      if (!dealerReferenceCode || !dealerReferenceCode.trim()) {
        return res.status(400).json({ 
          ok: false, 
          message: 'Bayi referans kodu gereklidir. Lütfen bayinizden kod alın.' 
        });
      }
      
      // Referans kodunu kontrol et ve bayi bul
      const dealer = await prisma.dealer.findUnique({
        where: { referralCode: dealerReferenceCode.trim() }
      });
      
      if (!dealer) {
        return res.status(404).json({ 
          ok: false, 
          message: 'Geçersiz bayi referans kodu. Lütfen bayinizle iletişime geçin.' 
        });
      }
      
      dealerId = dealer.id;
    }

    let totalPrice = 0;
    const orderItems = [];

    // Items'ı işle ve validasyon yap
    for (const item of items) {
      // Ürünü veritabanından kontrol et
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({ 
          ok: false, 
          message: `Ürün bulunamadı: ${item.productId}` 
        });
      }

      // Fiyat ve miktar kontrol
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ 
          ok: false, 
          message: 'Geçersiz miktar' 
        });
      }

      // Toplam fiyatı hesapla
      totalPrice += item.priceCents * item.quantity;

      // Order item'ını hazırla
      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        priceCents: item.priceCents,
      });
    }

    // Kazanılan puanı hesapla: her 600 kuruş = 1 puan
    // NOT: Puan müşteriye hemen verilmez, bayi ödeme türünü seçip onayladığında verilir
    const earnedCoins = 0; // Artık başlangıçta puan verilmiyor

    // Sipariş oluştur (dealerReferenceCode ve dealerId ile)
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        items: orderItems,
        totalPrice,
        earnedCoins, // 0 olarak kaydedilecek
        dealerReferenceCode: dealerReferenceCode || null,
        dealerId: dealerId,
      },
    });

    // Artık sipariş oluşturulurken puan verilmiyor
    // Puan sadece bayi ödeme türünü seçip DELIVERED yaptığında verilecek

    return res.json({
      ok: true,
      order,
      user,
      earnedCoins,
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      ok: false, 
      message: 'Sipariş oluşturulamadı',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /orders - Kullanıcının siparişlerini getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        items: true,
        // totalPrice ve earnedCoins müşteriye gösterilmiyor
        createdAt: true,
        updatedAt: true,
      }
    });

    return res.json({
      ok: true,
      orders,
    });

  } catch (error) {
    console.error('Order fetch error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Siparişler alınamadı',
      error: error.message 
    });
  }
});

// GET /orders/:id - Spesifik sipariş detayı
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Sipariş bulunamadı' 
      });
    }

    // Kendi siparişi mi kontrol et
    if (order.userId !== userId) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Bu sipariş\'e erişim yetkiniz yok' 
      });
    }

    return res.json({
      ok: true,
      order,
    });

  } catch (error) {
    console.error('Order detail error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Sipariş detayı alınamadı',
      error: error.message 
    });
  }
});

// GET /orders/dealer/my-customer-orders - Bayinin müşteri siparişlerini getir
router.get('/dealer/my-customer-orders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    console.log('🔍 Dealer customer orders request - userId:', userId);
    
    // Kullanıcının bayi olup olmadığını kontrol et
    const dealer = await prisma.dealer.findUnique({
      where: { userId }
    });
    
    if (!dealer) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Bu işlem sadece bayiler için.' 
      });
    }
    
    console.log('✅ Dealer found:', { id: dealer.id, referralCode: dealer.referralCode });
    
    // Bu bayinin referans koduyla verilen siparişleri getir
    // İki yöntemle dene: dealerId ile ve dealerReferenceCode ile
    const orders = await prisma.order.findMany({
      where: { 
        OR: [
          { dealerId: dealer.id },
          { dealerReferenceCode: dealer.referralCode }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📦 Found ${orders.length} orders for dealer ${dealer.companyName}`);
    
    return res.json({
      ok: true,
      orders,
      dealer: {
        id: dealer.id,
        companyName: dealer.companyName,
        referralCode: dealer.referralCode
      }
    });
    
  } catch (error) {
    console.error('❌ Dealer orders error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      ok: false, 
      message: 'Siparişler alınamadı',
      error: error.message 
    });
  }
});

// PUT /orders/:id/status - Sipariş durumunu güncelle (bayiler için)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { status, paymentMethod } = req.body; // paymentMethod eklendi
    
    console.log('📝 Order status update request:', { orderId: id, status, paymentMethod, userId });
    
    // Geçerli status değerleri
    const validStatuses = ['PENDING', 'APPROVED', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Geçersiz sipariş durumu. Geçerli değerler: PENDING, APPROVED, DELIVERED, CANCELLED' 
      });
    }
    
    // Eğer DELIVERED ise paymentMethod zorunlu
    if (status === 'DELIVERED' && !paymentMethod) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Sipariş tamamlanırken ödeme yöntemi (CASH/CARD) belirtmelisiniz' 
      });
    }
    
    // paymentMethod kontrolü
    const validPaymentMethods = ['CASH', 'CARD'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Geçersiz ödeme yöntemi. Geçerli değerler: CASH, CARD' 
      });
    }
    
    // Kullanıcının bayi olup olmadığını kontrol et
    const dealer = await prisma.dealer.findUnique({
      where: { userId }
    });
    
    if (!dealer) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Bu işlem sadece bayiler için.' 
      });
    }
    
    // Siparişi getir
    const order = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Sipariş bulunamadı' 
      });
    }
    
    // Bu siparişin bu bayiye ait olup olmadığını kontrol et
    if (order.dealerId !== dealer.id) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Bu siparişi güncelleme yetkiniz yok' 
      });
    }
    
    // Güncelleme verisi hazırla
    const updateData = { 
      status,
      updatedAt: new Date()
    };
    
    // Eğer DELIVERED durumuna geçiyorsa, ödeme bilgilerini kaydet
    if (status === 'DELIVERED') {
      updateData.paymentMethod = paymentMethod;
      updateData.paymentDate = new Date();
    }
    
    console.log('💾 Updating order with data:', updateData);
    
    // Durumu güncelle
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    console.log('✅ Order updated successfully:', updatedOrder.id);
    
    // Eğer DELIVERED durumuna geçildiyse VE paymentMethod seçildiyse VE daha önce puan verilmediyse
    // Puan sadece ilk kez DELIVERED yapıldığında verilir (order.status önceden DELIVERED değilse)
    const wasNotDeliveredBefore = order.status !== 'DELIVERED';
    const isNowDelivered = status === 'DELIVERED' && paymentMethod;
    
    if (isNowDelivered && wasNotDeliveredBefore) {
      try {
        // Siparişteki ürün sayısını hesapla
        const items = JSON.parse(JSON.stringify(updatedOrder.items));
        let totalProducts = 0;
        
        items.forEach(item => {
          totalProducts += item.quantity; // Her ürün miktarını topla
        });
        
        // Müşteriye ürün başı 50 puan
        const customerPoints = totalProducts * 50;
        
        // Müşterinin coin bakiyesini güncelle
        await prisma.user.update({
          where: { id: updatedOrder.userId },
          data: {
            coins: {
              increment: customerPoints
            }
          }
        });
        
        console.log(`🎁 Customer earned ${customerPoints} AlinaPuan (${totalProducts} products x 50)`);
        
        // Bayiye ürün başı 25 puan
        const dealerPoints = totalProducts * 25;
        
        // Bayi CoinWallet'ına puan ekle
        const wallet = await prisma.coinWallet.findUnique({
          where: { dealerId: dealer.id }
        });

        if (wallet) {
          await prisma.coinWallet.update({
            where: { dealerId: dealer.id },
            data: {
              balance: {
                increment: dealerPoints
              }
            }
          });

          // Transaction log ekle
          await prisma.coinTransaction.create({
            data: {
              dealerId: dealer.id,
              change: dealerPoints,
              type: "EARNED_FROM_ORDER",
              description: `Sipariş #${updatedOrder.id} - ${dealerPoints} AlinaPuan kazanıldı (${totalProducts} ürün x 25)`,
              relatedOrderId: null
            }
          });
          
          console.log(`💰 Dealer earned ${dealerPoints} AlinaPuan (${totalProducts} products x 25)`);
        }
        
      } catch (coinError) {
        console.error('⚠️ Coin update error:', coinError);
        // Coin güncellemesi başarısız olsa bile sipariş güncellemesi başarılı
      }
    }
    
    return res.json({
      ok: true,
      order: updatedOrder,
      message: `Sipariş durumu ${status} olarak güncellendi${status === 'DELIVERED' ? ` (Ödeme: ${paymentMethod === 'CASH' ? 'Nakit' : 'Kart'})` : ''}`
    });
    
  } catch (error) {
    console.error('Order status update error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Sipariş durumu güncellenemedi',
      error: error.message 
    });
  }
});

module.exports = router;
