import { prisma } from "@/lib/prisma";
import type { StatusDialog } from "@/generated/prisma/enums";

const PEGAWAI_DETAIL_INCLUDE = {
  atasan: {
    select: { nama_pegawai: true, nama_jabatan: true, unit_kerja: true },
  },
  aspek: {
    include: { item: { include: { metode: true } } },
  },
  reviu: {
    orderBy: { created_at: "asc" as const },
  },
  dialog_lanjutan: { select: { id: true } },
  dialog_induk: {
    include: { aspek: { include: { item: { include: { metode: true } } } } },
  },
} as const;

export async function getPegawaiDialog(dialogId: string, pegawaiId: string) {
  return prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: pegawaiId },
    include: PEGAWAI_DETAIL_INCLUDE,
  });
}

export type PegawaiDialog = NonNullable<
  Awaited<ReturnType<typeof getPegawaiDialog>>
>;

export function canEditDialog(status: StatusDialog) {
  return status === "menunggu_pegawai" || status === "revisi_evaluasi";
}

export function canValidateDialog(status: StatusDialog) {
  return status === "menunggu_validasi";
}

const ACTOR_PROFILE_SELECT = {
  nama_pegawai: true,
  nip: true,
  tanggal_bergabung: true,
  nama_jabatan: true,
  unit_kerja: true,
  masa_kerja_unit_terakhir: true,
} as const;

export async function getDialogActor(actorId: string) {
  return prisma.user.findUnique({
    where: { id: actorId },
    select: ACTOR_PROFILE_SELECT,
  });
}

export async function getDialogSequenceMap(dialogIds: string[]) {
  if (dialogIds.length === 0) return new Map<string, number>();

  const dialogs = await prisma.dialogKinerja.findMany({
    where: { id: { in: dialogIds } },
    select: { id: true, id_pegawai: true },
  });

  const pegawaiIds = Array.from(new Set(dialogs.map((d) => d.id_pegawai)));

  const allPegawaiDialogs = await prisma.dialogKinerja.findMany({
    where: { id_pegawai: { in: pegawaiIds } },
    select: { id: true, id_pegawai: true },
    orderBy: { id: "asc" },
  });

  const seqMap = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const d of allPegawaiDialogs) {
    const nextCount = (counts.get(d.id_pegawai) ?? 0) + 1;
    counts.set(d.id_pegawai, nextCount);
    seqMap.set(d.id, nextCount);
  }

  return seqMap;
}
