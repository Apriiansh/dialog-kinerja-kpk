import { EventEmitter } from "node:events";

export type DialogUpdateKind = "aspek_pegawai" | "aspek_atasan" | "status";

export interface DialogUpdateEvent {
  kind: DialogUpdateKind;
  byUserId: number;
}

type BusGlobal = typeof globalThis & {
  __dialogRealtimeBus?: EventEmitter;
};

function getBus(): EventEmitter {
  const globalForBus = globalThis as BusGlobal;
  if (!globalForBus.__dialogRealtimeBus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(0);
    globalForBus.__dialogRealtimeBus = bus;
  }
  return globalForBus.__dialogRealtimeBus;
}

export function publishDialogUpdate(
  dialogId: number,
  event: DialogUpdateEvent,
): void {
  getBus().emit(`dialog:${dialogId}`, event);
}

export function subscribeDialog(
  dialogId: number,
  listener: (event: DialogUpdateEvent) => void,
): () => void {
  const channel = `dialog:${dialogId}`;
  const bus = getBus();
  bus.on(channel, listener);
  return () => {
    bus.off(channel, listener);
  };
}
