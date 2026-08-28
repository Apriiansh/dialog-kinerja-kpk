-- CreateTable
CREATE TABLE "dialog_email_log" (
    "id" SERIAL NOT NULL,
    "id_dialog" INTEGER NOT NULL,
    "jenis" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dialog_email_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dialog_email_log_id_dialog_jenis_key" ON "dialog_email_log"("id_dialog", "jenis");

-- AddForeignKey
ALTER TABLE "dialog_email_log" ADD CONSTRAINT "dialog_email_log_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;