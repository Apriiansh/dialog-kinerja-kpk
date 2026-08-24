"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import {
  getDialogLiveState,
  type DialogLiveState,
} from "@/lib/actions/dialog-live";
import { useDialogSocket, type LiveTransport } from "./use-dialog-socket";

export type { LiveTransport };

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

  const onStateRef = useRef(onState);
  useEffect(() => {
    onStateRef.current = onState;
  }, [onState]);

  const inFlightRef = useRef(false);
  const lastJsonRef = useRef("");
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const state = await getDialogLiveState(dialogId);
      if (!state) return;
      const json = JSON.stringify(state);
      if (json !== lastJsonRef.current) {
        lastJsonRef.current = json;
        onStateRef.current(state);
      }
    } catch {
      // diam: sesi mungkin berakhir atau jaringan putus
    } finally {
      inFlightRef.current = false;
    }
  }, [dialogId]);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => void fetchSnapshot(), 300);
  }, [fetchSnapshot]);

  const handleSocketMessage = useCallback(
    (updateKind: string | undefined) => {
      if (updateKind === "status") {
        router.refresh();
      }
      scheduleRefetch();
    },
    [router, scheduleRefetch],
  );

  useEffect(
    () => () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    },
    [],
  );

  const transport = useDialogSocket({
    dialogId,
    enabled,
    pollIntervalMs,
    onOpen: fetchSnapshot,
    onMessage: handleSocketMessage,
    onPoll: fetchSnapshot,
  });

  return { transport };
}

export function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
