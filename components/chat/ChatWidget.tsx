"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChatCircleDotsIcon,
  MinusIcon,
  XIcon,
  CaretUpIcon,
  PaperPlaneTiltIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useChat } from "@/lib/hooks/use-chat";

interface ChatWidgetProps {
  dialogId: number;
  userRole: "atasan" | "pegawai" | "admin";
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  partnerName?: string;
  partnerRoleLabel?: string;
}

export function ChatWidget({
  dialogId,
  userRole,
  open,
  onOpenChange,
  partnerName,
  partnerRoleLabel,
}: ChatWidgetProps) {
  const isOpen = open;
  const setOpen = (next: boolean) => onOpenChange?.(next);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  } = useChat(dialogId, { enabled: isOpen });

  // Auto scroll to bottom when new messages arrive or when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when expanded
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

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

  const displayName =
    partnerName ||
    (userRole === "atasan"
      ? dialogInfo?.pegawai.nama
      : dialogInfo?.atasan.nama) ||
    "Rekan Dialog";

  const displayRoleLabel =
    partnerRoleLabel ||
    (userRole === "atasan" ? "Pegawai" : "Atasan Langsung");

  // Format message time
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

  // If closed completely, show floating launcher button
  if (!isOpen) {
    return (
      <aside aria-label="Ruang Percakapan Kinerja">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-xl ring-4 ring-primary/20 transition-all duration-200 hover:scale-105 hover:bg-primary-strong active:scale-95"
          title="Buka Chat Dialog Kinerja"
        >
          <div className="relative flex items-center justify-center">
            <ChatCircleDotsIcon size={22} weight="fill" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="hidden sm:inline">Chat Dialog</span>
        </button>
      </aside>
    );
  }

  // If minimized, show compact floating bar at bottom right
  if (isMinimized) {
    return (
      <aside aria-label="Ruang Percakapan Kinerja">
        <div
          role="region"
          aria-label="Panel Chat Kinerja Diminimalkan"
          tabIndex={0}
          onClick={() => setIsMinimized(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsMinimized(false);
            }
          }}
          className="fixed bottom-6 right-6 z-50 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-outline bg-surface px-4 py-3 shadow-2xl transition-all duration-200 hover:border-primary/50 hover:shadow-primary/10 sm:w-80"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ChatCircleDotsIcon size={18} weight="fill" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">
                Chat Dialog #{dialogId}
              </p>
              <p className="truncate text-[11px] text-ink-muted">
                {displayName} ({displayRoleLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              title="Buka / Maksimalkan"
              aria-label="Maksimalkan Chat"
            >
              <CaretUpIcon size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
              title="Tutup"
              aria-label="Tutup Chat"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Expanded popup floating window
  return (
    <aside aria-label="Ruang Percakapan Kinerja">
      <div
        role="region"
        aria-label="Panel Chat Kinerja"
        className="fixed bottom-5 right-5 z-50 flex h-130 max-h-[85vh] w-[92vw] max-w-100 flex-col overflow-hidden rounded-2xl border border-outline bg-surface shadow-2xl ring-1 ring-black/5 dark:ring-white/10 sm:w-100"
      >
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline bg-surface-sunken/60 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary font-semibold shadow-xs">
              {displayName.charAt(0).toUpperCase()}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
                title={isConnected ? "Terhubung" : "Menghubungkan..."}
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-ink">
                Chat Dialog #{dialogId}
              </h3>
              <p className="truncate text-xs text-ink-muted">
                {displayName} ·{" "}
                <span className="font-medium text-primary">
                  {displayRoleLabel}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              title="Kecilkan (Minimize)"
              aria-label="Kecilkan Chat"
            >
              <MinusIcon size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              title="Tutup Chat"
              aria-label="Tutup Chat"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Daftar Pesan Chat"
          className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-surface/50"
        >
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
              <SpinnerIcon size={24} className="animate-spin text-primary" />
              <p className="text-xs">Memuat riwayat chat...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center p-6 text-ink-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ChatCircleDotsIcon size={28} />
              </div>
              <p className="text-sm font-semibold text-ink">
                Belum ada pesan
              </p>
              <p className="text-xs text-ink-muted max-w-60">
                Gunakan ruang chat ini untuk berdiskusi mengenai target, SKP, atau masukan kinerja secara langsung.
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
                    <span className="mb-1 text-[11px] font-medium text-ink-muted px-1">
                      {msg.senderName} ({msg.senderRole === "atasan" ? "Atasan" : msg.senderRole === "pegawai" ? "Pegawai" : "Admin"})
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm shadow-xs wrap-break-word whitespace-pre-wrap ${
                      isMe
                        ? "bg-primary text-on-primary rounded-tr-xs"
                        : "bg-surface-sunken dark:bg-surface-elevated text-ink border border-outline/60 rounded-tl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="mt-1 text-[10px] text-ink-muted px-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <footer className="border-t border-outline bg-surface p-3">
          {error && (
            <p className="mb-2 text-xs text-rose-500 font-medium px-1">
              {error}
            </p>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              disabled={isSending}
              className="flex-1 rounded-xl border border-outline bg-surface-sunken px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-xs transition-all hover:bg-primary-strong active:scale-95 disabled:pointer-events-none disabled:opacity-40"
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
          <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-ink-muted">
            <span>Tekan Enter untuk kirim</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Riwayat tersimpan
            </span>
          </div>
        </footer>
      </div>
    </aside>
  );
}
