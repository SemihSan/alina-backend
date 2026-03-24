const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCarImage() {
  try {
    const updated = await prisma.product.update({
      where: { slug: 'sifir-otomobil-reward' },
      data: { 
        imageUrl: 'http://164.90.236.138:3001/uploads/Gemini_Generated_Image_yl3u8qyl3u8qyl3u.jpg' 
      }
    });
    
    console.log('✅ Araba fotoğrafı güncellendi!');
    console.log('📸 URL:', updated.imageUrl);
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCarImage();
