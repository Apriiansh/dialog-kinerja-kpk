"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDialogLiveState,
  type DialogLiveState,
} from "@/lib/actions/dialog-live";
import { useDialogSocket, type LiveTransport, type SocketTypingEvent } from "./use-dialog-socket";

export type { LiveTransport };

interface UseDialogLiveOptions {
  dialogId: number;
  enabled?: boolean;
  pollIntervalMs?: number;
  onState: (state: DialogLiveState) => void;
  onTyping?: (event: SocketTypingEvent) => void;
}

export function useDialogLive({
  dialogId,
  enabled = true,
  pollIntervalMs = 3_000,
  onState,
  onTyping,
}: UseDialogLiveOptions): {
  transport: LiveTransport;
  partnerTyping: SocketTypingEvent | null;
  lockedFields: Record<string, SocketTypingEvent>;
  isFieldLocked: (fieldId: string) => boolean;
  getFieldLockerRole: (fieldId: string) => string | null;
  sendTyping: (
    isTyping: boolean,
    fieldId?: string,
    meta?: { role?: string; name?: string },
  ) => void;
  refetch: () => void;
} {
  const router = useRouter();

  const [partnerTyping, setPartnerTyping] = useState<SocketTypingEvent | null>(null);
  const [lockedFields, setLockedFields] = useState<Record<string, SocketTypingEvent>>({});
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const onStateRef = useRef(onState);
  const onTypingRef = useRef(onTyping);
  useEffect(() => {
    onStateRef.current = onState;
    onTypingRef.current = onTyping;
  }, [onState, onTyping]);

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

  const handleTypingEvent = useCallback(
    (event: SocketTypingEvent) => {
      const fieldId = event.fieldId;
      if (fieldId) {
        if (fieldTimersRef.current[fieldId]) {
          clearTimeout(fieldTimersRef.current[fieldId]);
          delete fieldTimersRef.current[fieldId];
        }
        if (event.isTyping) {
          setLockedFields((prev) => ({ ...prev, [fieldId]: event }));
          fieldTimersRef.current[fieldId] = setTimeout(() => {
            setLockedFields((prev) => {
              const next = { ...prev };
              delete next[fieldId];
              return next;
            });
            delete fieldTimersRef.current[fieldId];
          }, 2_200);
        } else {
          setLockedFields((prev) => {
            const next = { ...prev };
            delete next[fieldId];
            return next;
          });
        }
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (event.isTyping) {
        setPartnerTyping(event);
        typingTimerRef.current = setTimeout(() => {
          setPartnerTyping(null);
        }, 2_200);
      } else {
        setPartnerTyping(null);
      }
      onTypingRef.current?.(event);
    },
    [],
  );

  useEffect(
    () => () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      for (const timer of Object.values(fieldTimersRef.current)) {
        clearTimeout(timer);
      }
      fieldTimersRef.current = {};
    },
    [],
  );

  const isFieldLocked = useCallback(
    (fieldId: string) => {
      return Boolean(lockedFields[fieldId]?.isTyping);
    },
    [lockedFields],
  );

  const getFieldLockerRole = useCallback(
    (fieldId: string) => {
      const locker = lockedFields[fieldId];
      if (!locker?.isTyping) return null;
      if (locker.role === "pegawai") return "Pegawai";
      if (locker.role === "atasan") return "Atasan";
      return "Rekan";
    },
    [lockedFields],
  );

  const { transport, send } = useDialogSocket({
    dialogId,
    enabled,
    pollIntervalMs,
    onOpen: fetchSnapshot,
    onMessage: handleSocketMessage,
    onTyping: handleTypingEvent,
    onPoll: fetchSnapshot,
  });

  const sendTyping = useCallback(
    (
      isTyping: boolean,
      fieldId?: string,
      meta?: { role?: string; name?: string },
    ) => {
      send({
        type: "typing",
        isTyping,
        fieldId,
        role: meta?.role,
        name: meta?.name,
      });
    },
    [send],
  );

  return {
    transport,
    partnerTyping,
    lockedFields,
    isFieldLocked,
    getFieldLockerRole,
    sendTyping,
    refetch: fetchSnapshot,
  };
}

export function formatClock(date = new Date()): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

