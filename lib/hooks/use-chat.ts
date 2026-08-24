"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getChatMessages,
  sendChatMessage,
  type ChatMessageItem,
  type ChatDialogInfo,
} from "@/lib/actions/chat";
import { useDialogSocket } from "./use-dialog-socket";

export type { ChatMessageItem, ChatDialogInfo };

interface UseChatOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
}

export function useChat(dialogId: number, options: UseChatOptions = {}) {
  const { enabled = true, pollIntervalMs = 3500 } = options;

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [dialogInfo, setDialogInfo] = useState<ChatDialogInfo | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const latestMessageIdRef = useRef<number>(0);
  const fetchMessagesRef = useRef<(isInitial?: boolean) => Promise<void>>(
    async () => {},
  );
  // Update latest ID ref whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const realMessages = messages.filter((m) => m.id > 0);
      if (realMessages.length > 0) {
        latestMessageIdRef.current = Math.max(
          ...realMessages.map((m) => m.id),
        );
      }
    }
  }, [messages]);

  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (!dialogId) return;

      try {
        // For incremental polling, only fetch messages after latest ID
        const afterId = isInitial ? undefined : latestMessageIdRef.current;
        const res = await getChatMessages(dialogId, afterId);

        if (!isMountedRef.current) return;

        if (res.success && res.messages) {
          if (isInitial) {
            setMessages(res.messages);
            if (res.dialogInfo) {
              setDialogInfo(res.dialogInfo);
            }
          } else if (res.messages.length > 0) {
            // Append new incremental messages only
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newUnique = res.messages!.filter(
                (m) => !existingIds.has(m.id),
              );
              if (newUnique.length === 0) return prev;
              return [...prev, ...newUnique];
            });
          }

          setError(null);
        } else {
          setError(res.error || "Gagal memuat pesan");
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Gagal mengambil pesan chat:", err);
      } finally {
        if (isMountedRef.current && isInitial) {
          setIsLoading(false);
        }
      }
    },
    [dialogId],
  );

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);
  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    fetchMessages(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMessages]);

  // Realtime via shared WebSocket; polling hanya fallback saat koneksi putus.
  const transport = useDialogSocket({
    dialogId,
    enabled,
    pollIntervalMs,
    onOpen: () => void fetchMessagesRef.current(false),
    onMessage: () => void fetchMessagesRef.current(false),
    onPoll: () => void fetchMessagesRef.current(false),
  });
  const isConnected = transport === "live";

  const sendMessage = async (customContent?: string) => {
    const textToSend = (customContent !== undefined ? customContent : input).trim();
    if (!textToSend || !dialogId || isSending) return false;

    setIsSending(true);
    setInput("");

    // Optimistic temporary message for zero-latency UI feedback
    const tempId = -Date.now();
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      dialogId,
      senderId: 0,
      senderName: "Saya",
      senderRole: "pegawai",
      isCurrentUser: true,
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await sendChatMessage(dialogId, textToSend);
      if (!isMountedRef.current) return true;

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? res.message! : msg)),
        );
        latestMessageIdRef.current = Math.max(
          latestMessageIdRef.current,
          res.message.id,
        );
        setError(null);
        return true;
      } else {
        // Rollback optimistic message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setInput(textToSend);
        setError(res.error || "Gagal mengirim pesan");
        return false;
      }
    } catch (err) {
      if (!isMountedRef.current) return false;
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setInput(textToSend);
      console.error("Gagal mengirim pesan:", err);
      setError("Terjadi kesalahan saat mengirim pesan");
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSending(false);
      }
    }
  };

  return {
    messages,
    dialogInfo,
    input,
    setInput,
    isLoading,
    isSending,
    isConnected,
    error,
    sendMessage,
    refresh: () => fetchMessages(false),
  };
}
