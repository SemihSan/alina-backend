// src/services/coinService.js

// Bu dosya, bayilerin puan cüzdanı ile ilgili temel işlerini yapan
// servis fonksiyonlarını içerir. Örneğin:
// - Bayiye puan ekleme
// - Bayiden puan düşme
// - Hem cüzdan bakiyesini güncelleme hem de CoinTransaction logu ekleme

const prisma = require('../lib/prisma');

// Bu fonksiyon bir bayiye puan ekler veya düşer.
// amount: pozitif ise puan ekler, negatif ise puan düşer.
// type: TransactionType enum'undan biri olmalı
//  - 'EARNED_FROM_ORDER'
//  - 'SPENT_FOR_REWARD'
//  - 'ADMIN_ADJUST'
//
// Örnek kullanım:
// await addCoinsToDealer({
//   dealerId: 1,
//   amount: 100,
//   type: 'EARNED_FROM_ORDER',
//   description: 'Sipariş #1234 için puan ödülü',
//   relatedOrderId: 1234,
// });
async function addCoinsToDealer({ dealerId, amount, type, description, relatedOrderId }) {
  // Güvenlik: amount 0 olmasın
  if (!amount || amount === 0) {
    throw new Error('amount 0 olamaz.');
  }

  // type kontrolü (Prisma enum değerleri ile uyumlu olmalı)
  const validTypes = ['EARNED_FROM_ORDER', 'SPENT_FOR_REWARD', 'ADMIN_ADJUST'];
  if (!validTypes.includes(type)) {
    throw new Error(`Geçersiz transaction type: ${type}`);
  }

  // İşlemi transaction içinde yapıyoruz:
  // 1) Cüzdan bakiyesini güncelle
  // 2) CoinTransaction tablosuna log ekle
  const result = await prisma.$transaction(async (tx) => {
    // Önce mevcut cüzdanı al
    const wallet = await tx.coinWallet.findUnique({
      where: { dealerId },
    });

    if (!wallet) {
      throw new Error('Bu bayiye ait puan cüzdanı bulunamadı.');
    }

    const newBalance = wallet.balance + amount;

    // İstersen negatif bakiyeye izin verme
    if (newBalance < 0) {
      throw new Error('Yetersiz puan bakiyesi.');
    }

    // Cüzdan bakiyesini güncelle
    const updatedWallet = await tx.coinWallet.update({
      where: { dealerId },
      data: {
        balance: newBalance,
      },
    });

    // Transaction kaydı oluştur
    const transaction = await tx.coinTransaction.create({
      data: {
        dealerId,
        change: amount,
        type,
        description: description || null,
        relatedOrderId: relatedOrderId ?? null,
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });

  return result;
}

// Bir bayiden puan düşüyor. addCoinsToDealer ile aynı lojik ama negatif amount kullanıyor.
async function spendCoinsFromDealer({ dealerId, amount, description, relatedOrderId }) {
  // Güvenlik: amount 0 olmasın
  if (!amount || amount === 0) {
    throw new Error('amount 0 olamaz.');
  }

  // amount negatif olmalı (düşme işlemi için)
  // Ama user tarafından pozitif sayı gönderirse de işe yarasın
  const spendAmount = amount > 0 ? -amount : amount;

  // İşlemi transaction içinde yapıyoruz
  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.coinWallet.findUnique({
      where: { dealerId },
    });

    if (!wallet) {
      throw new Error('Bu bayiye ait puan cüzdanı bulunamadı.');
    }

    const newBalance = wallet.balance + spendAmount;

    // Negatif bakiyeye izin verme
    if (newBalance < 0) {
      throw new Error('Yetersiz puan bakiyesi.');
    }

    const updatedWallet = await tx.coinWallet.update({
      where: { dealerId },
      data: {
        balance: newBalance,
      },
    });

    const transaction = await tx.coinTransaction.create({
      data: {
        dealerId,
        change: spendAmount,
        type: 'SPENT_FOR_REWARD',
        description: description || null,
        relatedOrderId: relatedOrderId ?? null,
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });

  return result;
}

// Bir bayiye ödül ürünü satın aldırıyor.
// Ürünü al, coin düş, transaction kaydını oluştur.
async function redeemRewardForDealer({ dealerId, productSlug }) {
  // Ödül ürünü var mı?
  const product = await prisma.product.findUnique({
    where: { slug: productSlug },
  });

  if (!product) {
    throw new Error('Ödül ürünü bulunamadı.');
  }

  if (!product.isRewardProduct) {
    throw new Error('Bu ürün bir ödül ürünü değil.');
  }

  if (!product.coinPrice || product.coinPrice === 0) {
    throw new Error('Bu ödül ürününün puan fiyatı tanımlanmamış.');
  }

  // Transaction: coin düşme
  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.coinWallet.findUnique({
      where: { dealerId },
    });

    if (!wallet) {
      throw new Error('Bu bayiye ait puan cüzdanı bulunamadı.');
    }

    if (wallet.balance < product.coinPrice) {
      throw new Error(
        `Yetersiz puan bakiyesi. Gerekli: ${product.coinPrice}, Senin bakiyen: ${wallet.balance}`
      );
    }

    const newBalance = wallet.balance - product.coinPrice;

    const updatedWallet = await tx.coinWallet.update({
      where: { dealerId },
      data: {
        balance: newBalance,
      },
    });

    const transaction = await tx.coinTransaction.create({
      data: {
        dealerId,
        change: -product.coinPrice,
        type: 'SPENT_FOR_REWARD',
        description: `Ödül ürünü satın alındı: ${product.name}`,
        relatedOrderId: null,
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
      product,
    };
  });

  return result;
}

module.exports = {
  addCoinsToDealer,
  spendCoinsFromDealer,
  redeemRewardForDealer,
};
