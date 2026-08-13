import { prisma } from "@/lib/prisma";

export async function getAtasanPegawaiOptions(atasanId: number) {
  const atasan = await prisma.user.findUnique({
    where: { id: atasanId },
    select: { unit_kerja: true },
  });

  return prisma.user.findMany({
    where: atasan?.unit_kerja
      ? { role: "PEGAWAI", unit_kerja: atasan.unit_kerja }
      : { role: "PEGAWAI" },
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
      nama_jabatan: true,
      unit_kerja: true,
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
