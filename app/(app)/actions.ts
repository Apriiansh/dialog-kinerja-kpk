"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, requireRole } from "@/lib/session";
import { JenisAspek } from "@/generated/prisma/client";

export async function logoutAction() {
  const session = await getSession();
  await session.destroy();
  redirect("/login");
}

export async function startDialog(pegawaiId: number) {
  const session = await requireRole("ATASAN");
  const user = await prisma.user.findFirst({
    where: { id: pegawaiId, role: "PEGAWAI" },
    select: { id: true },
  });
  if (!user) redirect("/dashboard");

  const dialog = await prisma.dialogKinerja.create({
    data: {
      id_atasan: session.id,
      id_pegawai: pegawaiId,
      periode_tahun: new Date().getFullYear(),
      status: "draft_atasan",
      aspek: {
        create: Object.values(JenisAspek).map((jenis_aspek) => ({
          jenis_aspek,
        })),
      },
    },
    select: { id: true },
  });
  redirect(`/dashboard/dialog/${dialog.id}/edit`);
}

export async function autosaveResponses(
  dialogId: number,
  values: Record<string, string>,
) {
  const session = await requireRole("ATASAN");
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) return;

  await prisma.$transaction(
    Object.entries(values).map(([id, value]) =>
      prisma.dialogKinerjaAspek.updateMany({
        where: { id: Number(id), id_dialog: dialogId },
        data: { tanggung_jawab_atasan: value.trim() || null },
      }),
    ),
  );
}

export async function submitDialog(dialogId: number) {
  const session = await requireRole("ATASAN");
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) redirect("/dashboard");

  await prisma.dialogKinerja.update({
    where: { id: dialogId },
    data: {
      status: "menunggu_pegawai",
      is_valid_atasan: true,
      waktu_validasi_atasan: new Date(),
    },
  });
  redirect("/dashboard/history");
}

export async function deleteDialog(dialogId: number) {
  const session = await requireRole("ATASAN");
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) redirect("/dashboard/dialog");

  await prisma.dialogKinerja.delete({ where: { id: dialogId } });
  redirect("/dashboard/dialog");
}
