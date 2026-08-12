-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `npp` VARCHAR(50) NOT NULL,
    `nip` VARCHAR(50) NULL,
    `nama_pegawai` VARCHAR(255) NOT NULL,
    `tanggal_bergabung` DATE NULL,
    `nama_jabatan` VARCHAR(150) NULL,
    `unit_kerja` VARCHAR(150) NULL,
    `masa_kerja_unit_terakhir` VARCHAR(100) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ATASAN', 'PEGAWAI') NOT NULL DEFAULT 'PEGAWAI',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_npp_key`(`npp`),
    UNIQUE INDEX `User_nip_key`(`nip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MasterMetodePengembangan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_metode` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DialogKinerja` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_atasan` INTEGER NOT NULL,
    `id_pegawai` INTEGER NOT NULL,
    `periode_tahun` INTEGER NOT NULL,
    `deskripsi_kinerja` TEXT NULL,
    `status` ENUM('draft_atasan', 'menunggu_pegawai', 'menunggu_atasan', 'menunggu_validasi', 'selesai') NOT NULL DEFAULT 'draft_atasan',
    `is_valid_pegawai` BOOLEAN NOT NULL DEFAULT false,
    `is_valid_atasan` BOOLEAN NOT NULL DEFAULT false,
    `ttd_pegawai_path` VARCHAR(255) NULL,
    `ttd_atasan_path` VARCHAR(255) NULL,
    `waktu_validasi_pegawai` DATETIME(3) NULL,
    `waktu_validasi_atasan` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DialogKinerjaAspek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_dialog` INTEGER NOT NULL,
    `jenis_aspek` ENUM('SKP', 'GAP_ASESMEN', 'PERILAKU', 'KARIR_PENDEK', 'KARIR_MENENGAH') NOT NULL,
    `tanggung_jawab_pegawai` TEXT NULL,
    `tanggung_jawab_atasan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DialogKinerjaAspek_id_dialog_jenis_aspek_key`(`id_dialog`, `jenis_aspek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DialogKinerjaItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_aspek` INTEGER NOT NULL,
    `dialog_evaluasi` TEXT NULL,
    `kompetensi_dikembangkan` TEXT NULL,
    `id_metode_pengembangan` INTEGER NULL,
    `metode_pengembangan_lainnya` VARCHAR(255) NULL,
    `waktu_pelaksanaan` VARCHAR(150) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DialogKinerja` ADD CONSTRAINT `DialogKinerja_id_atasan_fkey` FOREIGN KEY (`id_atasan`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DialogKinerja` ADD CONSTRAINT `DialogKinerja_id_pegawai_fkey` FOREIGN KEY (`id_pegawai`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DialogKinerjaAspek` ADD CONSTRAINT `DialogKinerjaAspek_id_dialog_fkey` FOREIGN KEY (`id_dialog`) REFERENCES `DialogKinerja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DialogKinerjaItem` ADD CONSTRAINT `DialogKinerjaItem_id_aspek_fkey` FOREIGN KEY (`id_aspek`) REFERENCES `DialogKinerjaAspek`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DialogKinerjaItem` ADD CONSTRAINT `DialogKinerjaItem_id_metode_pengembangan_fkey` FOREIGN KEY (`id_metode_pengembangan`) REFERENCES `MasterMetodePengembangan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
