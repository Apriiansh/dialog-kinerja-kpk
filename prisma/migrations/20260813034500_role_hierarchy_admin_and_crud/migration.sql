/*
  Warnings:

  - You are about to alter the column `waktu_pelaksanaan` on the `dialog_kinerja_item` table. The data in that column could be lost. The data in that column will be cast from `VarChar(150)` to `DateTime(3)`.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `dialog_kinerja` DROP FOREIGN KEY `DialogKinerja_id_atasan_fkey`;

-- DropForeignKey
ALTER TABLE `dialog_kinerja` DROP FOREIGN KEY `DialogKinerja_id_pegawai_fkey`;

-- DropForeignKey
ALTER TABLE `dialog_kinerja_aspek` DROP FOREIGN KEY `DialogKinerjaAspek_id_dialog_fkey`;

-- DropForeignKey
ALTER TABLE `dialog_kinerja_item` DROP FOREIGN KEY `DialogKinerjaItem_id_aspek_fkey`;

-- DropForeignKey
ALTER TABLE `dialog_kinerja_item` DROP FOREIGN KEY `DialogKinerjaItem_id_metode_pengembangan_fkey`;

-- AlterTable
ALTER TABLE `dialog_kinerja_item` MODIFY `waktu_pelaksanaan` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `users` DROP COLUMN `role`,
    ADD COLUMN `as_pegawai` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `default_role` ENUM('ADMIN', 'ATASAN', 'PEGAWAI') NOT NULL DEFAULT 'PEGAWAI',
    ADD COLUMN `id_atasan` INTEGER NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `is_admin` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_id_atasan_fkey` FOREIGN KEY (`id_atasan`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dialog_kinerja` ADD CONSTRAINT `dialog_kinerja_id_atasan_fkey` FOREIGN KEY (`id_atasan`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dialog_kinerja` ADD CONSTRAINT `dialog_kinerja_id_pegawai_fkey` FOREIGN KEY (`id_pegawai`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dialog_kinerja_aspek` ADD CONSTRAINT `dialog_kinerja_aspek_id_dialog_fkey` FOREIGN KEY (`id_dialog`) REFERENCES `dialog_kinerja`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dialog_kinerja_item` ADD CONSTRAINT `dialog_kinerja_item_id_aspek_fkey` FOREIGN KEY (`id_aspek`) REFERENCES `dialog_kinerja_aspek`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dialog_kinerja_item` ADD CONSTRAINT `dialog_kinerja_item_id_metode_pengembangan_fkey` FOREIGN KEY (`id_metode_pengembangan`) REFERENCES `master_metode_pengembangan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `dialog_kinerja_aspek` RENAME INDEX `DialogKinerjaAspek_id_dialog_jenis_aspek_key` TO `dialog_kinerja_aspek_id_dialog_jenis_aspek_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `User_nip_key` TO `users_nip_key`;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `User_npp_key` TO `users_npp_key`;
