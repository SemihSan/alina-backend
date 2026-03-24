// checkDatabase.js - Veritabanı kontrolü için

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('📊 DATABASE CHECK');
    console.log('================\n');

    // Kullanıcıları say
    const userCount = await prisma.user.count();
    console.log(`👥 Total Users: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          coins: true,
          referralCode: true,
        },
        take: 10,
      });

      console.log('\n📋 Users:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.fullName}) | Role: ${u.role} | Coins: ${u.coins}`);
      });
    }

    // Bayi sayısı
    const dealerCount = await prisma.dealer.count();
    console.log(`\n🏪 Total Dealers: ${dealerCount}`);

    // Ürün sayısı
    const productCount = await prisma.product.count();
    console.log(`📦 Total Products: ${productCount}`);

    // Kategori sayısı
    const categoryCount = await prisma.category.count();
    console.log(`🏷️  Total Categories: ${categoryCount}`);

    // Sipariş sayısı
    const orderCount = await prisma.order.count();
    console.log(`📦 Total Orders: ${orderCount}`);

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
