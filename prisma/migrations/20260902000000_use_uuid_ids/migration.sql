-- DropForeignKey
ALTER TABLE "dialog_chat_messages" DROP CONSTRAINT "dialog_chat_messages_id_dialog_fkey";

-- DropForeignKey
ALTER TABLE "dialog_chat_messages" DROP CONSTRAINT "dialog_chat_messages_id_sender_fkey";

-- DropForeignKey
ALTER TABLE "dialog_email_log" DROP CONSTRAINT "dialog_email_log_id_dialog_fkey";

-- DropForeignKey
ALTER TABLE "dialog_kinerja" DROP CONSTRAINT "dialog_kinerja_id_atasan_fkey";

-- DropForeignKey
ALTER TABLE "dialog_kinerja" DROP CONSTRAINT "dialog_kinerja_id_dialog_induk_fkey";

-- DropForeignKey
ALTER TABLE "dialog_kinerja" DROP CONSTRAINT "dialog_kinerja_id_pegawai_fkey";

-- DropForeignKey
ALTER TABLE "dialog_kinerja_aspek" DROP CONSTRAINT "dialog_kinerja_aspek_id_dialog_fkey";

-- DropForeignKey
ALTER TABLE "dialog_kinerja_item" DROP CONSTRAINT "dialog_kinerja_item_id_aspek_fkey";

-- DropForeignKey
ALTER TABLE "import_staging_items" DROP CONSTRAINT "import_staging_items_imported_by_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_id_user_fkey";

-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reviu" DROP CONSTRAINT "reviu_id_dialog_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_id_atasan_fkey";

-- AlterTable
ALTER TABLE "dialog_chat_messages" ALTER COLUMN "id_dialog" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_sender" SET DATA TYPE VARCHAR(36);

-- AlterTable
ALTER TABLE "dialog_email_log" ALTER COLUMN "id_dialog" SET DATA TYPE VARCHAR(36);

-- AlterTable
ALTER TABLE "dialog_kinerja" DROP CONSTRAINT "dialog_kinerja_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_atasan" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_pegawai" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_dialog_induk" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "dialog_kinerja_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "dialog_kinerja_id_seq";

-- AlterTable
ALTER TABLE "dialog_kinerja_aspek" DROP CONSTRAINT "dialog_kinerja_aspek_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_dialog" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "dialog_kinerja_aspek_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "dialog_kinerja_aspek_id_seq";

-- AlterTable
ALTER TABLE "dialog_kinerja_item" DROP CONSTRAINT "dialog_kinerja_item_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_aspek" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "dialog_kinerja_item_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "dialog_kinerja_item_id_seq";

-- AlterTable
ALTER TABLE "import_staging_items" ALTER COLUMN "id_dialog" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "imported_by" SET DATA TYPE VARCHAR(36);

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id_user" SET DATA TYPE VARCHAR(36);

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(36);

-- AlterTable
ALTER TABLE "reviu" DROP CONSTRAINT "reviu_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_dialog" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "reviu_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "reviu_id_seq";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "id_atasan" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "users_id_seq";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_atasan_fkey" FOREIGN KEY ("id_atasan") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja" ADD CONSTRAINT "dialog_kinerja_id_atasan_fkey" FOREIGN KEY ("id_atasan") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja" ADD CONSTRAINT "dialog_kinerja_id_pegawai_fkey" FOREIGN KEY ("id_pegawai") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja" ADD CONSTRAINT "dialog_kinerja_id_dialog_induk_fkey" FOREIGN KEY ("id_dialog_induk") REFERENCES "dialog_kinerja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_email_log" ADD CONSTRAINT "dialog_email_log_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja_aspek" ADD CONSTRAINT "dialog_kinerja_aspek_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_kinerja_item" ADD CONSTRAINT "dialog_kinerja_item_id_aspek_fkey" FOREIGN KEY ("id_aspek") REFERENCES "dialog_kinerja_aspek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviu" ADD CONSTRAINT "reviu_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_chat_messages" ADD CONSTRAINT "dialog_chat_messages_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_chat_messages" ADD CONSTRAINT "dialog_chat_messages_id_sender_fkey" FOREIGN KEY ("id_sender") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_staging_items" ADD CONSTRAINT "import_staging_items_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;