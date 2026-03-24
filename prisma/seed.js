// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding started...');

  // İsteğe bağlı: önce ürün ve kategori tablolarını temizleyelim
  // (referral, dealer vs. tablolara dokunmuyoruz)
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // -------- 1) KATEGORİLERİ OLUŞTUR --------
  const categoriesData = [
    {
      name: 'Serum',
      slug: 'serum',
    },
    {
      name: 'Krem',
      slug: 'krem',
    },
    {
      name: 'Tonik',
      slug: 'tonik',
    },
    {
      name: 'Temizleyici',
      slug: 'temizleyici',
    },
    {
      name: 'Maske (Kabin)',
      slug: 'maske-kabin',
    },
    {
      name: 'Kabin Ürünleri',
      slug: 'kabin-urunleri',
    },
  ];

  const categoryMap = {};

  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
      },
    });

    categoryMap[cat.slug] = created.id;
  }

  console.log('✅ Categories seeded.');

  // -------- 2) ÜRÜNLERİ OLUŞTUR --------
  const productsData = [
    // --- Serumlar ---
    {
      name: 'Beauty Magic AHA+BHA Serum',
      slug: 'beauty-magic-aha-bha-serum',
      description: 'AHA ve BHA içeren, cilt yüzeyini arındırmaya ve aydınlatmaya yardımcı profesyonel serum. Cilt yüzeyindeki ölü hücrelerin uzaklaştırılmasına yardımcı olur, ciltte sıkılaşma ve toparlanma hissi destekler.',
      priceCents: 29990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun1%20(1).jpeg',
    },
    {
      name: 'Whitening Serum (Beyazlatıcı Serum)',
      slug: 'whitening-serum',
      description: 'Alpha arbutin içeren, ton eşitlemeye ve cildi aydınlatmaya yardımcı beyazlatıcı serum. Cilt tonunun daha dengeli görünmesine katkı sağlar.',
      priceCents: 32990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun2.jpeg',
    },
    {
      name: 'Sebum Balancing Serum (Akne Karşıtı)',
      slug: 'sebum-balancing-serum',
      description: 'Yağlı ve akneye eğilimli ciltler için sebum dengelemeye yardımcı akne karşıtı serum. Akneli görünümün hafiflemesine destek olur.',
      priceCents: 31990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun3.jpeg',
    },
    {
      name: 'Vitamin C Serum (C Vitamini)',
      slug: 'vitamin-c-serum',
      description: 'C vitamini bileşeni ile cilt ışıltısını ortaya çıkarmaya ve gözenek görünümünü azaltmaya yardımcı serum. Mat ve yorgun cilt görünümünü canlandırmaya yardımcı olur.',
      priceCents: 34990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun4.jpeg',
    },
    {
      name: 'Anti Dark Spot Serum (Leke Karşıtı)',
      slug: 'anti-dark-spot-serum',
      description: 'Leke görünümünü hafifletmeye ve cilt tonunu eşitlemeye yardımcı leke karşıtı serum. Cilt kusurlarının ve leke görünümünün azalmasına destek olur.',
      priceCents: 33990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun5.jpeg',
    },
    {
      name: 'Hyaluronic Acid Serum',
      slug: 'hyaluronic-acid-serum',
      description: 'Yoğun nemlendirme ve dolgunluk etkisi için hyaluronik asit içeren serum. Cildin dış yüzeyinde koruyucu nem bariyeri oluşturmaya yardımcı olur.',
      priceCents: 35990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun6.jpeg',
    },
    {
      name: 'Anti Aging Serum (Yaşlanma Karşıtı)',
      slug: 'anti-aging-serum',
      description: 'Yaşlanma belirtilerini hedefleyen, hücre yenilenmesini destekleyen anti-aging serum. Kırışıklık ve ince çizgi görünümünün azalmasına katkı sağlar.',
      priceCents: 37990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'serum',
      imageUrl: '/uploads/Alinaurunfotograflari/urun7.jpeg',
    },

    // --- Kremler ---
    {
      name: 'Age Reversist Gece & Gündüz Kremi (Ozonlu)',
      slug: 'age-reversist-cream',
      description: 'Ozon etkisi ile nem tutmayı ve kırışıklık görünümünü azaltmayı hedefleyen gece–gündüz kremi. Ciltte yüksek nem tutulmasına yardımcı olur.',
      priceCents: 44990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop',
    },
    {
      name: 'Epilation Cream (Epilasyon Sonrası Krem)',
      slug: 'epilation-cream',
      description: 'Epilasyon sonrası hassas bölgeleri rahatlatmaya yardımcı bakım kremi. Uygulama yapılan bölgede ferahlık ve konfor hissi sağlar.',
      priceCents: 38990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1556228724-c5f2e4f8b552?w=500&h=500&fit=crop',
    },
    {
      name: 'Anti Forming Cream (Selülit Kremi)',
      slug: 'anti-forming-cream',
      description: 'Selülit görünümünü ve portakal kabuğu görünümünü hedefleyen bölgesel bakım kremi. Portakal kabuğu görünümünün hafiflemesine yardımcı olur.',
      priceCents: 42990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&h=500&fit=crop',
    },
    {
      name: 'Sun Protection Cream (Kolajenli Güneş Kremi)',
      slug: 'sun-protection-cream',
      description: 'Kolajen içeren, UVA/UVB ışınlarına karşı yüksek koruma sağlayan güneş kremi. Güneşin zararlı UVA/UVB etkilerine karşı koruma sunar.',
      priceCents: 39990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1631730486062-05a8c3c1ad1d?w=500&h=500&fit=crop',
    },
    {
      name: 'Kayısı Peeling Krem (Lazer Sonrası)',
      slug: 'kayisi-peeling-krem-laser',
      description: 'Lazer sonrası bakım için, kayısı özlü peeling kremi. Lazer sonrası oluşan hassasiyet görünümünü yatıştırmaya yardımcı olur.',
      priceCents: 36990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop',
    },
    {
      name: 'Sebum Balancing Cream (Akne Karşıtı Krem)',
      slug: 'sebum-balancing-cream',
      description: 'Akneli ve yağlı ciltler için sebum dengesini destekleyen bakım kremi. Tıkanmış gözeneklerin açılmasına ve aknelerin kurumasına yardımcı olur.',
      priceCents: 35990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1570194065650-d99fb4b93f8d?w=500&h=500&fit=crop',
    },
    {
      name: 'Anti Dark Spot Cream (Leke Karşıtı Krem)',
      slug: 'anti-dark-spot-cream',
      description: 'Leke görünümünü hafifletmeye ve cilt tonunu dengelemeye yönelik leke kremi. Ciltte rahatsızlık veren leke görünümünün azalmasına destek olur.',
      priceCents: 37990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1556228852-80a1e68e6bcd?w=500&h=500&fit=crop',
    },
    {
      name: 'Whitening Cream (Alpha Arbutin Beyazlatıcı Krem)',
      slug: 'whitening-cream',
      description: 'Alpha arbutin ile ton açmaya ve çeşitli leke tiplerini hafifletmeye yönelik beyazlatıcı krem. Cilt tonunu açarak daha aydınlık görünüm hedefler.',
      priceCents: 38990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'krem',
      imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&h=500&fit=crop',
    },

    // --- Tonik ---
    {
      name: 'Moisturizer Face Tonic (Yüz Temizleme Tonik)',
      slug: 'moisturizer-face-tonic',
      description: 'Cildi arındırmaya ve aydınlatmaya yardımcı yüz temizleme toniği. Cilt yüzeyinde antiseptik etki sağlayarak hijyen hissi verir.',
      priceCents: 24990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'tonik',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop',
    },

    // --- Temizleyici ---
    {
      name: 'Face Cleansing Gel (Yüz Temizleme Jeli)',
      slug: 'face-cleansing-gel',
      description: 'Cildi kurutmadan nazikçe temizleyen yüz jeli. Cildi yağ ve kirden arındırmaya yardımcı olur, komedojenik değildir.',
      priceCents: 26990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'temizleyici',
      imageUrl: 'https://images.unsplash.com/photo-1556228852-80a1e68e6bcd?w=500&h=500&fit=crop',
    },

    // --- Maske (Kabin) ---
    {
      name: 'Moisture Bomb Mask (Yüz Maskesi – Nemlendirme)',
      slug: 'moisture-bomb-mask',
      description: 'Yoğun nemlendirme ve anti-aging etkisini hedefleyen kabin tipi yüz maskesi. Cildi derinlemesine nemlendirmeye yardımcı olur.',
      priceCents: 54990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'maske-kabin',
      imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&h=500&fit=crop',
    },
    {
      name: 'Yüz Maskesi (Bal Kabağı)',
      slug: 'pumpkin-face-mask',
      description: 'Bal kabağı özlü, temizleyici ve antioksidan etkili kabin tipi yüz maskesi. Cildi derinlemesine temizlemeye yardımcı olur.',
      priceCents: 52990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'maske-kabin',
      imageUrl: 'https://images.unsplash.com/photo-1556228724-c5f2e4f8b552?w=500&h=500&fit=crop',
    },

    // --- Kabin Ürünleri ---
    {
      name: 'G5 Bölgesel İncelme Jeli (Anti Selülit Form)',
      slug: 'g5-regional-slimming-gel',
      description: 'G5 masaj cihazları ile kullanım için, selülit ve bölgesel incelme odaklı jel. Anti-selülit özellik sunarak selülit görünümünün hafiflemesine yardımcı olur.',
      priceCents: 48990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'kabin-urunleri',
      imageUrl: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=500&h=500&fit=crop',
    },
    {
      name: 'Nemlendirici Krem (Kabin)',
      slug: 'moisturizing-cream-cabin',
      description: 'Yoğun nemlendirme ve yumuşak doku hissi sağlayan kabin tipi nemlendirici. Cildi nemlendirir ve elastikiyetini artırmaya yardımcı olur.',
      priceCents: 46990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'kabin-urunleri',
      imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop',
    },
    {
      name: 'Kayısı Özlü Yüz Peeling (İnce Granül)',
      slug: 'apricot-face-peeling',
      description: 'Kayısı özlü, ince granüllü, yüz için arındırıcı kabin peelingi. Cildin sebum dengesini destekler, cildi kir ve ölü hücrelerden arındırmaya yardımcı olur.',
      priceCents: 43990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'kabin-urunleri',
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&h=500&fit=crop',
    },
    {
      name: 'Soyulabilir Altın Maske',
      slug: 'gold-peel-off-mask',
      description: 'Pürüzsüz ve aydınlık bir görünüm için soyulabilir altın yüz maskesi. Vitamin kompleksleri ile cildi besler ve elastikiyetini artırmaya katkı sağlar.',
      priceCents: 57990,
      isRewardProduct: false,
      coinPrice: null,
      categorySlug: 'kabin-urunleri',
      imageUrl: 'https://images.unsplash.com/photo-1556228852-80a1e68e6bcd?w=500&h=500&fit=crop',
    },
  ];

  for (const p of productsData) {
    const categoryId = p.categorySlug
      ? categoryMap[p.categorySlug]
      : null;

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl || null,
        isRewardProduct: p.isRewardProduct,
        coinPrice: p.coinPrice,
        categoryId,
      },
    });
  }

  console.log('✅ Products seeded.');

  // -------- ÖDÜL ÜRÜNLERİ --------
  console.log('🎁 Creating reward products...');
  
  const rewardProductsData = [
    // ========== MÜŞTERİ ÖDÜLLERİ (CUSTOMER) ==========
    {
      name: 'Arzum Fritöz',
      slug: 'arzum-fritoz-reward',
      description: 'Arzum Pratic Fritöz 3.5L - Günlük kullanım için ideal, kolay temizlenir',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 5000,
      targetAudience: 'CUSTOMER',
      categorySlug: null,
      imageUrl: '/reward-images/fritoz.png',
    },
    {
      name: 'Tefal Tencere Takımı',
      slug: 'tefal-tencere-reward',
      description: 'Tefal 9 Parça Paslanmaz Çelik Tencere Seti - Premium kalite mutfak seti',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 8000,
      targetAudience: 'CUSTOMER',
      categorySlug: null,
      imageUrl: '/reward-images/tencere.png',
    },
    {
      name: 'Karaca Kahve Makinesi',
      slug: 'karaca-kahve-reward',
      description: 'Karaca Hatır Hüps Türk Kahve Makinesi - Her sabah keyifli kahve',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 4500,
      targetAudience: 'CUSTOMER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop&q=80',
    },
    {
      name: 'Philips Blender Set',
      slug: 'philips-blender-reward',
      description: 'Philips Daily Collection Blender Seti - Sağlıklı smoothie\'ler için',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 3500,
      targetAudience: 'CUSTOMER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&h=800&fit=crop&q=80',
    },
    {
      name: 'Sinbo Tost Makinesi',
      slug: 'sinbo-tost-reward',
      description: 'Sinbo 4 Dilim Tost Makinesi - Pratik kahvaltılar için',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 2500,
      targetAudience: 'CUSTOMER',
      categorySlug: null,
      imageUrl: '/reward-images/tost.png',
    },
    {
      name: 'King Ütü',
      slug: 'king-utu-reward',
      description: 'King Buhar Ütü 2400W - Güçlü buhar performansı',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 3000,
      targetAudience: 'CUSTOMER',
      categorySlug: null,
      imageUrl: '/reward-images/utu.png',
    },

    // ========== BAYİ ÖDÜLLERİ (DEALER) ==========
    {
      name: 'Bodrum Tatil Paketi',
      slug: 'bodrum-tatil-reward',
      description: '5 Yıldızlı Otelde 7 Gün Her Şey Dahil Tatil - 2 Kişilik paket, deniz manzaralı oda',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 450000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=800&fit=crop&q=80',
    },
    {
      name: 'Antalya Lüks Otel Çeki',
      slug: 'antalya-otel-reward',
      description: 'Ultra Lüks Otelde 5 Gün Konaklama - Spa ve özel plaj kullanımı dahil',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 380000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=800&fit=crop&q=80',
    },
    {
      name: 'Samsung 65" QLED TV',
      slug: 'samsung-65-qled-reward',
      description: 'Samsung 65" QLED 4K Smart TV - Quantum HDR, Object Tracking Sound',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 650000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop&q=80',
    },
    {
      name: 'LG 77" OLED TV',
      slug: 'lg-77-oled-reward',
      description: 'LG 77" OLED 4K Smart TV - Dolby Vision IQ, α9 AI Processor',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 850000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&h=800&fit=crop&q=80',
    },
    {
      name: 'MacBook Pro 16" M3 Max',
      slug: 'macbook-pro-16-reward',
      description: 'MacBook Pro 16" M3 Max Chip 1TB SSD - En güçlü MacBook, profesyoneller için',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 950000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop&q=80',
    },
    {
      name: '🚗 2024 Model Sıfır Otomobil',
      slug: 'sifir-otomobil-reward',
      description: '2024 Model Sıfır Km Otomobil - En büyük ödül! Marka ve model seçimi size özel danışmanlarımızla belirlenecektir. Full paket, 5 yıl garanti dahil.',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 2500000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: '/uploads/Gemini_Generated_Image_yl3u8qyl3u8qyl3u.jpg',
    },
    {
      name: '💰 Gram Altın',
      slug: 'gram-altin-reward',
      description: '1 Gram 24 Ayar Külçe Altın - Yatırımın güvenli adresi. Sertifikalı ve garantili gram altın. İade ve takas imkanı ile.',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 5000,
      targetAudience: 'DEALER',
      categorySlug: null,
      imageUrl: '/reward-images/gram-altin.svg',
    },

    // ========== HEM MÜŞTERİ HEM BAYİ ÖDÜLLERİ (BOTH) ==========
    {
      name: 'Arzum Fritöz',
      slug: 'arzum-fritoz-both-reward',
      description: 'Arzum Pratic Fritöz 3.5L - Günlük kullanım için ideal, kolay temizlenir',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 5000,
      targetAudience: 'BOTH',
      categorySlug: null,
      imageUrl: '/reward-images/fritoz.png',
    },
    {
      name: 'Tefal Tencere Takımı',
      slug: 'tefal-tencere-both-reward',
      description: 'Tefal 9 Parça Paslanmaz Çelik Tencere Seti - Premium kalite mutfak seti',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 8000,
      targetAudience: 'BOTH',
      categorySlug: null,
      imageUrl: '/reward-images/tencere.png',
    },
    {
      name: 'Sinbo Tost Makinesi',
      slug: 'sinbo-tost-both-reward',
      description: 'Sinbo 4 Dilim Tost Makinesi - Pratik kahvaltılar için',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 2500,
      targetAudience: 'BOTH',
      categorySlug: null,
      imageUrl: '/reward-images/tost.png',
    },
    {
      name: 'King Ütü',
      slug: 'king-utu-both-reward',
      description: 'King Buhar Ütü 2400W - Güçlü buhar performansı',
      priceCents: 0,
      isRewardProduct: true,
      coinPrice: 3000,
      targetAudience: 'BOTH',
      categorySlug: null,
      imageUrl: '/reward-images/utu.png',
    },
  ];

  for (const p of rewardProductsData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        isRewardProduct: p.isRewardProduct,
        coinPrice: p.coinPrice,
        targetAudience: p.targetAudience || 'BOTH',
        imageUrl: p.imageUrl,
        categoryId: null, // Ödül ürünlerinin kategorisi yok
      },
    });
  }

  console.log('✅ Reward products seeded.');

  // -------- 3) TEST KULLANICILAR OLUŞTUR --------
  // Test kullanıcısı 1 (Müşteri)
  const testPassword = await bcrypt.hash('123', 10);
  
  // ========== TEST KULLANICILAR ==========
  
  // Müşteri 1
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: testPassword,
      fullName: 'Normal Müşteri',
      role: 'USER',
      coins: 1000,
      referralCode: 'CUST001',
    },
  });

  // ========== BAYI 1: STANDARD ==========
  const dealer1 = await prisma.user.upsert({
    where: { email: 'bayi1@test.com' },
    update: {},
    create: {
      email: 'bayi1@test.com',
      password: testPassword,
      fullName: 'Bayi 1 - Standard',
      role: 'DEALER',
      coins: 10000,
      referralCode: 'BAYI001',
    },
  });

  const dealerProfile1 = await prisma.dealer.upsert({
    where: { userId: dealer1.id },
    update: {},
    create: {
      userId: dealer1.id,
      companyName: 'Standart Bayi Ltd.',
      phone: '+90 555 001 0001',
      address: 'İstanbul, Türkiye',
      status: 'APPROVED',
      referralCode: 'BAYI001',
      badge: 'STANDARD',
    },
  });

  await prisma.coinWallet.upsert({
    where: { dealerId: dealerProfile1.id },
    update: {},
    create: {
      dealerId: dealerProfile1.id,
      balance: 10000,
    },
  });

  // ========== BAYI 2: BRONZE ==========
  const dealer2 = await prisma.user.upsert({
    where: { email: 'bayi2@test.com' },
    update: {},
    create: {
      email: 'bayi2@test.com',
      password: testPassword,
      fullName: 'Bayi 2 - Bronze',
      role: 'DEALER',
      coins: 25000,
      referralCode: 'BAYI002',
    },
  });

  const dealerProfile2 = await prisma.dealer.upsert({
    where: { userId: dealer2.id },
    update: {},
    create: {
      userId: dealer2.id,
      companyName: 'Bronze Bayi Ltd.',
      phone: '+90 555 002 0002',
      address: 'Ankara, Türkiye',
      status: 'APPROVED',
      referralCode: 'BAYI002',
      badge: 'BRONZE',
    },
  });

  await prisma.coinWallet.upsert({
    where: { dealerId: dealerProfile2.id },
    update: {},
    create: {
      dealerId: dealerProfile2.id,
      balance: 25000,
    },
  });

  // ========== BAYI 3: GOLD ==========
  const dealer3 = await prisma.user.upsert({
    where: { email: 'bayi3@test.com' },
    update: {},
    create: {
      email: 'bayi3@test.com',
      password: testPassword,
      fullName: 'Bayi 3 - Gold',
      role: 'DEALER',
      coins: 50000,
      referralCode: 'BAYI003',
    },
  });

  const dealerProfile3 = await prisma.dealer.upsert({
    where: { userId: dealer3.id },
    update: {},
    create: {
      userId: dealer3.id,
      companyName: 'Gold Bayi Ltd.',
      phone: '+90 555 003 0003',
      address: 'İzmir, Türkiye',
      status: 'APPROVED',
      referralCode: 'BAYI003',
      badge: 'GOLD',
    },
  });

  await prisma.coinWallet.upsert({
    where: { dealerId: dealerProfile3.id },
    update: {},
    create: {
      dealerId: dealerProfile3.id,
      balance: 50000,
    },
  });

  // ========== BAYI 4: PLATINUM ==========
  const dealer4 = await prisma.user.upsert({
    where: { email: 'bayi4@test.com' },
    update: {},
    create: {
      email: 'bayi4@test.com',
      password: testPassword,
      fullName: 'Bayi 4 - Platinum',
      role: 'DEALER',
      coins: 100000,
      referralCode: 'BAYI004',
    },
  });

  const dealerProfile4 = await prisma.dealer.upsert({
    where: { userId: dealer4.id },
    update: {},
    create: {
      userId: dealer4.id,
      companyName: 'Platinum Bayi Ltd.',
      phone: '+90 555 004 0004',
      address: 'Bursa, Türkiye',
      status: 'APPROVED',
      referralCode: 'BAYI004',
      badge: 'PLATINUM',
    },
  });

  await prisma.coinWallet.upsert({
    where: { dealerId: dealerProfile4.id },
    update: {},
    create: {
      dealerId: dealerProfile4.id,
      balance: 100000,
    },
  });

  // ========== REFERRAL KAYITLARI OLUŞTUR ==========
  // Bayi1 için 3 referral (STANDARD - 5'e ulaşınca BRONZE olacak)
  const refUsers1 = [];
  for (let i = 1; i <= 3; i++) {
    const refUser = await prisma.user.upsert({
      where: { email: `ref1-user${i}@test.com` },
      update: {},
      create: {
        email: `ref1-user${i}@test.com`,
        password: testPassword,
        fullName: `Bayi1 Referansı ${i}`,
        role: 'USER',
        coins: 0,
        referralCode: `REF1U${i}`,
      },
    });
    refUsers1.push(refUser);
    
    await prisma.referral.upsert({
      where: {
        referrerUserId_referredUserId: {
          referrerUserId: dealer1.id,
          referredUserId: refUser.id,
        },
      },
      update: {},
      create: {
        referrerUserId: dealer1.id,
        referredUserId: refUser.id,
      },
    });
  }

  // Bayi2 için 7 referral (BRONZE - 5-19 arası)
  const refUsers2 = [];
  for (let i = 1; i <= 7; i++) {
    const refUser = await prisma.user.upsert({
      where: { email: `ref2-user${i}@test.com` },
      update: {},
      create: {
        email: `ref2-user${i}@test.com`,
        password: testPassword,
        fullName: `Bayi2 Referansı ${i}`,
        role: 'USER',
        coins: 0,
        referralCode: `REF2U${i}`,
      },
    });
    refUsers2.push(refUser);
    
    await prisma.referral.upsert({
      where: {
        referrerUserId_referredUserId: {
          referrerUserId: dealer2.id,
          referredUserId: refUser.id,
        },
      },
      update: {},
      create: {
        referrerUserId: dealer2.id,
        referredUserId: refUser.id,
      },
    });
  }

  // Bayi3 için 25 referral (GOLD - 20-49 arası)
  const refUsers3 = [];
  for (let i = 1; i <= 25; i++) {
    const refUser = await prisma.user.upsert({
      where: { email: `ref3-user${i}@test.com` },
      update: {},
      create: {
        email: `ref3-user${i}@test.com`,
        password: testPassword,
        fullName: `Bayi3 Referansı ${i}`,
        role: 'USER',
        coins: 0,
        referralCode: `REF3U${i}`,
      },
    });
    refUsers3.push(refUser);
    
    await prisma.referral.upsert({
      where: {
        referrerUserId_referredUserId: {
          referrerUserId: dealer3.id,
          referredUserId: refUser.id,
        },
      },
      update: {},
      create: {
        referrerUserId: dealer3.id,
        referredUserId: refUser.id,
      },
    });
  }

  // Bayi4 için 60 referral (PLATINUM - 50+)
  const refUsers4 = [];
  for (let i = 1; i <= 60; i++) {
    const refUser = await prisma.user.upsert({
      where: { email: `ref4-user${i}@test.com` },
      update: {},
      create: {
        email: `ref4-user${i}@test.com`,
        password: testPassword,
        fullName: `Bayi4 Referansı ${i}`,
        role: 'USER',
        coins: 0,
        referralCode: `REF4U${i}`,
      },
    });
    refUsers4.push(refUser);
    
    await prisma.referral.upsert({
      where: {
        referrerUserId_referredUserId: {
          referrerUserId: dealer4.id,
          referredUserId: refUser.id,
        },
      },
      update: {},
      create: {
        referrerUserId: dealer4.id,
        referredUserId: refUser.id,
      },
    });
  }

  console.log('✅ Referral kayıtları oluşturuldu:');
  console.log(`   Bayi1: 3 referans (STANDARD)`);
  console.log(`   Bayi2: 7 referans (BRONZE)`);
  console.log(`   Bayi3: 25 referans (GOLD)`);
  console.log(`   Bayi4: 60 referans (PLATINUM)`);
  console.log('');

  console.log('✅ Test hesapları oluşturuldu:');
  console.log('');
  console.log('📱 MÜŞTERI:');
  console.log('   Email: customer@test.com | Şifre: 123 | AlinaPuan: 1.000');
  console.log('');
  console.log('🏪 BAYILER:');
  console.log('   1️⃣  Email: bayi1@test.com  | Şifre: 123 | Rozet: STANDARD | AlinaPuan: 10.000');
  console.log('   2️⃣  Email: bayi2@test.com  | Şifre: 123 | Rozet: BRONZE   | AlinaPuan: 25.000');
  console.log('   3️⃣  Email: bayi3@test.com  | Şifre: 123 | Rozet: GOLD     | AlinaPuan: 50.000');
  console.log('   4️⃣  Email: bayi4@test.com  | Şifre: 123 | Rozet: PLATINUM | AlinaPuan: 100.000');
  console.log('');

  // -------- YORUMLAR (REVIEWS) --------
  console.log('💬 Creating fake reviews...');
  
  // Tüm ürünleri ve kullanıcıları al
  const allProducts = await prisma.product.findMany({ where: { isRewardProduct: false } });
  const allUsers = await prisma.user.findMany({ where: { role: 'USER' } });

  if (allProducts.length > 0 && allUsers.length > 0) {
    const reviewsData = [
      {
        rating: 5,
        title: 'Harika bir ürün!',
        comment: 'Cildinizde görünür bir fark yaratıyor. İlk kullanımdan sonra bile cildin daha pürüzsüz hissettiğini görebilirsiniz. Kesinlikle tavsiye ediyorum!',
        verified: true,
      },
      {
        rating: 4,
        title: 'Gayet iyi',
        comment: 'Beklentilerimi karşıladı. Fiyat/performans oranı oldukça iyi. Tavsiye ederim.',
        verified: true,
      },
      {
        rating: 5,
        title: 'Mükemmel!',
        comment: 'Uzun süredir kullanıyorum ve çok memnunum. Cildimdeki lekelerin azaldığını fark ettim. Herkese öneririm!',
        verified: true,
      },
      {
        rating: 5,
        title: 'Süper etkili',
        comment: 'Hassas cildim var ama hiç tahriş olmadan kullanabiliyorum. Kokusu da çok güzel, doğal ve hafif.',
        verified: true,
      },
      {
        rating: 4,
        title: 'İyi bir seçim',
        comment: 'Rutin bakımımın vazgeçilmezi oldu. Düzenli kullanınca farkını görüyorsunuz.',
        verified: false,
      },
      {
        rating: 5,
        title: 'Favorim oldu',
        comment: 'Cildimdeki ışıltıyı geri getirdi. Arkadaşlarım da fark etti ve nereden aldığımı sordular. Teşekkürler Alina!',
        verified: true,
      },
    ];

    // Her ürün için 3-6 arası rastgele yorum ekle
    for (const product of allProducts.slice(0, 10)) { // İlk 10 ürüne yorum ekle
      const reviewCount = Math.floor(Math.random() * 4) + 3; // 3-6 arası
      
      for (let i = 0; i < reviewCount && i < allUsers.length; i++) {
        const reviewTemplate = reviewsData[i % reviewsData.length];
        const user = allUsers[i];

        try {
          await prisma.review.create({
            data: {
              userId: user.id,
              productId: product.id,
              rating: reviewTemplate.rating,
              title: reviewTemplate.title,
              comment: reviewTemplate.comment,
              verified: reviewTemplate.verified,
              helpful: Math.floor(Math.random() * 50) + 5, // 5-55 arası
              images: i % 3 === 0 ? [product.imageUrl] : [], // Her 3 yorumdan biri fotoğraflı
            },
          });
        } catch (error) {
          // Duplicate review hatası - geç
          continue;
        }
      }
    }

    console.log('✅ Reviews seeded for products.');
  }

  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
