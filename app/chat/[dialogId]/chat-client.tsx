"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ChatCircleDotsIcon,
  PaperPlaneTiltIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useChat } from "@/lib/hooks/use-chat";

type ChatClientProps = {
  dialogId: string;
};

export default function ChatClient({ dialogId }: ChatClientProps) {
  const router = useRouter();
  const numDialogId = Number(dialogId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    dialogInfo,
    input,
    setInput,
    isLoading,
    isSending,
    isConnected,
    error,
    sendMessage,
  } = useChat(numDialogId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;
    await sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-surface-sunken">
      {/* Top Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline bg-surface px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline bg-surface text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Kembali"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-ink flex items-center gap-2">
              Chat Dialog #{dialogId}
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
                title={isConnected ? "Terhubung" : "Menghubungkan..."}
              />
            </h1>
            {dialogInfo && (
              <p className="text-xs text-ink-muted">
                Pegawai: {dialogInfo.pegawai.nama} · Atasan: {dialogInfo.atasan.nama}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-ink-muted">
              <SpinnerIcon size={24} className="animate-spin text-primary" />
              <p className="text-sm">Memuat percakapan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-ink-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ChatCircleDotsIcon size={28} />
              </div>
              <p className="text-base font-semibold text-ink">Belum ada pesan</p>
              <p className="text-sm text-ink-muted max-w-sm">
                Mulai percakapan mengenai evaluasi dialog kinerja, SKP, atau masukan pengembangan di sini.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.isCurrentUser;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  {!isMe && (
                    <span className="mb-1 text-xs font-medium text-ink-muted px-1">
                      {msg.senderName} ({msg.senderRole === "atasan" ? "Atasan" : msg.senderRole === "pegawai" ? "Pegawai" : "Admin"})
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-xs break-words whitespace-pre-wrap ${
                      isMe
                        ? "bg-primary text-on-primary rounded-tr-xs"
                        : "bg-surface text-ink border border-outline rounded-tl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-1 text-[11px] text-ink-muted px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Footer */}
      <footer className="border-t border-outline bg-surface p-4">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p className="mb-2 text-xs text-rose-500 font-medium">{error}</p>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              disabled={isSending}
              className="flex-1 rounded-xl border border-outline bg-surface-sunken px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs transition-all hover:bg-primary-strong active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              title="Kirim Pesan"
              aria-label="Kirim Pesan"
            >
              {isSending ? (
                <SpinnerIcon size={18} className="animate-spin" />
              ) : (
                <PaperPlaneTiltIcon size={18} weight="fill" />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-ink-muted">
            Riwayat percakapan otomatis tersimpan ke database.
          </p>
        </div>
      </footer>
    </div>
  );
}