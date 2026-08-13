import { prisma } from "@/lib/prisma";

export async function getAtasanPegawaiOptions(atasanId: number) {
  return prisma.user.findMany({
    where: { id_atasan: atasanId, is_active: true },
    select: {
      id: true,
      npp: true,
      nama_pegawai: true,
      nama_jabatan: true,
      unit_kerja: true,
    },
    orderBy: { nama_pegawai: "asc" },
  });
}

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
