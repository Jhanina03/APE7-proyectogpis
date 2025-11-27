-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductStatus" ADD VALUE 'DEACTIVATED';
ALTER TYPE "ProductStatus" ADD VALUE 'BANNED';

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "appealModeratorId" TEXT;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_appealModeratorId_fkey" FOREIGN KEY ("appealModeratorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
