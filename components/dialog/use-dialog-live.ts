"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getDialogLiveState,
  type DialogLiveState,
} from "@/lib/actions/dialog-live";

export type LiveTransport = "connecting" | "live" | "polling";

interface UseDialogLiveOptions {
  dialogId: number;
  enabled?: boolean;
  pollIntervalMs?: number;
  onState: (state: DialogLiveState) => void;
}

export function useDialogLive({
  dialogId,
  enabled = true,
  pollIntervalMs = 3_000,
  onState,
}: UseDialogLiveOptions): { transport: LiveTransport } {
  const router = useRouter();
  const [transport, setTransport] = useState<LiveTransport>("connecting");

  const onStateRef = useRef(onState);
  useEffect(() => {
    onStateRef.current = onState;
  }, [onState]);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let attempts = 0;
    let inFlight = false;
    let lastJson = "";
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let refetchTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchSnapshot = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const state = await getDialogLiveState(dialogId);
        if (disposed || !state) return;
        const json = JSON.stringify(state);
        if (json !== lastJson) {
          lastJson = json;
          onStateRef.current(state);
        }
      } catch {
        // diam: sesi mungkin berakhir atau jaringan putus
      } finally {
        inFlight = false;
      }
    };

    const scheduleRefetch = () => {
      if (refetchTimer) clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => void fetchSnapshot(), 300);
    };

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
        if (document.visibilityState === "visible") void fetchSnapshot();
        pollTimer = setTimeout(tick, pollIntervalMs);
      };
      pollTimer = setTimeout(tick, pollIntervalMs);
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
        void fetchSnapshot();
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const data = JSON.parse(String(event.data)) as {
            kind?: string;
            update?: { kind?: string };
          };
          if (data.kind !== "dialog_update") return;
          if (data.update?.kind === "status") {
            router.refresh();
          }
          scheduleRefetch();
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

    const scheduleReconnect = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const delay =
        Math.min(30_000, 1_000 * 2 ** Math.min(attempts, 5)) +
        Math.random() * 500;
      reconnectTimer = setTimeout(connectWs, delay);
    };

    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        ws?.readyState !== WebSocket.OPEN
      ) {
        void fetchSnapshot();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    void fetchSnapshot();
    connectWs();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearTimeout(pollTimer);
      if (refetchTimer) clearTimeout(refetchTimer);
      if (ws && ws.readyState <= WebSocket.OPEN) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, [dialogId, enabled, pollIntervalMs, router]);

  return { transport: enabled ? transport : "connecting" };
}

export function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
