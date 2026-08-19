-- AlterTable
ALTER TABLE `dialog_kinerja` ADD COLUMN `id_dialog_induk` INTEGER NULL;

-- AlterTable
ALTER TABLE `dialog_kinerja_item` ADD COLUMN `capaian_keterangan` TEXT NULL,
    ADD COLUMN `is_tercapai` BOOLEAN NULL;

-- AddForeignKey
ALTER TABLE `dialog_kinerja` ADD CONSTRAINT `dialog_kinerja_id_dialog_induk_fkey` FOREIGN KEY (`id_dialog_induk`) REFERENCES `dialog_kinerja`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
