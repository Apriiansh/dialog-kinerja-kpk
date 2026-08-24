"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import { flashRedirect } from "@/lib/utils/flash";
import { createNotification } from "@/lib/notifications";
import type { JenisAspek, Triwulan } from "@/generated/prisma/enums";
import { getTriwulanFromDate } from "@/lib/constants/triwulan";

export interface DialogLanjutanState {
  error?: string;
}

const VALID_JENIS: JenisAspek[] = [
  "SKP",
  "GAP_ASESMEN",
  "PERILAKU",
  "KARIR_PENDEK",
  "KARIR_MENENGAH",
];

export async function createDialogLanjutan(
  reviuId: number,
  customPeriode?: { periode_tahun: number; triwulan: Triwulan },
): Promise<DialogLanjutanState> {
  const session = await requireRole("PEGAWAI", "ATASAN", "ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const reviu = await prisma.reviu.findFirst({
    where: {
      id: reviuId,
      status: "selesai",
      dialog: {
        status: "selesai",
        OR: [{ id_pegawai: session.id }, { id_atasan: session.id }],
      },
    },
    include: {
      dialog: {
        include: {
          aspek: {
            include: {
              item: {
                select: {
                  id: true,
                  dialog_evaluasi: true,
                  kompetensi_dikembangkan: true,
                  id_metode_pengembangan: true,
                  metode_pengembangan_lainnya: true,
                  waktu_pelaksanaan: true,
                  is_tercapai: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan atau belum selesai." };
  }

  const parent = reviu.dialog;
  const isPegawai = session.role === "PEGAWAI";
  const hasLanjutan = await prisma.dialogKinerja.count({
    where: { id_dialog_induk: parent.id },
  });
  if (hasLanjutan > 0) {
    return { error: "Dialog lanjutan untuk reviu ini sudah dibuat." };
  }

  const now = new Date();
  const tahunBerjalan = customPeriode?.periode_tahun ?? now.getFullYear();
  const triwulan = customPeriode?.triwulan ?? getTriwulanFromDate(now);

  let newDialog: number;
  try {
    newDialog = await prisma.$transaction(async (tx) => {
      const created = await tx.dialogKinerja.create({
        data: {
          id_atasan: parent.id_atasan,
          id_pegawai: parent.id_pegawai,
          periode_tahun: tahunBerjalan,
          triwulan,
          id_dialog_induk: parent.id,
          status: "draft_atasan",
          aspek: {
            create: VALID_JENIS.map((jenis_aspek) => {
              const parentAspek = parent.aspek.find(
                (a) => a.jenis_aspek === jenis_aspek,
              );
              const belumTercapai = (parentAspek?.item ?? []).filter(
                (item) => item.is_tercapai === false,
              );
              return {
                jenis_aspek,
                tanggung_jawab_pegawai: parentAspek?.tanggung_jawab_pegawai,
                tanggung_jawab_atasan: parentAspek?.tanggung_jawab_atasan,
                item: {
                  create: belumTercapai.map((item) => ({
                    dialog_evaluasi: item.dialog_evaluasi,
                    kompetensi_dikembangkan: item.kompetensi_dikembangkan,
                    id_metode_pengembangan: item.id_metode_pengembangan,
                    metode_pengembangan_lainnya: item.metode_pengembangan_lainnya,
                    waktu_pelaksanaan: item.waktu_pelaksanaan,
                  })),
                },
              };
            }),
          },
        },
        select: { id: true },
      });
      return created.id;
    });
  } catch {
    return { error: "Gagal membuat dialog kinerja lanjutan. Silakan coba lagi." };
  }

  await createNotification({
    userId: isPegawai ? parent.id_atasan : parent.id_pegawai,
    type: "dialog_status",
    title: "Dialog Kinerja Lanjutan",
    description: `Dialog kinerja lanjutan tahun ${tahunBerjalan} (${triwulan}) telah dibuat dari reviu dialog tahun ${parent.periode_tahun}. Item yang belum tercapai otomatis disalin.`,
    link: isPegawai
      ? `/atasan/dialog/${newDialog}`
      : `/pegawai/dialog/${newDialog}`,
  });

  revalidatePath("/pegawai/reviu");
  revalidatePath("/atasan/reviu");

  if (session.role === "ATASAN") {
    flashRedirect(`/atasan/dialog/${newDialog}/edit`, {
      type: "success",
      title: "Dialog kinerja lanjutan berhasil dibuat",
      description:
        "Item yang belum tercapai telah disalin ke dialog lanjutan. Lengkapi lalu kirim ke pegawai.",
    });
  }
  if (session.role === "ADMIN") {
    flashRedirect(`/admin/monitoring/${newDialog}`, {
      type: "success",
      title: "Dialog kinerja lanjutan berhasil dibuat",
    });
  }
  flashRedirect(`/pegawai/dialog/${newDialog}`, {
    type: "success",
    title: "Dialog kinerja lanjutan berhasil dibuat",
    description:
      "Item yang belum tercapai telah disalin. Atasan akan mengirim dialog lanjutan untuk Anda.",
  });
}
