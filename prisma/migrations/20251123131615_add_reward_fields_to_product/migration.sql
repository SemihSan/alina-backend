-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "coinPrice" INTEGER,
ADD COLUMN     "isRewardProduct" BOOLEAN NOT NULL DEFAULT false;
