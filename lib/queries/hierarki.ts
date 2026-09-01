import { prisma } from "../prisma";

export async function getKandidatAtasan() {
  return prisma.user.findMany({
    where: { is_admin: false, is_active: true },
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

export type KandidatUser = NonNullable<Awaited<ReturnType<typeof getKandidatAtasan>>>[number]
