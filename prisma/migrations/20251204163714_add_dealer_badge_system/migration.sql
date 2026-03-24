-- CreateEnum
CREATE TYPE "DealerBadge" AS ENUM ('STANDARD', 'BRONZE', 'GOLD', 'PLATINUM');

-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "badge" "DealerBadge" NOT NULL DEFAULT 'STANDARD';
