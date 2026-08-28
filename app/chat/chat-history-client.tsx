"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ChatsIcon,
  FolderOpenIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { ChatHistoryItem } from "@/lib/chat-queries";
import { deleteDialogChat } from "@/lib/actions/chat";
import { formatDistanceToNow } from "@/lib/utils/format";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function ChatHistoryClient({
  items,
  homePath,
}: {
  items: ChatHistoryItem[];
  homePath: string;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState(items);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (dialogId: number, partnerNama: string) => {
    if (!window.confirm(`Hapus seluruh riwayat chat dengan ${partnerNama}?`)) {
      return;
    }
    setDeletingId(dialogId);
    setError(null);
    const result = await deleteDialogChat(dialogId);
    setDeletingId(null);
    if (result.success) {
      setConversations((prev) =>
        prev.filter((c) => c.dialogId !== dialogId),
      );
    } else {
      setError(result.error || "Gagal menghapus percakapan");
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-surface-sunken">
      {/* Top Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline bg-surface px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={homePath}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-surface text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-base font-semibold text-ink">
              <ChatsIcon size={20} weight="bold" className="text-primary" />
              Riwayat Chat
            </h1>
            <p className="text-xs text-ink-muted">
              {conversations.length > 0
                ? `${conversations.length} percakapan`
                : "Belum ada percakapan"}
            </p>
          </div>
        </div>
      </header>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-2">
          {error && (
            <p className="mb-2 text-xs font-medium text-rose-500">{error}</p>
          )}

          {conversations.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-ink-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ChatsIcon size={28} />
              </div>
              <p className="text-base font-semibold text-ink">
                Belum ada riwayat chat
              </p>
              <p className="max-w-sm text-sm text-ink-muted">
                Percakapan dialog kinerja dengan atasan atau pegawai akan tampil
                di sini.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.dialogId}
                className="group flex items-center gap-3 rounded-xl border border-outline bg-surface p-3 transition-colors hover:border-primary/30 hover:bg-surface-muted"
              >
                <Link
                  href={`/chat/${conversation.dialogId}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-strong">
                    {initials(conversation.partnerNama)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {conversation.partnerNama}
                      </p>
                      {conversation.lastMessageAt && (
                        <span className="shrink-0 text-[11px] text-ink-muted">
                          {formatDistanceToNow(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-ink-muted">
                        {conversation.lastMessageByMe
                          ? "Anda: "
                          : ""}
                        {conversation.lastMessage}
                      </p>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                          {conversation.partnerLabel}
                        </span>
                        {conversation.status !== "selesai" &&
                          conversation.messageCount > 0 && (
                            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                              {conversation.messageCount}
                            </span>
                          )}
                      </span>
                    </div>
                  </div>
                </Link>
                <Link
                  href={conversation.dialogPath}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunken hover:text-primary"
                  title="Buka Dialog Kinerja"
                  aria-label="Buka Dialog Kinerja"
                >
                  <FolderOpenIcon size={15} weight="bold" />
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    handleDelete(
                      conversation.dialogId,
                      conversation.partnerNama,
                    )
                  }
                  disabled={deletingId === conversation.dialogId}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-wait disabled:opacity-50"
                  title="Hapus percakapan"
                  aria-label="Hapus percakapan"
                >
                  {deletingId === conversation.dialogId ? (
                    <SpinnerIcon size={15} className="animate-spin" />
                  ) : (
                    <TrashIcon size={15} weight="bold" />
                  )}
                </button>
              </div>
            ))
          )}

          <div className="flex justify-center pt-6">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="text-xs font-medium text-primary hover:underline"
            >
              Muat ulang daftar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}