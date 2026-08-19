"use server";

import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";

const HARI_SEMBILAN = 5;
const MS_PER_HARI = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function checkUpcomingReviuReminders(): Promise<void> {
  const today = startOfDay(new Date());
  const plusFive = new Date(today.getTime() + HARI_SEMBILAN * MS_PER_HARI);

  const revius = await prisma.reviu.findMany({
    where: {
      status: "selesai",
      tanggal_next_reviu: { gte: today, lte: plusFive },
    },
    select: {
      id: true,
      tanggal_next_reviu: true,
      dialog: {
        select: {
          id: true,
          id_pegawai: true,
          id_atasan: true,
          periode_tahun: true,
        },
      },
    },
  });
  if (revius.length === 0) return;

  const links = revius.flatMap((r) => [
    `/pegawai/reviu/new?dialog=${r.dialog.id}&reviu=${r.id}`,
    `/atasan/reviu/${r.id}`,
  ]);

  const existing = await prisma.notification.findMany({
    where: { type: "reviu_reminder", link: { in: links } },
    select: { link: true },
  });
  const existingSet = new Set(existing.map((n) => n.link));

  const inputs = revius.flatMap((r) => {
    const pegawaiLink = `/pegawai/reviu/new?dialog=${r.dialog.id}&reviu=${r.id}`;
    const atasanLink = `/atasan/reviu/${r.id}`;
    const tanggal = r.tanggal_next_reviu
      ? r.tanggal_next_reviu.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
    const base = `Reviu dialog kinerja tahun ${r.dialog.periode_tahun} dijadwalkan pada ${tanggal}.`;
    const result: {
      userId: number;
      type: "reviu_reminder";
      title: string;
      description: string;
      link: string;
    }[] = [];
    if (!existingSet.has(pegawaiLink)) {
      result.push({
        userId: r.dialog.id_pegawai,
        type: "reviu_reminder",
        title: "Saatnya Reviu Dialog Kinerja",
        description: `${base} Segera buat reviu tindak lanjut.`,
        link: pegawaiLink,
      });
    }
    if (!existingSet.has(atasanLink)) {
      result.push({
        userId: r.dialog.id_atasan,
        type: "reviu_reminder",
        title: "Reviu Dialog Kinerja Mendekat",
        description: `${base} Menunggu reviu tindak lanjut dari pegawai.`,
        link: atasanLink,
      });
    }
    return result;
  });

  if (inputs.length > 0) {
    await createNotifications(inputs);
  }
}
