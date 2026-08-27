"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { publishDialogUpdate } from "@/lib/realtime/bus";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

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

    publishDialogUpdate(dialogId, { kind: "chat", byUserId: session.id });

    const recipientId =
      session.id === dialog.id_atasan ? dialog.id_pegawai : dialog.id_atasan;

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { nama_pegawai: true, email: true },
    });

    if (recipient) {
      const senderLabel =
        role === "atasan" ? "Atasan" : role === "pegawai" ? "Pegawai" : "Admin";

      createNotification({
        userId: recipientId,
        type: "chat_message",
        title: `Pesan baru dari ${created.sender.nama_pegawai}`,
        description: trimmed.length > 120 ? trimmed.slice(0, 120) + "..." : trimmed,
        link: `/chat/${dialogId}`,
      }).catch((e) => console.error("Gagal buat notifikasi chat:", e));

      if (recipient.email) {
        sendEmail({
          to: recipient.email,
          subject: `Pesan Baru dari ${created.sender.nama_pegawai} | Dialog Kinerja`,
          html: `
            <div style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
              <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

                <!-- Email Card -->
                <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <div style="background:#111827;padding:22px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <img
                            src="https://spipendidikan.kpk.go.id/dash/assets/spip/img/LOGO-KPK-putih.png"
                            alt="KPK"
                            width="72"
                            style="display:block;width:72px;height:auto;"
                          />
                        </td>

                        <td style="text-align:right;vertical-align:middle;">
                          <div style="color:#ffffff;font-size:14px;font-weight:bold;">
                            Dialog Kinerja
                          </div>
                          <div style="color:#9ca3af;font-size:11px;margin-top:4px;">
                            dialogkinerja.kpk.go.id
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Content -->
                  <div style="padding:32px 28px;">

                    <p style="margin:0 0 8px;color:#111827;font-size:16px;">
                      Halo <strong>${recipient.nama_pegawai}</strong>,
                    </p>

                    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
                      Anda menerima pesan baru pada percakapan Dialog Kinerja dari
                      <strong>${created.sender.nama_pegawai}</strong>
                      (${senderLabel}).
                    </p>

                    <!-- Message Box -->
                    <div style="
                      background:#f9fafb;
                      border:1px solid #e5e7eb;
                      border-radius:8px;
                      padding:18px;
                      margin-bottom:24px;
                    ">
                      <div style="
                        color:#6b7280;
                        font-size:11px;
                        font-weight:bold;
                        text-transform:uppercase;
                        letter-spacing:0.5px;
                        margin-bottom:8px;
                      ">
                        Pesan
                      </div>

                      <div style="
                        color:#1f2937;
                        font-size:14px;
                        line-height:1.7;
                        word-break:break-word;
                      ">
                        ${trimmed.length > 300
                          ? trimmed.slice(0, 300) + "..."
                          : trimmed}
                      </div>
                    </div>

                    <!-- CTA -->
                    <div style="text-align:center;margin:28px 0;">
                      <a
                        href="${process.env.NEXT_PUBLIC_APP_URL}/chat/${dialogId}"
                        style="
                          display:inline-block;
                          background:#111827;
                          color:#ffffff;
                          text-decoration:none;
                          font-size:13px;
                          font-weight:bold;
                          padding:12px 22px;
                          border-radius:7px;
                        "
                      >
                        Buka Percakapan
                      </a>
                    </div>

                    <p style="
                      margin:0;
                      color:#6b7280;
                      font-size:12px;
                      line-height:1.6;
                      text-align:center;
                    ">
                      Silakan masuk ke aplikasi Dialog Kinerja untuk melihat
                      percakapan lengkap dan memberikan tanggapan.
                    </p>

                  </div>

                  <!-- Footer -->
                  <div style="
                    background:#f9fafb;
                    border-top:1px solid #e5e7eb;
                    padding:18px 28px;
                    text-align:center;
                  ">
                    <p style="
                      margin:0 0 5px;
                      color:#6b7280;
                      font-size:11px;
                    ">
                      Dialog Kinerja
                    </p>

                    <p style="
                      margin:0;
                      color:#9ca3af;
                      font-size:10px;
                    ">
                      Email ini dikirim secara otomatis oleh sistem.
                      Mohon tidak membalas email ini. Aplikasi ini Masih pada proses pengembangan, jadi hiraukan pesan ini jika anda bukan pengguna aplikasi Dialog Kinerja.
                    </p>

                    <p style="
                      margin:8px 0 0;
                      color:#9ca3af;
                      font-size:10px;
                    ">
                      developer.dialogkinerja
                    </p>
                  </div>

                </div>

              </div>
            </div>
          `,
        }).catch((e) =>
          console.error("Gagal kirim email notifikasi chat:", e)
        );
      }
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
