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
import {
  STATUS_CONFIG,
  type StatusTone,
} from "@/lib/constants/dialog-status";
import type { StatusDialog } from "@/generated/prisma/enums";

const STATUS_STYLES: Record<StatusTone, string> = {
  draft: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/70",
  "waiting-pegawai":
    "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/70",
  "waiting-atasan":
    "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/70",
  validation: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200/70",
  done: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/70",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function StatusChip({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as StatusDialog];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[config.tone]}`}
    >
      {config.label}
    </span>
  );
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
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline bg-surface px-4 shadow-xs sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={homePath}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline bg-surface text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </Link>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-base font-semibold text-ink">
              <ChatsIcon size={20} weight="bold" className="text-primary" />
              Riwayat Chat
            </h1>
            <p className="truncate text-xs text-ink-muted">
              {conversations.length > 0
                ? `${conversations.length} percakapan`
                : "Belum ada percakapan"}
            </p>
          </div>
        </div>
      </header>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-2.5">
          {error && (
            <p className="mb-2 text-xs font-medium text-rose-500">{error}</p>
          )}

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-outline bg-surface px-6 py-16 text-center">
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
            conversations.map((conversation) => {
              const isSelesai = conversation.status === "selesai";
              return (
                <div
                  key={conversation.dialogId}
                  className="group flex items-start gap-3 rounded-xl border border-outline bg-surface p-3 transition-colors hover:border-primary/30 hover:bg-surface-muted sm:items-center sm:gap-4 sm:p-4"
                >
                  <Link
                    href={`/chat/${conversation.dialogId}`}
                    className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-strong">
                      {initials(conversation.partnerNama)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-baseline gap-1.5">
                          <p className="truncate text-sm font-semibold text-ink">
                            {conversation.partnerNama}
                          </p>
                          <span className="shrink-0 text-[11px] text-ink-muted">
                            {conversation.periode}
                          </span>
                        </div>

                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {conversation.lastMessageByMe ? "Anda: " : ""}
                        {conversation.lastMessage}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusChip status={conversation.status} />
                        {!isSelesai && conversation.messageCount > 0 && (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-on-primary">
                            {conversation.messageCount}
                          </span>
                        )}
                        {conversation.lastMessageAt && (
                          <span className="shrink-0 text-[11px] text-ink-muted">
                            {formatDistanceToNow(conversation.lastMessageAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                    <Link
                      href={conversation.dialogPath}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-sunken hover:text-primary"
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
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-wait disabled:opacity-50"
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
                </div>
              );
            })
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
