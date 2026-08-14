import { prisma } from "@/lib/prisma";

export async function getUserProfileData(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      npp: true,
      nip: true,
      nama_pegawai: true,
      tanggal_bergabung: true,
      nama_jabatan: true,
      unit_kerja: true,
      masa_kerja_unit_terakhir: true,
      default_role: true,
      as_pegawai: true,
      is_admin: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      atasan: {
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
      _count: {
        select: {
          bawahan: true,
          dialogAsAtasan: true,
          dialogAsPegawai: true,
        },
      },
    },
  });

  return user;
}

export type UserProfileData = NonNullable<
  Awaited<ReturnType<typeof getUserProfileData>>
>;
