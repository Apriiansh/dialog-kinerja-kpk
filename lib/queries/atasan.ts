import { prisma } from "@/lib/prisma";

const ATASAN_DIALOG_INCLUDE = {
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
  aspek: { include: { item: { include: { metode: true } } } },
  reviu: {
    orderBy: { created_at: "asc" as const },
  },
  dialog_lanjutan: { select: { id: true } },
  dialog_induk: {
    include: { aspek: { include: { item: { include: { metode: true } } } } },
  },
} as const;

export async function getAtasanDialog(dialogId: number, atasanId: number) {
  return prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: atasanId },
    include: ATASAN_DIALOG_INCLUDE,
  });
}

export type AtasanDialog = NonNullable<
  Awaited<ReturnType<typeof getAtasanDialog>>
>;
