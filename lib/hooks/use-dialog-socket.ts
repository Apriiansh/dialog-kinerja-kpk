"use client";

import { useEffect, useRef, useState } from "react";

export type LiveTransport = "connecting" | "live" | "polling";

interface UseDialogSocketOptions {
  dialogId: number;
  enabled?: boolean;
  pollIntervalMs?: number;
  onOpen?: () => void;
  onMessage: (updateKind: string | undefined) => void;
  onPoll: () => void;
}

export function useDialogSocket({
  dialogId,
  enabled = true,
  pollIntervalMs = 3_000,
  onOpen,
  onMessage,
  onPoll,
}: UseDialogSocketOptions): LiveTransport {
  const [transport, setTransport] = useState<LiveTransport>("connecting");

  const onMessageRef = useRef(onMessage);
  const onPollRef = useRef(onPoll);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onPollRef.current = onPoll;
    onOpenRef.current = onOpen;
  });

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let attempts = 0;
    let ws: WebSocket | null = null;
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
        ws = new WebSocket(
          `${protocol}//${window.location.host}/ws/dialog?id=${dialogId}`,
        );
      } catch {
        startPolling();
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        if (disposed) return;
        attempts = 0;
        setTransport("live");
        stopPolling();
        onOpenRef.current?.();
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const data = JSON.parse(String(event.data)) as {
            kind?: string;
            update?: { kind?: string };
          };
          if (data.kind !== "dialog_update") return;
          onMessageRef.current(data.update?.kind);
        } catch {
          // pesan tidak valid: abaikan
        }
      };

      ws.onclose = () => {
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
        ws?.readyState !== WebSocket.OPEN
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
      if (ws && ws.readyState <= WebSocket.OPEN) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, [dialogId, enabled, pollIntervalMs]);

  return enabled ? transport : "connecting";
}
