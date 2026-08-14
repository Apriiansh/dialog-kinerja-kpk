/*
  Warnings:

  - You are about to drop the column `tanggal_next_riviu` on the `reviu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `reviu` DROP COLUMN `tanggal_next_riviu`,
    ADD COLUMN `tanggal_next_reviu` DATE NULL;
