import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer | null = null;

export function getWss(): WebSocketServer | null {
  return wss;
}

export function initializeWebSocketServer(httpServer: any) {
  "use server";
  wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (
    request: import("http").IncomingMessage,
    socket: any,
    head: any,
  ) => {
    wss!.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      wss!.emit("connection", ws, request);
    });
  });
}

export type ChatMessage = {
  id: string;
  dialogId: number;
  userId: number;
  role: "atasan" | "pegawai";
  content: string;
  createdAt: string;
};

type ChatConnection = {
  dialogId: number;
  role: "atasan" | "pegawai";
  ws: WebSocket;
};

const connections = new Map<number, ChatConnection[]>();

export function broadcastToDialog(
  dialogId: number,
  message: ChatMessage,
  excludeRole: "atasan" | "pegawai" | null = null,
) {
  const dialogConnections = connections.get(dialogId) || [];
  for (const conn of dialogConnections) {
    if (excludeRole && conn.role === excludeRole) continue;
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(message));
    }
  }
}

export function broadcastToDialogAll(dialogId: number, message: ChatMessage) {
  const dialogConnections = connections.get(dialogId) || [];
  for (const conn of dialogConnections) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(message));
    }
  }
}

export function removeConnection(dialogId: number, role: "atasan" | "pegawai") {
  const dialogConnections = connections.get(dialogId) || [];
  connections.set(
    dialogId,
    dialogConnections.filter((conn) => conn.role !== role),
  );
}

export function addConnection(dialogId: number, role: "atasan" | "pegawai", ws: WebSocket) {
  if (!connections.has(dialogId)) {
    connections.set(dialogId, []);
  }
  connections.get(dialogId)!.push({ dialogId, role, ws });
}