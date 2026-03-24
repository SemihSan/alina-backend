// src/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { updateDealerBadge } = require('../services/badgeService');

const JWT_SECRET = process.env.JWT_SECRET;

// Basit helper: bir kullanıcı için JWT token üretir
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' } // token 7 gün geçerli
  );
}

// POST /auth/register
const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      isDealer,      // bayi olarak mı kayıt oluyor?
      companyName,
      phone,
      address,
      referralCode,  // 🔹 yeni: referans kodu (opsiyonel)
    } = req.body;

    // Basit validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'fullName, email ve password alanları zorunludur.',
      });
    }

    // Daha önce bu email ile kullanıcı var mı?
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        ok: false,
        message: 'Bu email adresi ile zaten kayıtlı bir kullanıcı var.',
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluşturma + (varsa) bayi + (varsa) referral
    const result = await prisma.$transaction(async (tx) => {
      // 1) User oluştur
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: isDealer ? 'DEALER' : 'USER',
        },
      });

      let dealer = null;
      let referrerDealer = null;

      // 2) Eğer bayi kaydı ise Dealer + CoinWallet oluştur
      if (isDealer) {
        const generatedReferralCode = `ALINA-${user.id}-${Date.now()
          .toString()
          .slice(-4)}`;

        dealer = await tx.dealer.create({
          data: {
            userId: user.id,
            companyName: companyName || `${fullName} - Bayi`,
            phone: phone || null,
            address: address || null,
            referralCode: generatedReferralCode,
            status: 'PENDING',
          },
        });

        await tx.coinWallet.create({
          data: {
            dealerId: dealer.id,
            balance: 0,
          },
        });
      }

      // 3) Eğer referans kodu geldiyse => o kodun sahibini bul ve Referral kaydı oluştur
      if (referralCode) {
        // Referans kodu her zaman Dealer tablosunda tutuluyor
        referrerDealer = await tx.dealer.findUnique({
          where: { referralCode },
        });

        if (referrerDealer) {
          // Referral tablosu artık sadece userId tutuyor:
          // referrerUserId (kodu veren kullanıcı) ve referredUserId (kodla kayıt olan)
          await tx.referral.create({
            data: {
              referrerUserId: referrerDealer.userId,
              referredUserId: user.id,
            },
          });

          // NOT: İstersen burada ileri seviyede:
          // - referrerDealer'a bonus puan ekleme
          // - referralla gelen kullanıcıya hoşgeldin puanı verme
          // gibi işlemler de (addCoinsToDealer ile) ekleyebiliriz.
        }
        // Eğer referralCode geçersizse sessizce yok sayıyoruz,
        // özel bir hata fırlatmıyoruz ki normal kayıt devam etsin.
      }

      return { user, dealer, referrerDealer };
    });

    // 4) Eğer referral oluşturulduysa, referrerDealer'ın rozetini güncelle
    // Transaction commit edildikten sonra badge güncellemesi yapıyoruz
    if (result.referrerDealer) {
      try {
        await updateDealerBadge(result.referrerDealer.id);
        console.log(`✅ Badge updated for dealer ${result.referrerDealer.id} after referral`);
      } catch (error) {
        console.error('⚠️ Badge update failed after referral:', error);
      }
    }

    const token = generateToken(result.user);

    return res.status(201).json({
      ok: true,
      message: 'Kayıt başarılı.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
      },
      dealer: result.dealer
        ? {
            id: result.dealer.id,
            companyName: result.dealer.companyName,
            status: result.dealer.status,
            referralCode: result.dealer.referralCode,
          }
        : null,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Kayıt sırasında bir hata oluştu.',
    });
  }
};

// POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'email ve password alanları zorunludur.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            status: true,
            referralCode: true,
            badge: true,
            coinWallet: {
              select: {
                balance: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Email veya şifre hatalı.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        message: 'Email veya şifre hatalı.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      ok: true,
      message: 'Giriş başarılı.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      dealer: user.dealer
        ? {
            id: user.dealer.id,
            companyName: user.dealer.companyName,
            status: user.dealer.status,
            referralCode: user.dealer.referralCode,
            coinWallet: user.dealer.coinWallet
              ? {
                  balance: user.dealer.coinWallet.balance,
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Giriş sırasında bir hata oluştu.',
    });
  }
};

// GET /auth/me
const me = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            status: true,
            referralCode: true,
            badge: true,
            coinWallet: {
              select: {
                balance: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'Kullanıcı bulunamadı.',
      });
    }

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        coins: user.coins, // Müşteri puanı
      },
      dealer: user.dealer
        ? {
            id: user.dealer.id,
            companyName: user.dealer.companyName,
            status: user.dealer.status,
            referralCode: user.dealer.referralCode,
            coinWallet: user.dealer.coinWallet
              ? {
                  balance: user.dealer.coinWallet.balance,
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Profil bilgisi alınırken bir hata oluştu.',
    });
  }
};

module.exports = {
  register,
  login,
  me,
};
