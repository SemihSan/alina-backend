// updateCarImage.js - Araba ürününün fotoğrafını güncelle

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCarImage() {
  try {
    console.log('🚗 Araba ürünü aranıyor...\n');

    // Araba ürününü bul
    const carProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: 'araba', mode: 'insensitive' } },
          { name: { contains: 'otomobil', mode: 'insensitive' } },
          { name: { contains: 'car', mode: 'insensitive' } },
          { slug: { contains: 'otomobil' } },
          { slug: { contains: 'araba' } },
        ]
      }
    });

    if (!carProduct) {
      console.log('❌ Araba ürünü bulunamadı!');
      console.log('\nMevcut tüm ödül ürünleri:');
      const allProducts = await prisma.product.findMany({
        where: { audience: 'DEALER' },
        select: { id: true, name: true, slug: true, imageUrl: true }
      });
      allProducts.forEach(p => {
        console.log(`  - ${p.name} (slug: ${p.slug})`);
        console.log(`    Image: ${p.imageUrl || 'YOK'}`);
      });
      return;
    }

    console.log(`✅ Araba bulundu: ${carProduct.name}`);
    console.log(`   Slug: ${carProduct.slug}`);
    console.log(`   Eski fotoğraf: ${carProduct.imageUrl || 'YOK'}\n`);

    // Yeni fotoğraf URL'i - lüks kırmızı spor araba
    const newImageUrl = 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=800&fit=crop';

    // Güncelle
    const updated = await prisma.product.update({
      where: { id: carProduct.id },
      data: { imageUrl: newImageUrl }
    });

    console.log('🎉 Araba fotoğrafı güncellendi!');
    console.log(`   Yeni fotoğraf: ${updated.imageUrl}`);
    console.log('\n✅ İşlem tamamlandı! Şimdi sayfayı yenile.');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCarImage();
