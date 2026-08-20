import { prisma } from "@/lib/prisma";
import type { StatusReviu } from "@/generated/prisma/enums";

export const REVIU_INCLUDE = {
  dialog: {
    select: {
      id: true,
      id_dialog_induk: true,
      periode_tahun: true,
      triwulan: true,
      status: true,
      waktu_validasi_atasan: true,
      pegawai: {
        select: {
          npp: true,
          nama_pegawai: true,
          nip: true,
          tanggal_bergabung: true,
          nama_jabatan: true,
          unit_kerja: true,
          masa_kerja_unit_terakhir: true,
        },
      },
      atasan: {
        select: {
          npp: true,
          nama_pegawai: true,
          nip: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
      aspek: {
        select: {
          id: true,
          jenis_aspek: true,
          item: {
            select: {
              id: true,
              dialog_evaluasi: true,
              kompetensi_dikembangkan: true,
              is_tercapai: true,
              capaian_keterangan: true,
            },
            orderBy: { id: "asc" },
          },
        },
        orderBy: { id: "asc" },
      },
      dialog_lanjutan: {
        select: { id: true },
      },
      dialog_induk: {
        select: {
          aspek: {
            select: {
              item: {
                select: {
                  dialog_evaluasi: true,
                  kompetensi_dikembangkan: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function getPegawaiReviuList(
  pegawaiId: number,
  opts?: { skip?: number; take?: number; status?: StatusReviu },
) {
  const where: Record<string, unknown> = { dialog: { id_pegawai: pegawaiId } };
  if (opts?.status) where.status = opts.status;
  return prisma.reviu.findMany({
    where,
    include: REVIU_INCLUDE,
    orderBy: { created_at: "desc" },
    skip: opts?.skip,
    take: opts?.take,
  });
}

export async function getPegawaiReviu(reviuId: number, pegawaiId: number) {
  return prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: pegawaiId } },
    include: REVIU_INCLUDE,
  });
}

export async function getAtasanReviu(reviuId: number, atasanId: number) {
  return prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_atasan: atasanId } },
    include: REVIU_INCLUDE,
  });
}

export async function getAtasanReviuList(
  atasanId: number,
  opts?: { skip?: number; take?: number; status?: StatusReviu },
) {
  const where: Record<string, unknown> = { dialog: { id_atasan: atasanId } };
  if (opts?.status) where.status = opts.status;
  return prisma.reviu.findMany({
    where,
    include: REVIU_INCLUDE,
    orderBy: { created_at: "desc" },
    skip: opts?.skip,
    take: opts?.take,
  });
}

export async function countReviu(
  where: Record<string, unknown>,
) {
  return prisma.reviu.count({ where });
}

export async function getDialogReviuList(dialogId: number) {
  return prisma.reviu.findMany({
    where: { id_dialog: dialogId },
    include: REVIU_INCLUDE,
    orderBy: { created_at: "asc" },
  });
}

export async function getDialogAspekItems(dialogId: number) {
  return prisma.dialogKinerjaAspek.findMany({
    where: { id_dialog: dialogId },
    select: {
      id: true,
      jenis_aspek: true,
      item: {
        select: {
          id: true,
          dialog_evaluasi: true,
          kompetensi_dikembangkan: true,
          is_tercapai: true,
          capaian_keterangan: true,
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });
}

export interface SelesaiDialogOption {
  id: number;
  id_dialog_induk: number | null;
  periode_tahun: number;
  triwulan: import("@/generated/prisma/enums").Triwulan;
  atasan: { nama_pegawai: string; nama_jabatan: string | null };
  _count: { reviu: number };
}

export async function getPegawaiSelesaiDialogOptions(
  pegawaiId: number,
): Promise<SelesaiDialogOption[]> {
  return prisma.dialogKinerja.findMany({
    where: {
      id_pegawai: pegawaiId,
      status: "selesai",
      reviu: { none: {} },
    },
    select: {
      id: true,
      id_dialog_induk: true,
      periode_tahun: true,
      triwulan: true,
      atasan: { select: { nama_pegawai: true, nama_jabatan: true } },
      _count: { select: { reviu: true } },
    },
    orderBy: { updated_at: "desc" },
  });
}

export type ReviuRow = NonNullable<
  Awaited<ReturnType<typeof getPegawaiReviu>>
>;

export function canEditReviu(status: StatusReviu) {
  return status === "draft_pegawai";
}

export function canValidateReviu(status: StatusReviu) {
  return status === "menunggu_validasi";
}

export interface EvaluasiReminderItem {
  id: number;
  dialogId: number;
  namaPegawai?: string;
  periodeTahun: number;
  triwulan: import("@/generated/prisma/enums").Triwulan;
  tanggalEvaluasi: Date;
  href: string;
}

export async function getActiveEvaluasiReminders(
  userId: number,
  role: "PEGAWAI" | "ATASAN" | "ADMIN",
): Promise<EvaluasiReminderItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (role === "PEGAWAI") {
    const revius = await prisma.reviu.findMany({
      where: {
        status: "selesai",
        dialog: {
          id_pegawai: userId,
          dialog_lanjutan: { none: {} },
        },
        tanggal_next_evaluasi: { lte: maxDate },
      },
      select: {
        id: true,
        tanggal_next_evaluasi: true,
        dialog: {
          select: {
            id: true,
            periode_tahun: true,
            triwulan: true,
          },
        },
      },
      orderBy: { tanggal_next_evaluasi: "asc" },
      take: 3,
    });

    return revius
      .filter((r) => r.tanggal_next_evaluasi !== null)
      .map((r) => ({
        id: r.id,
        dialogId: r.dialog.id,
        periodeTahun: r.dialog.periode_tahun,
        triwulan: r.dialog.triwulan,
        tanggalEvaluasi: r.tanggal_next_evaluasi!,
        href: "/pegawai/dialog",
      }));
  }

  if (role === "ATASAN") {
    const revius = await prisma.reviu.findMany({
      where: {
        status: "selesai",
        dialog: {
          id_atasan: userId,
          dialog_lanjutan: { none: {} },
        },
        tanggal_next_evaluasi: { lte: maxDate },
      },
      select: {
        id: true,
        tanggal_next_evaluasi: true,
        dialog: {
          select: {
            id: true,
            periode_tahun: true,
            triwulan: true,
            pegawai: {
              select: { nama_pegawai: true },
            },
          },
        },
      },
      orderBy: { tanggal_next_evaluasi: "asc" },
      take: 5,
    });

    return revius
      .filter((r) => r.tanggal_next_evaluasi !== null)
      .map((r) => ({
        id: r.id,
        dialogId: r.dialog.id,
        namaPegawai: r.dialog.pegawai.nama_pegawai,
        periodeTahun: r.dialog.periode_tahun,
        triwulan: r.dialog.triwulan,
        tanggalEvaluasi: r.tanggal_next_evaluasi!,
        href: `/atasan/dialog?reviu=${r.id}`,
      }));
  }

  return [];
}

