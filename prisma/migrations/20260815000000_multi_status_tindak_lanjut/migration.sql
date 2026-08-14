/*
  Warnings:

  - You are about to drop the column `status_tindaklanjut` on the `reviu` table. All the data in the column will be lost.
  - You are about to drop the column `penjelasan` on the `reviu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `reviu`
    DROP COLUMN `status_tindaklanjut`,
    DROP COLUMN `penjelasan`,
    ADD COLUMN `is_tercapai` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_tidak_tercapai` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `penjelasan_tercapai` TEXT NULL,
    ADD COLUMN `penjelasan_tidak_tercapai` TEXT NULL;
