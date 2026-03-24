// src/controllers/paytrController.js

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// PayTR Credentials - .env'den alınacak
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY;
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT;

// PayTR Token Oluştur
function generatePayTRToken(params) {
  const {
    merchant_id,
    user_ip,
    merchant_oid,
    email,
    payment_amount,
    payment_type,
    installment_count,
    currency,
    test_mode,
    non_3d
  } = params;

  const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${payment_type}${installment_count}${currency}${test_mode}${non_3d}`;
  const paytr_token = hashSTR + MERCHANT_SALT;
  const token = crypto.createHmac('sha256', MERCHANT_KEY).update(paytr_token).digest('base64');
  
  return token;
}

// Callback Hash Doğrula
function verifyCallbackHash(callback) {
  const paytr_token = callback.merchant_oid + MERCHANT_SALT + callback.status + callback.total_amount;
  const token = crypto.createHmac('sha256', MERCHANT_KEY).update(paytr_token).digest('base64');
  return token === callback.hash;
}

// POST /api/paytr/create-payment - Ödeme başlat
const createPayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { orderId } = req.body;

    // Siparişi bul
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) {
      return res.status(404).json({ ok: false, message: 'Sipariş bulunamadı' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ ok: false, message: 'Bu siparişe erişim yetkiniz yok' });
    }

    // Sepet bilgisini hazırla
    const basket = order.items.map(item => [
      item.productName,
      (item.priceCents / 100).toFixed(2),
      item.quantity
    ]);

    const user_basket = Buffer.from(JSON.stringify(basket)).toString('base64');
    
    // PayTR parametreleri
    const merchant_oid = order.id; // Sipariş ID'si
    const user_ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const email = order.user.email;
    const payment_amount = order.totalPrice; // Kuruş cinsinden
    const currency = 'TL';
    const test_mode = process.env.PAYTR_TEST_MODE || '1'; // Test modunda 1
    const non_3d = '0'; // 3D Secure aktif
    const payment_type = 'card';
    const installment_count = '0'; // Tek çekim
    const client_lang = 'tr';
    const debug_on = process.env.NODE_ENV === 'development' ? 1 : 0;

    // Callback URL'leri
    const baseUrl = process.env.API_BASE_URL || 'https://api.aliozdemir.tr';
    const frontendUrl = process.env.FRONTEND_URL || 'https://aliozdemir.tr';
    
    const merchant_ok_url = `${frontendUrl}/odeme-basarili?order=${orderId}`;
    const merchant_fail_url = `${frontendUrl}/odeme-hata?order=${orderId}`;

    // Token oluştur
    const token = generatePayTRToken({
      merchant_id: MERCHANT_ID,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      payment_type,
      installment_count,
      currency,
      test_mode,
      non_3d
    });

    // PayTR'a gönderilecek veriler
    const paytrData = {
      merchant_id: MERCHANT_ID,
      user_ip,
      merchant_oid,
      email,
      payment_type,
      payment_amount,
      currency,
      test_mode,
      non_3d,
      merchant_ok_url,
      merchant_fail_url,
      user_name: order.user.fullName,
      user_address: 'Türkiye', // Adres bilgisi varsa eklenebilir
      user_phone: '05000000000', // Telefon bilgisi varsa eklenebilir
      user_basket,
      debug_on,
      client_lang,
      paytr_token: token,
      installment_count,
      no_installment: 0, // Taksit seçenekleri açık
      max_installment: 12, // Maximum taksit sayısı
    };

    // PayTR iFrame Token Al
    const https = require('https');
    const querystring = require('querystring');
    
    const postData = querystring.stringify(paytrData);
    
    const options = {
      hostname: 'www.paytr.com',
      port: 443,
      path: '/odeme/api/get-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const paytrRequest = https.request(options, (paytrRes) => {
      let data = '';
      
      paytrRes.on('data', (chunk) => {
        data += chunk;
      });
      
      paytrRes.on('end', async () => {
        try {
          const result = JSON.parse(data);
          
          if (result.status === 'success') {
            // Siparişi PENDING_PAYMENT durumuna güncelle
            await prisma.order.update({
              where: { id: orderId },
              data: { 
                status: 'PENDING_PAYMENT',
                paytrToken: result.token
              }
            });

            res.json({
              ok: true,
              token: result.token,
              iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`
            });
          } else {
            console.error('PayTR Error:', result);
            res.status(400).json({
              ok: false,
              message: result.reason || 'PayTR token alınamadı'
            });
          }
        } catch (parseError) {
          console.error('PayTR Response Parse Error:', parseError);
          res.status(500).json({ ok: false, message: 'PayTR yanıt hatası' });
        }
      });
    });

    paytrRequest.on('error', (error) => {
      console.error('PayTR Request Error:', error);
      res.status(500).json({ ok: false, message: 'PayTR bağlantı hatası' });
    });

    paytrRequest.write(postData);
    paytrRequest.end();

  } catch (error) {
    console.error('PayTR Create Payment Error:', error);
    res.status(500).json({ ok: false, message: 'Ödeme başlatılamadı' });
  }
};

// POST /api/paytr/callback - PayTR Bildirim (Webhook)
const paytrCallback = async (req, res) => {
  try {
    const callback = req.body;
    
    console.log('📥 PayTR Callback received:', {
      merchant_oid: callback.merchant_oid,
      status: callback.status,
      total_amount: callback.total_amount
    });

    // Hash doğrulaması
    if (!verifyCallbackHash(callback)) {
      console.error('❌ PayTR Callback: Invalid hash');
      return res.status(400).send('INVALID_HASH');
    }

    const orderId = callback.merchant_oid;
    
    // Siparişi bul
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        user: true,
        dealer: true 
      }
    });

    if (!order) {
      console.error('❌ PayTR Callback: Order not found', orderId);
      return res.send('OK'); // PayTR'a OK döndür ama işlem yapma
    }

    // Sipariş zaten işlenmiş mi kontrol et
    if (order.status === 'PAID' || order.status === 'APPROVED') {
      console.log('ℹ️ PayTR Callback: Order already processed', orderId);
      return res.send('OK');
    }

    if (callback.status === 'success') {
      // Ödeme başarılı
      console.log('✅ PayTR Payment Success:', orderId);

      // Siparişi güncelle
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentMethod: 'CARD',
          paymentDate: new Date(),
          paytrPaymentId: callback.payment_id || null
        }
      });

      // Kazanılan puanları kullanıcıya ekle
      if (order.earnedCoins > 0) {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            coins: {
              increment: order.earnedCoins
            }
          }
        });
        console.log(`💰 Added ${order.earnedCoins} coins to user ${order.userId}`);
      }

      // Bayi varsa ciroyu güncelle
      if (order.dealerId) {
        await prisma.dealer.update({
          where: { id: order.dealerId },
          data: {
            totalRevenue: {
              increment: order.totalPrice
            },
            coinBalance: {
              increment: Math.floor(order.totalPrice / 100) // Her 100 TL = 1 puan
            }
          }
        });
        console.log(`📈 Updated dealer ${order.dealerId} revenue`);
      }

    } else {
      // Ödeme başarısız
      console.log('❌ PayTR Payment Failed:', orderId, callback.failed_reason_msg);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAYMENT_FAILED',
          paymentFailReason: callback.failed_reason_msg || 'Bilinmeyen hata'
        }
      });
    }

    // PayTR'a OK yanıtı gönder (zorunlu)
    res.send('OK');

  } catch (error) {
    console.error('PayTR Callback Error:', error);
    res.send('OK'); // Hata olsa bile OK döndür ki PayTR tekrar denemesin
  }
};

// GET /api/paytr/order-status/:orderId - Sipariş ödeme durumu
const getOrderPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        paymentDate: true,
        userId: true
      }
    });

    if (!order) {
      return res.status(404).json({ ok: false, message: 'Sipariş bulunamadı' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ ok: false, message: 'Erişim reddedildi' });
    }

    res.json({
      ok: true,
      order: {
        id: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentDate: order.paymentDate,
        isPaid: order.status === 'PAID' || order.status === 'APPROVED'
      }
    });

  } catch (error) {
    console.error('Get Order Payment Status Error:', error);
    res.status(500).json({ ok: false, message: 'Durum alınamadı' });
  }
};

module.exports = {
  createPayment,
  paytrCallback,
  getOrderPaymentStatus
};
