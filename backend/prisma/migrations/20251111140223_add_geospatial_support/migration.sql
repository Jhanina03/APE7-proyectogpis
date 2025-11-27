/*
  Warnings:

  - You are about to alter the column `location` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Unsupported("geometry(point, 4326)")`.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressType" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ALTER COLUMN "location" SET DATA TYPE geometry(point, 4326);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" geometry(point, 4326),
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Product_location_idx" ON "Product" USING GIST ("location");

-- CreateIndex
CREATE INDEX "User_location_idx" ON "User" USING GIST ("location");
