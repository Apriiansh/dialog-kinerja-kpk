import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { unsealData } from "iron-session";
import { prisma } from "@/lib/prisma";
import { subscribeDialog } from "@/lib/realtime/bus";

const WS_PATH = "/ws/dialog";
const COOKIE_NAME = "dialog_kinerja_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const HEARTBEAT_INTERVAL_MS = 30_000;
const MAX_PAYLOAD_BYTES = 16 * 1024;

interface SessionPayload {
  id?: number;
}

type LiveSocket = WebSocket & { isAlive?: boolean };

interface RoomEntry {
  ws: LiveSocket;
  userId: number;
}

const rooms = new Map<number, Set<RoomEntry>>();
const roomUnsubscribers = new Map<number, () => void>();

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(
      part.slice(idx + 1).trim(),
    );
  }
  return out;
}

function isSameOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin || !req.headers.host) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

async function authenticateUpgrade(
  req: IncomingMessage,
  dialogId: number,
): Promise<number | null> {
  if (!isSameOrigin(req)) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const cookieValue = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!cookieValue) return null;

  let session: SessionPayload;
  try {
    session = await unsealData<SessionPayload>(cookieValue, {
      password: secret,
      ttl: SESSION_TTL_SECONDS,
    });
  } catch {
    return null;
  }
  const userId = session.id;
  if (typeof userId !== "number") return null;

  const dialog = await prisma.dialogKinerja.findFirst({
    where: {
      id: dialogId,
      OR: [{ id_atasan: userId }, { id_pegawai: userId }],
    },
    select: { id: true },
  });
  if (!dialog) return null;

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_active: true },
  });
  if (!actor?.is_active) return null;

  return userId;
}

function ensureRoom(dialogId: number): Set<RoomEntry> {
  let room = rooms.get(dialogId);
  if (!room) {
    room = new Set();
    rooms.set(dialogId, room);
    const unsubscribe = subscribeDialog(dialogId, (event) => {
      const message = JSON.stringify({ kind: "dialog_update", update: event });
      for (const entry of room!) {
        if (entry.userId === event.byUserId) continue;
        if (entry.ws.readyState === WebSocket.OPEN) {
          entry.ws.send(message);
        }
      }
    });
    roomUnsubscribers.set(dialogId, unsubscribe);
  }
  return room;
}

function releaseRoomIfEmpty(dialogId: number): void {
  const room = rooms.get(dialogId);
  if (room && room.size === 0) {
    rooms.delete(dialogId);
    roomUnsubscribers.get(dialogId)?.();
    roomUnsubscribers.delete(dialogId);
  }
}

export interface WebSocketHubHandle {
  dispose: () => void;
}

export function setupWebSocketHub({
  server,
  getNextUpgradeHandler,
}: {
  server: HttpServer;
  getNextUpgradeHandler: () => (
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => void;
}): WebSocketHubHandle {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_PAYLOAD_BYTES,
  });

  server.on("upgrade", (req, socket, head) => {
    let pathname = "/";
    let rawId: string | null = null;
    try {
      const parsed = new URL(req.url ?? "/", "http://localhost");
      pathname = parsed.pathname;
      rawId = parsed.searchParams.get("id");
    } catch {
      getNextUpgradeHandler()(req, socket, head);
      return;
    }

    const dialogId = Number(rawId);
    if (pathname !== WS_PATH || !Number.isInteger(dialogId)) {
      try {
        getNextUpgradeHandler()(req, socket, head);
      } catch {
        if (!socket.destroyed) socket.destroy();
      }
      return;
    }

    void authenticateUpgrade(req, dialogId)
      .then((userId) => {
        if (userId === null || socket.destroyed) {
          if (!socket.destroyed) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
          }
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, dialogId, userId);
        });
      })
      .catch(() => {
        if (!socket.destroyed) {
          socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
          socket.destroy();
        }
      });
  });

  wss.on("connection", (rawSocket: WebSocket, dialogId: number, userId: number) => {
    const ws = rawSocket as LiveSocket;
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    const entry: RoomEntry = { ws, userId };
    const room = ensureRoom(dialogId);
    room.add(entry);

    ws.on("message", (raw) => {
      try {
        const payload = JSON.parse(String(raw)) as {
          type?: string;
          isTyping?: boolean;
          fieldId?: string;
          role?: string;
          name?: string;
        };
        if (payload.type === "typing") {
          const broadcastMsg = JSON.stringify({
            kind: "typing",
            byUserId: userId,
            isTyping: Boolean(payload.isTyping),
            fieldId: payload.fieldId,
            role: payload.role,
            name: payload.name,
          });
          for (const member of room) {
            if (member.userId === userId) continue;
            if (member.ws.readyState === WebSocket.OPEN) {
              member.ws.send(broadcastMsg);
            }
          }
        }
      } catch {
        // ignore invalid payload
      }
    });

    const removeFromRoom = () => {
      room.delete(entry);
      releaseRoomIfEmpty(dialogId);
    };
    ws.once("close", removeFromRoom);
    ws.once("error", removeFromRoom);
  });

  const heartbeat = setInterval(() => {
    for (const client of wss.clients) {
      const live = client as LiveSocket;
      if (live.isAlive === false) {
        live.terminate();
        continue;
      }
      live.isAlive = false;
      if (live.readyState === WebSocket.OPEN) {
        live.ping();
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  return {
    dispose: () => {
      clearInterval(heartbeat);
      for (const client of wss.clients) {
        client.terminate();
      }
      wss.close();
      rooms.clear();
      for (const unsubscribe of roomUnsubscribers.values()) {
        unsubscribe();
      }
      roomUnsubscribers.clear();
    },
  };
}
