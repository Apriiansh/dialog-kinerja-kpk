import { prisma } from "@/lib/prisma";
import type { StatusDialog } from "@/generated/prisma/enums";

const PEGAWAI_DETAIL_INCLUDE = {
  atasan: {
    select: { nama_pegawai: true, nama_jabatan: true, unit_kerja: true },
  },
  aspek: {
    include: { item: { include: { metode: true } } },
  },
} as const;

export async function getPegawaiDialog(dialogId: number, pegawaiId: number) {
  return prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: pegawaiId },
    include: PEGAWAI_DETAIL_INCLUDE,
  });
}

export type PegawaiDialog = NonNullable<
  Awaited<ReturnType<typeof getPegawaiDialog>>
>;

export function canEditDialog(status: StatusDialog) {
  return status === "menunggu_pegawai";
}

export function canValidateDialog(status: StatusDialog) {
  return status === "menunggu_validasi";
}