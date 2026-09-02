import { prisma } from "@/lib/prisma";
import type { Role, SessionData } from "@/lib/auth/session";
import { formatPeriode } from "@/lib/constants/triwulan";

export function chatDialogPath(role: Role, dialogId: string): string {
  switch (role) {
    case "ADMIN":
      return `/admin/monitoring/dialog/${dialogId}`;
    case "ATASAN":
      return `/atasan/dialog/${dialogId}`;
    case "PEGAWAI":
      return `/pegawai/dialog/${dialogId}`;
  }
}

export type ChatHistoryItem = {
  dialogId: string;
  status: string;
  dialogPath: string;
  partnerNama: string;
  periode: string;
  lastMessage: string;
  lastMessageByMe: boolean;
  lastMessageAt: string;
  messageCount: number;
};

export async function getChatHistory(
  session: SessionData,
): Promise<ChatHistoryItem[]> {
  const dialogs = await prisma.dialogKinerja.findMany({
    where: {
      ...(session.role === "ADMIN"
        ? {}
        : {
            OR: [{ id_atasan: session.id }, { id_pegawai: session.id }],
          }),
      messages: { some: {} },
    },
    select: {
      id: true,
      status: true,
      periode_tahun: true,
      triwulan: true,
      id_atasan: true,
      id_pegawai: true,
      atasan: { select: { nama_pegawai: true } },
      pegawai: { select: { nama_pegawai: true } },
      messages: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          message: true,
          created_at: true,
          id_sender: true,
        },
      },
      _count: { select: { messages: true } },
    },
  });

  const items = dialogs.map((dialog) => {
    const last = dialog.messages[0];
    const isMe =
      dialog.id_atasan === session.id || dialog.id_pegawai === session.id;

    return {
      dialogId: dialog.id,
      status: dialog.status,
      dialogPath: chatDialogPath(session.role, dialog.id),
      periode: formatPeriode(dialog.triwulan, dialog.periode_tahun),
      partnerNama: isMe
        ? dialog.id_atasan === session.id
          ? dialog.pegawai.nama_pegawai
          : dialog.atasan.nama_pegawai
        : `${dialog.pegawai.nama_pegawai} & ${dialog.atasan.nama_pegawai}`,
      lastMessage:
        last?.message.slice(0, 120) ?? "Tidak ada pesan",
      lastMessageByMe: last ? last.id_sender === session.id : false,
      lastMessageAt: last ? last.created_at.toISOString() : "",
      messageCount: dialog._count.messages,
    };
  });

  return items.sort((a, b) => (b.lastMessageAt < a.lastMessageAt ? -1 : 1));
}
