"use client";

import { useEffect, useRef, useState } from "react";

export type LiveTransport = "connecting" | "live" | "polling";

export interface SocketTypingEvent {
  isTyping: boolean;
  fieldId?: string;
  role?: string;
  name?: string;
}

interface UseDialogSocketOptions {
  dialogId: number;
  enabled?: boolean;
  pollIntervalMs?: number;
  onOpen?: () => void;
  onMessage: (updateKind: string | undefined) => void;
  onTyping?: (event: SocketTypingEvent) => void;
  onPoll: () => void;
}

export function useDialogSocket({
  dialogId,
  enabled = true,
  pollIntervalMs = 3_000,
  onOpen,
  onMessage,
  onTyping,
  onPoll,
}: UseDialogSocketOptions): {
  transport: LiveTransport;
  send: (data: unknown) => boolean;
} {
  const [transport, setTransport] = useState<LiveTransport>("connecting");

  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onPollRef = useRef(onPoll);
  const onOpenRef = useRef(onOpen);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onTypingRef.current = onTyping;
    onPollRef.current = onPoll;
    onOpenRef.current = onOpen;
  });

  const send = (data: unknown): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let attempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const stopPolling = () => {
      if (pollTimer !== null) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const startPolling = () => {
      if (pollTimer !== null) return;
      setTransport("polling");
      const tick = () => {
        if (document.visibilityState === "visible") {
          onPollRef.current();
        }
        pollTimer = setTimeout(tick, pollIntervalMs);
      };
      pollTimer = setTimeout(tick, pollIntervalMs);
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const delay =
        Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5)) +
        Math.random() * 500;
      reconnectTimer = setTimeout(connectWs, delay);
    };

    const connectWs = () => {
      if (disposed) return;
      const protocol =
        window.location.protocol === "https:" ? "wss:" : "ws:";
      try {
        const socket = new WebSocket(
          `${protocol}//${window.location.host}/ws/dialog?id=${dialogId}`,
        );
        wsRef.current = socket;
      } catch {
        startPolling();
        scheduleReconnect();
        return;
      }

      const socket = wsRef.current;
      if (!socket) return;

      socket.onopen = () => {
        if (disposed) return;
        attempts = 0;
        setTransport("live");
        stopPolling();
        onOpenRef.current?.();
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        try {
          const data = JSON.parse(String(event.data)) as {
            kind?: string;
            update?: { kind?: string };
            isTyping?: boolean;
            fieldId?: string;
            role?: string;
            name?: string;
          };
          if (data.kind === "dialog_update") {
            onMessageRef.current(data.update?.kind);
          } else if (data.kind === "typing") {
            onTypingRef.current?.({
              isTyping: Boolean(data.isTyping),
              fieldId: data.fieldId,
              role: data.role,
              name: data.name,
            });
          }
        } catch {
          // pesan tidak valid: abaikan
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        setTransport("connecting");
        attempts += 1;
        if (attempts >= 3) startPolling();
        scheduleReconnect();
      };
    };

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        onPollRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    onPollRef.current();
    connectWs();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearTimeout(pollTimer);
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [dialogId, enabled, pollIntervalMs]);

  return { transport: enabled ? transport : "connecting", send };
}
