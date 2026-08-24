-- CreateTable
CREATE TABLE "dialog_chat_messages" (
    "id" SERIAL NOT NULL,
    "id_dialog" INTEGER NOT NULL,
    "id_sender" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dialog_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dialog_chat_messages_id_dialog_created_at_idx" ON "dialog_chat_messages"("id_dialog", "created_at");

-- AddForeignKey
ALTER TABLE "dialog_chat_messages" ADD CONSTRAINT "dialog_chat_messages_id_dialog_fkey" FOREIGN KEY ("id_dialog") REFERENCES "dialog_kinerja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialog_chat_messages" ADD CONSTRAINT "dialog_chat_messages_id_sender_fkey" FOREIGN KEY ("id_sender") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
