"use server";

import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

const HARI_DEADLINE = 30;
const MS_PER_HARI = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function checkUpcomingReviuReminders(): Promise<void> {
  const today = startOfDay(new Date());
  const maxDate = new Date(today.getTime() + HARI_DEADLINE * MS_PER_HARI);

  const revius = await prisma.reviu.findMany({
    where: {
      status: "selesai",
      dialog: {
        dialog_lanjutan: { none: {} },
      },
      tanggal_next_evaluasi: { gte: today, lte: maxDate },
    },
    select: {
      id: true,
      tanggal_next_evaluasi: true,
      dialog: {
        select: {
          id: true,
          id_pegawai: true,
          id_atasan: true,
          periode_tahun: true,
          triwulan: true,
        },
      },
    },
  });
  if (revius.length === 0) return;

  const links = revius.flatMap((r) => [
    `/pegawai/dialog?reviu=${r.id}`,
    `/atasan/dialog?reviu=${r.id}`,
  ]);

  const existing = await prisma.notification.findMany({
    where: { type: "evaluasi_reminder", link: { in: links } },
    select: { link: true },
  });
  const existingSet = new Set(existing.map((n) => n.link));

  const inputs = revius.flatMap((r) => {
    const pegawaiLink = `/pegawai/dialog?reviu=${r.id}`;
    const atasanLink = `/atasan/dialog?reviu=${r.id}`;
    const tanggal = r.tanggal_next_evaluasi
      ? r.tanggal_next_evaluasi.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    const base = `Evaluasi dialog kinerja tahun ${r.dialog.periode_tahun} (${r.dialog.triwulan}) dijadwalkan pada ${tanggal}.`;
    const result: {
      userId: number;
      type: "evaluasi_reminder";
      title: string;
      description: string;
      link: string;
    }[] = [];
    if (!existingSet.has(pegawaiLink)) {
      result.push({
        userId: r.dialog.id_pegawai,
        type: "evaluasi_reminder",
        title: "Waktunya Evaluasi Dialog Kinerja",
        description: `${base} Cek apakah atasan sudah membuat dialog kinerja lanjutan.`,
        link: pegawaiLink,
      });
    }
    if (!existingSet.has(atasanLink)) {
      result.push({
        userId: r.dialog.id_atasan,
        type: "evaluasi_reminder",
        title: "Jadwal Evaluasi Dialog Kinerja Mendekat",
        description: `${base} Segera buat dialog kinerja lanjutan untuk pegawai.`,
        link: atasanLink,
      });
    }
    return result;
  });

  if (inputs.length > 0) {
    await createNotifications(inputs);
  }
}

