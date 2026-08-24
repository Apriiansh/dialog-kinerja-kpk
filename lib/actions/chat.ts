"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export interface ChatMessageItem {
  id: number;
  dialogId: number;
  senderId: number;
  senderName: string;
  senderRole: "atasan" | "pegawai" | "admin";
  isCurrentUser: boolean;
  content: string;
  createdAt: string;
}

export interface ChatDialogInfo {
  id: number;
  periodeTahun: number;
  atasan: { id: number; nama: string; jabatan?: string | null };
  pegawai: { id: number; nama: string; jabatan?: string | null };
}

export async function getChatMessages(
  dialogId: number,
  afterId?: number,
): Promise<{
  success: boolean;
  messages?: ChatMessageItem[];
  dialogInfo?: ChatDialogInfo;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const dialog = await prisma.dialogKinerja.findUnique({
      where: { id: dialogId },
      include: {
        atasan: {
          select: { id: true, nama_pegawai: true, nama_jabatan: true },
        },
        pegawai: {
          select: { id: true, nama_pegawai: true, nama_jabatan: true },
        },
      },
    });

    if (!dialog) {
      return { success: false, error: "Dialog tidak ditemukan" };
    }

    const isAuthorized =
      session.role === "ADMIN" ||
      dialog.id_atasan === session.id ||
      dialog.id_pegawai === session.id;

    if (!isAuthorized) {
      return { success: false, error: "Akses ditolak" };
    }

    const whereClause: { id_dialog: number; id?: { gt: number } } = {
      id_dialog: dialogId,
    };
    if (afterId && afterId > 0) {
      whereClause.id = { gt: afterId };
    }

    const rawMessages = await prisma.dialogChatMessage.findMany({
      where: whereClause,
      orderBy: { created_at: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            nama_pegawai: true,
            nama_jabatan: true,
          },
        },
      },
    });

    const messages: ChatMessageItem[] = rawMessages.map((msg) => {
      let role: "atasan" | "pegawai" | "admin" = "pegawai";
      if (msg.id_sender === dialog.id_atasan) {
        role = "atasan";
      } else if (msg.id_sender === dialog.id_pegawai) {
        role = "pegawai";
      } else {
        role = "admin";
      }

      return {
        id: msg.id,
        dialogId: msg.id_dialog,
        senderId: msg.id_sender,
        senderName: msg.sender.nama_pegawai,
        senderRole: role,
        isCurrentUser: msg.id_sender === session.id,
        content: msg.message,
        createdAt: msg.created_at.toISOString(),
      };
    });

    return {
      success: true,
      messages,
      dialogInfo: {
        id: dialog.id,
        periodeTahun: dialog.periode_tahun,
        atasan: {
          id: dialog.atasan.id,
          nama: dialog.atasan.nama_pegawai,
          jabatan: dialog.atasan.nama_jabatan,
        },
        pegawai: {
          id: dialog.pegawai.id,
          nama: dialog.pegawai.nama_pegawai,
          jabatan: dialog.pegawai.nama_jabatan,
        },
      },
    };
  } catch (error) {
    console.error("Error getChatMessages:", error);
    return { success: false, error: "Gagal mengambil pesan chat" };
  }
}

export async function sendChatMessage(
  dialogId: number,
  content: string,
): Promise<{
  success: boolean;
  message?: ChatMessageItem;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return { success: false, error: "Pesan tidak boleh kosong" };
    }

    const dialog = await prisma.dialogKinerja.findUnique({
      where: { id: dialogId },
      select: {
        id: true,
        id_atasan: true,
        id_pegawai: true,
      },
    });

    if (!dialog) {
      return { success: false, error: "Dialog tidak ditemukan" };
    }

    const isAuthorized =
      session.role === "ADMIN" ||
      dialog.id_atasan === session.id ||
      dialog.id_pegawai === session.id;

    if (!isAuthorized) {
      return { success: false, error: "Akses ditolak" };
    }

    const created = await prisma.dialogChatMessage.create({
      data: {
        id_dialog: dialogId,
        id_sender: session.id,
        message: trimmed,
      },
      include: {
        sender: {
          select: {
            id: true,
            nama_pegawai: true,
            nama_jabatan: true,
          },
        },
      },
    });

    let role: "atasan" | "pegawai" | "admin" = "pegawai";
    if (created.id_sender === dialog.id_atasan) {
      role = "atasan";
    } else if (created.id_sender === dialog.id_pegawai) {
      role = "pegawai";
    } else {
      role = "admin";
    }

    return {
      success: true,
      message: {
        id: created.id,
        dialogId: created.id_dialog,
        senderId: created.id_sender,
        senderName: created.sender.nama_pegawai,
        senderRole: role,
        isCurrentUser: true,
        content: created.message,
        createdAt: created.created_at.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error sendChatMessage:", error);
    return { success: false, error: "Gagal mengirim pesan" };
  }
}
