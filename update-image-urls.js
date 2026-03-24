const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUrls() {
  const oldBase = 'http://localhost:3001';
  const newBase = 'https://alina-frontend-app.vercel.app';

  // Update uploads URLs
  const uploads = await prisma.$executeRawUnsafe(
    `UPDATE "Product" SET "imageUrl" = REPLACE("imageUrl", $1, $2) WHERE "imageUrl" LIKE $3`,
    oldBase + '/uploads/',
    newBase + '/uploads/',
    oldBase + '/uploads/%'
  );
  console.log(`Updated ${uploads} product upload URLs`);

  // Update reward-images URLs
  const rewards = await prisma.$executeRawUnsafe(
    `UPDATE "Product" SET "imageUrl" = REPLACE("imageUrl", $1, $2) WHERE "imageUrl" LIKE $3`,
    oldBase + '/reward-images/',
    newBase + '/reward-images/',
    oldBase + '/reward-images/%'
  );
  console.log(`Updated ${rewards} reward image URLs`);

  // Show all URLs now
  const products = await prisma.product.findMany({ select: { id: true, name: true, imageUrl: true } });
  products.forEach(p => console.log(`${p.id}: ${p.imageUrl}`));

  await prisma.$disconnect();
}

updateUrls().catch(e => { console.error(e); process.exit(1); });
