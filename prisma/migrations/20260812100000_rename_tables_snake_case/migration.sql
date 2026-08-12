-- Rename tables to snake_case per design (create_dialog_kinerja_db.sql).
-- MySQL on Laragon stores table names lowercased; RENAME keeps data intact.
RENAME TABLE `user` TO `users`;
RENAME TABLE `mastermetodepengembangan` TO `master_metode_pengembangan`;
RENAME TABLE `dialogkinerja` TO `dialog_kinerja`;
RENAME TABLE `dialogkinerjaaspek` TO `dialog_kinerja_aspek`;
RENAME TABLE `dialogkinerjaitem` TO `dialog_kinerja_item`;
