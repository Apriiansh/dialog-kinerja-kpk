-- CreateTable
CREATE TABLE `reviu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_dialog` INTEGER NOT NULL,
    `status_tindaklanjut` ENUM('TERCAPAI', 'TIDAK_TERCAPAI') NOT NULL,
    `penjelasan` TEXT NOT NULL,
    `rencana_tindak_lanjut` TEXT NULL,
    `tanggal_next_riviu` DATE NULL,
    `status` ENUM('draft_pegawai', 'menunggu_atasan', 'menunggu_validasi', 'selesai') NOT NULL DEFAULT 'draft_pegawai',
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

-- AddForeignKey
ALTER TABLE `reviu` ADD CONSTRAINT `reviu_id_dialog_fkey` FOREIGN KEY (`id_dialog`) REFERENCES `dialog_kinerja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
