/*
  Warnings:

  - Added the required column `triwulan` to the `dialog_kinerja` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dialog_kinerja` ADD COLUMN `triwulan` ENUM('TW1', 'TW2', 'TW3', 'TW4') NOT NULL DEFAULT 'TW1';

-- Update existing rows based on month
UPDATE `dialog_kinerja` SET `triwulan` = 'TW1' WHERE MONTH(`created_at`) IN (1, 2, 3);
UPDATE `dialog_kinerja` SET `triwulan` = 'TW2' WHERE MONTH(`created_at`) IN (4, 5, 6);
UPDATE `dialog_kinerja` SET `triwulan` = 'TW3' WHERE MONTH(`created_at`) IN (7, 8, 9);
UPDATE `dialog_kinerja` SET `triwulan` = 'TW4' WHERE MONTH(`created_at`) IN (10, 11, 12);
