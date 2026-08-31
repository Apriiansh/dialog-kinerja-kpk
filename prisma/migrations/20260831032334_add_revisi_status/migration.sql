-- AlterEnum
ALTER TYPE "StatusDialog" ADD VALUE 'revisi_evaluasi';

-- AlterEnum
ALTER TYPE "StatusReviu" ADD VALUE 'revisi_capaian';

-- AlterTable
ALTER TABLE "reviu" ADD COLUMN     "alasan_tolak" TEXT;
