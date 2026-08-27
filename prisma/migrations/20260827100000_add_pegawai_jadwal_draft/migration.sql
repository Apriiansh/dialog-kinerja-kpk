-- AlterEnum
ALTER TYPE "StatusDialog" RENAME VALUE 'draft_atasan' TO 'draft';

-- AlterTable
ALTER TABLE "dialog_kinerja" ADD COLUMN     "deskripsi_pegawai" TEXT,
ADD COLUMN     "jadwal_dialog" DATE,
ADD COLUMN     "alasan_tolak" TEXT,
ALTER COLUMN "status" SET DEFAULT 'draft';
