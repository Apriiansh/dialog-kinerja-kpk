-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ATASAN', 'PEGAWAI');

-- CreateEnum
CREATE TYPE "StatusDialog" AS ENUM ('draft_atasan', 'menunggu_pegawai', 'menunggu_atasan', 'menunggu_validasi', 'selesai');

-- CreateEnum
CREATE TYPE "JenisAspek" AS ENUM ('SKP', 'GAP_ASESMEN', 'PERILAKU', 'KARIR_PENDEK', 'KARIR_MENENGAH');

-- CreateEnum
CREATE TYPE "Triwulan" AS ENUM ('TW1', 'TW2', 'TW3', 'TW4');

-- CreateEnum
CREATE TYPE "StatusReviu" AS ENUM ('draft_pegawai', 'menunggu_atasan', 'menunggu_validasi', 'selesai');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "npp" VARCHAR(50) NOT NULL,
    "nip" VARCHAR(50),
    "nama_pegawai" VARCHAR(255) NOT NULL,
    "tanggal_bergabung" DATE,
    "nama_jabatan" VARCHAR(150),
    "unit_kerja" VARCHAR(150),
    "masa_kerja_unit_terakhir" VARCHAR(100),
    "password" VARCHAR(255) NOT NULL,
    "default_role" "Role" NOT NULL DEFAULT 'PEGAWAI',
    "as_pegawai" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_atasan" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_metode_pengembangan" (
    "id" SERIAL NOT NULL,
    "nama_metode" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "master_metode_pengembangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialog_kinerja" (
    "id" SERIAL NOT NULL,
    "id_atasan" INTEGER NOT NULL,
    "id_pegawai" INTEGER NOT NULL,
    "periode_tahun" INTEGER NOT NULL,
    "triwulan" "Triwulan" NOT NULL,
    "deskripsi_kinerja" TEXT,
    "status" "StatusDialog" NOT NULL DEFAULT 'draft_atasan',
    "is_valid_pegawai" BOOLEAN NOT NULL DEFAULT false,
    "is_valid_atasan" BOOLEAN NOT NULL DEFAULT false,
    "ttd_pegawai_path" VARCHAR(255),
    "ttd_atasan_path" VARCHAR(255),
    "waktu_validasi_pegawai" TIMESTAMP(3),
    "waktu_validasi_atasan" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "id_dialog_induk" INTEGER,

    CONSTRAINT "dialog_kinerja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialog_kinerja_aspek" (
    "id" SERIAL NOT NULL,
    "id_dialog" INTEGER NOT NULL,
    "jenis_aspek" "JenisAspek" NOT NULL,
    "tanggung_jawab_pegawai" TEXT,
    "tanggung_jawab_atasan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialog_kinerja_aspek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialog_kinerja_item" (
    "id" SERIAL NOT NULL,
    "id_aspek" INTEGER NOT NULL,
    "dialog_evaluasi" TEXT,
    "kompetensi_dikembangkan" TEXT,
    "id_metode_pengembangan" INTEGER,
    "metode_pengembangan_lainnya" VARCHAR(255),
    "waktu_pelaksanaan" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "is_tercapai" BOOLEAN,
    "capaian_keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialog_kinerja_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviu" (
    "id" SERIAL NOT NULL,
    "id_dialog" INTEGER NOT NULL,
    "is_tercapai" BOOLEAN NOT NULL DEFAULT false,
    "is_tidak_tercapai" BOOLEAN NOT NULL DEFAULT false,
    "penjelasan_tercapai" TEXT,
    "penjelasan_tidak_tercapai" TEXT,
    "rencana_tindak_lanjut" TEXT,
    "tanggal_next_reviu" DATE,
    "status" "StatusReviu" NOT NULL DEFAULT 'draft_pegawai',
    "is_valid_pegawai" BOOLEAN NOT NULL DEFAULT false,
    "is_valid_atasan" BOOLEAN NOT NULL DEFAULT false,
    "ttd_pegawai_path" VARCHAR(255),
    "ttd_atasan_path" VARCHAR(255),
    "waktu_validasi_pegawai" TIMESTAMP(3),
    "waktu_validasi_atasan" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "link" VARCHAR(500) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_staging_items" (
    "id" SERIAL NOT NULL,
    "jenis_aspek" "JenisAspek" NOT NULL,
    "periode_tahun" INTEGER NOT NULL,
    "triwulan" "Triwulan" NOT NULL,
    "npp" VARCHAR(50) NOT NULL,
    "narasi" TEXT NOT NULL,
    "metadata" JSONB,
    "is_consumed" BOOLEAN NOT NULL DEFAULT false,
    "id_dialog" INTEGER,
    "batch_id" VARCHAR(100) NOT NULL,
    "imported_by" INTEGER NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_staging_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_npp_key" ON "users"("npp");

-- CreateIndex
CREATE UNIQUE INDEX "users_nip_key" ON "users"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "dialog_kinerja_aspek_id_dialog_jenis_aspek_key" ON "dialog_kinerja_aspek"("id_dialog", "jenis_aspek");

-- CreateIndex
CREATE INDEX "notifications_id_user_is_read_idx" ON "notifications"("id_user", "is_read");

-- CreateIndex
CREATE INDEX "notifications_id_user_created_at_idx" ON "notifications"("id_user", "created_at");

-- CreateIndex
CREATE INDEX "import_staging_items_npp_jenis_aspek_periode_tahun_triwulan_idx" ON "import_staging_items"("npp", "jenis_aspek", "periode_tahun", "triwulan");

-- CreateIndex
CREATE INDEX "import_staging_items_batch_id_idx" ON "import_staging_items"("batch_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_atasan_fkey" FOREIGN KEY ("id_atasan") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja" ADD CONSTRAINT "dialog_kinerja_id_atasan_fkey" FOREIGN KEY ("id_atasan") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja" ADD CONSTRAINT "dialog_kinerja_id_pegawai_fkey" FOREIGN KEY ("id_pegawai") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja" ADD CONSTRAINT "dialog_kinerja_id_dialog_induk_fkey" FOREIGN KEY ("id_dialog_induk") REFERENCES "dialog_kinerja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja_aspek" ADD CONSTRAINT "dialog_kinerja_aspek_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja_item" ADD CONSTRAINT "dialog_kinerja_item_id_aspek_fkey" FOREIGN KEY ("id_aspek") REFERENCES "dialog_kinerja_aspek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja_item" ADD CONSTRAINT "dialog_kinerja_item_id_metode_pengembangan_fkey" FOREIGN KEY ("id_metode_pengembangan") REFERENCES "master_metode_pengembangan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviu" ADD CONSTRAINT "reviu_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging_items" ADD CONSTRAINT "import_staging_items_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
