"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";

export interface HierarkiState {
  error?: string;
}

async function validasiRelasi(
  pegawaiId: number,
  atasanId: number,
): Promise<string | null> {
  if (atasanId === pegawaiId) return "Tidak bisa memilih diri sendiri.";

  const [atasan, pegawai] = await Promise.all([
    prisma.user.findUnique({ where: { id: atasanId } }),
    prisma.user.findUnique({ where: { id: pegawaiId } }),
  ]);
  if (!atasan || !pegawai) return "Pengguna tidak ditemukan.";
  if (atasan.is_admin) return "Admin tidak bisa menjadi atasan.";
  if (!pegawai.is_active || !atasan.is_active) return "Pengguna nonaktif.";
  return null;
}

export async function pilihAtasan(atasanId: number): Promise<HierarkiState> {
  const session = await requireAuth();
  const error = await validasiRelasi(session.id, atasanId);
  if (error) return { error };

  const { count: dialogPindah } = await prisma.dialogKinerja.updateMany({
    where: { id_pegawai: session.id, status: { not: "selesai" } },
    data: { id_atasan: atasanId },
  });

  const atasan = await prisma.user.findUnique({
    where: { id: atasanId },
    select: { id: true, nama_pegawai: true },
  });

  await prisma.user.update({
    where: { id: session.id },
    data: { id_atasan: atasanId, as_pegawai: true },
  });

  if (atasan) {
    await createNotification({
      userId: atasan.id,
      type: "hierarki_ditugaskan",
      title: "Pegawai Baru di Bawah Anda",
      description:
        dialogPindah > 0
          ? `${session.nama} menempatkan diri sebagai pegawai di bawah pembinaan Anda. ${dialogPindah} dialog kinerja yang belum selesai ikut dipindahkan ke Anda.`
          : `${session.nama} menempatkan diri sebagai pegawai di bawah pembinaan Anda.`,
      link: "/atasan/profil",
    });
  }

  revalidatePath("/pegawai/profil");
  revalidatePath("/atasan/profil");
  revalidatePath("/admin/profil");
  return {};
}
