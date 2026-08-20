-- CreateTable
CREATE TABLE `import_staging_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jenis_aspek` ENUM('SKP', 'GAP_ASESMEN', 'PERILAKU', 'KARIR_PENDEK', 'KARIR_MENENGAH') NOT NULL,
    `periode_tahun` INTEGER NOT NULL,
    `triwulan` ENUM('TW1', 'TW2', 'TW3', 'TW4') NOT NULL,
    `npp` VARCHAR(50) NOT NULL,
    `narasi` TEXT NOT NULL,
    `metadata` JSON NULL,
    `is_consumed` BOOLEAN NOT NULL DEFAULT false,
    `id_dialog` INTEGER NULL,
    `batch_id` VARCHAR(100) NOT NULL,
    `imported_by` INTEGER NOT NULL,
    `imported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `import_staging_items_npp_jenis_aspek_periode_tahun_triwulan_idx`(`npp`, `jenis_aspek`, `periode_tahun`, `triwulan`),
    INDEX `import_staging_items_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `import_staging_items` ADD CONSTRAINT `import_staging_items_imported_by_fkey` FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
