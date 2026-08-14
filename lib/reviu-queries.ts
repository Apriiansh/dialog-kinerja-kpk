import { prisma } from "@/lib/prisma";
import type { StatusReviu } from "@/generated/prisma/enums";

const REVIU_INCLUDE = {
  dialog: {
    select: {
      id: true,
      periode_tahun: true,
      status: true,
      pegawai: {
        select: {
          npp: true,
          nama_pegawai: true,
          nip: true,
          nama_jabatan: true,
          unit_kerja: true,
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
    },
  },
} as const;

export async function getPegawaiReviuList(pegawaiId: number) {
  return prisma.reviu.findMany({
    where: { dialog: { id_pegawai: pegawaiId } },
    include: REVIU_INCLUDE,
    orderBy: { created_at: "desc" },
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

export async function getAtasanReviuList(atasanId: number) {
  return prisma.reviu.findMany({
    where: { dialog: { id_atasan: atasanId } },
    include: REVIU_INCLUDE,
    orderBy: { created_at: "desc" },
  });
}

export async function getDialogReviuList(dialogId: number) {
  return prisma.reviu.findMany({
    where: { id_dialog: dialogId },
    include: REVIU_INCLUDE,
    orderBy: { created_at: "asc" },
  });
}

export interface SelesaiDialogOption {
  id: number;
  periode_tahun: number;
  atasan: { nama_pegawai: string; nama_jabatan: string | null };
  _count: { reviu: number };
}

export async function getPegawaiSelesaiDialogOptions(
  pegawaiId: number,
): Promise<SelesaiDialogOption[]> {
  return prisma.dialogKinerja.findMany({
    where: { id_pegawai: pegawaiId, status: "selesai" },
    select: {
      id: true,
      periode_tahun: true,
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
