import { prisma } from "@/lib/prisma";
import { formatPeriode } from "@/lib/constants/triwulan";
import {
  sendDialogReminderEmail,
  type DialogReminderKind,
} from "@/lib/dialog-email";
import type { StatusDialog } from "@/generated/prisma/enums";

export type DialogReminderJenis = "h_minus_1" | "h";

const REMINDER_JENIS_MAP: Record<DialogReminderJenis, DialogReminderKind> = {
  h_minus_1: "H_MINUS_1",
  h: "H",
};

const REMINDER_STATUSES: StatusDialog[] = [
  "menunggu_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
];

const WINDOW_PAD_DAYS = 3;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toJadwalJenis(
  jadwal: Date,
  today: Date,
  tomorrow: Date,
): DialogReminderJenis | null {
  if (sameDay(jadwal, tomorrow)) return "h_minus_1";
  if (sameDay(jadwal, today)) return "h";
  return null;
}

function formatTanggal(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Mengirim email pengingat ke pegawai dan atasan pada H-1 dan H (hari pelaksanaan dialog)
 * untuk dialog yang sudah disetujui atasan (status selain draft/selesai).
 * Dijalankan otomatis via server.ts dan aman dijalankan berulang (didedup oleh
 * tabel dialog_email_log).
 */
export async function runDialogReminderJob(): Promise<void> {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const minDate = addDays(today, -WINDOW_PAD_DAYS);
  const maxDate = addDays(tomorrow, WINDOW_PAD_DAYS);

  const dialogs = await prisma.dialogKinerja.findMany({
    where: {
      jadwal_dialog: { gte: minDate, lte: maxDate },
      status: { in: REMINDER_STATUSES },
    },
    select: {
      id: true,
      jadwal_dialog: true,
      periode_tahun: true,
      triwulan: true,
      atasan: { select: { nama_pegawai: true, email: true } },
      pegawai: { select: { nama_pegawai: true, email: true } },
      emailLogs: { select: { jenis: true } },
    },
  });

  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  for (const dialog of dialogs) {
    if (!dialog.jadwal_dialog) continue;

    const jenis = toJadwalJenis(dialog.jadwal_dialog, today, tomorrow);
    if (!jenis) continue;

    if (dialog.emailLogs.some((log) => log.jenis === jenis)) continue;

    const periode = formatPeriode(dialog.triwulan, dialog.periode_tahun);
    const jadwalLabel = formatTanggal(dialog.jadwal_dialog);
    const kind = REMINDER_JENIS_MAP[jenis];
    const linkAtasan = new URL(
      `/atasan/dialog/${dialog.id}`,
      baseUrl,
    ).toString();
    const linkPegawai = new URL(
      `/pegawai/dialog/${dialog.id}`,
      baseUrl,
    ).toString();

    const sendTasks: Promise<unknown>[] = [];
    if (dialog.atasan.email) {
      sendTasks.push(
        sendDialogReminderEmail({
          to: dialog.atasan.email,
          recipient: "ATASAN",
          recipientName: dialog.atasan.nama_pegawai,
          counterpartName: dialog.pegawai.nama_pegawai,
          periode,
          jadwalLabel,
          link: linkAtasan,
          kind,
        }),
      );
    }
    if (dialog.pegawai.email) {
      sendTasks.push(
        sendDialogReminderEmail({
          to: dialog.pegawai.email,
          recipient: "PEGAWAI",
          recipientName: dialog.pegawai.nama_pegawai,
          counterpartName: dialog.atasan.nama_pegawai,
          periode,
          jadwalLabel,
          link: linkPegawai,
          kind,
        }),
      );
    }
    if (sendTasks.length === 0) continue;

    const results = await Promise.allSettled(sendTasks);
    let failedCount = 0;
    for (const result of results) {
      if (result.status === "rejected") {
        failedCount += 1;
        console.error(
          `Gagal kirim email pengingat dialog #${dialog.id} (${jenis}):`,
          result.reason,
        );
      }
    }
    if (failedCount === sendTasks.length) continue;

    await prisma.dialogEmailLog.createMany({
      data: [{ id_dialog: dialog.id, jenis }],
      skipDuplicates: true,
    });
  }
}