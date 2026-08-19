"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { saveTtdFile } from "@/lib/export/ttd";
import { assertActiveActor } from "@/lib/auth/guards";
import { flashRedirect } from "@/lib/utils/flash";
import { JenisAspek } from "@/generated/prisma/client";
import { createNotification } from "@/lib/notifications";

export async function startDialog(pegawaiId: number): Promise<{ error?: string; dialogId?: number }> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const user = await prisma.user.findFirst({
    where: { id: pegawaiId, id_atasan: session.id, is_active: true },
    select: { id: true },
  });
  if (!user) return { error: "Pegawai tidak ditemukan" };

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
  revalidatePath("/atasan/dialog");
  return { dialogId: dialog.id };
}

export async function autosaveResponses(
  dialogId: number,
  values: Record<string, string>,
) {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) flashRedirect("/login", {
    type: "warning",
    title: "Sesi berakhir",
  });
  const dialog = await prisma.dialogKinerja.findFirst({
    where: {
      id: dialogId,
      id_atasan: session.id,
      status: { in: ["draft_atasan", "menunggu_atasan"] },
    },
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

export interface SaveDeskripsiState {
  error?: string;
}

export async function saveDeskripsiKinerja(
  dialogId: number,
  value: string,
): Promise<SaveDeskripsiState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan atau sudah dikirim." };
  }

  await prisma.dialogKinerja.update({
    where: { id: dialog.id },
    data: { deskripsi_kinerja: value.trim() || null },
  });

  revalidatePath(`/atasan/dialog/${dialog.id}`);
  return {};
}

export async function submitDialog(dialogId: number) {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) flashRedirect("/login", {
    type: "warning",
    title: "Sesi berakhir",
  });
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true, id_pegawai: true, periode_tahun: true },
  });
  if (!dialog) flashRedirect("/atasan/dashboard", {
    type: "error",
    title: "Dialog tidak ditemukan",
  });

  await prisma.dialogKinerja.update({
    where: { id: dialogId },
    data: { status: "menunggu_pegawai" },
  });

  await createNotification({
    userId: dialog.id_pegawai,
    type: "dialog_status",
    title: "Dialog Kinerja Baru",
    description: `Anda memiliki dialog kinerja baru tahun ${dialog.periode_tahun} yang perlu dilengkapi.`,
    link: `/pegawai/dialog/${dialog.id}`,
  });

  flashRedirect(`/atasan/dialog/${dialogId}`, {
    type: "success",
    title: "Dialog kinerja berhasil dikirim ke pegawai",
  });
}

export interface SubmitEvaluasiState {
  error?: string;
}

export async function submitEvaluasi(
  dialogId: number,
  input: { setuju: boolean; ttdDataUrl: string | null },
): Promise<SubmitEvaluasiState> {
  const session = await requireRole("ATASAN");

  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }
  if (!input.ttdDataUrl) {
    return { error: "Tanda tangan wajib diisi." };
  }

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "menunggu_atasan" },
    select: { id: true, id_pegawai: true, periode_tahun: true },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan atau belum siap dievaluasi." };
  }

  let ttdUrl: string;
  try {
    ttdUrl = await saveTtdFile(input.ttdDataUrl, dialog.id, "atasan");
  } catch {
    return { error: "Tanda tangan gagal disimpan. Silakan coba lagi." };
  }

  try {
    await prisma.dialogKinerja.update({
      where: { id: dialog.id },
      data: {
        status: "menunggu_validasi",
        is_valid_atasan: true,
        ttd_atasan_path: ttdUrl,
        waktu_validasi_atasan: new Date(),
      },
    });
  } catch {
    return { error: "Gagal menyimpan evaluasi. Silakan coba lagi." };
  }

  await createNotification({
    userId: dialog.id_pegawai,
    type: "dialog_status",
    title: "Evaluasi Atasan Selesai",
    description: `Evaluasi atasan untuk dialog kinerja tahun ${dialog.periode_tahun} telah selesai. Silakan validasi dan tanda tangani.`,
    link: `/pegawai/dialog/${dialog.id}`,
  });

  revalidatePath(`/atasan/dialog/${dialog.id}`);
  revalidatePath("/atasan/dashboard");
  revalidatePath("/atasan/history");
  return {};
}

export async function deleteDialog(dialogId: number): Promise<{ error?: string }> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) return { error: "Dialog tidak ditemukan" };

  await prisma.dialogKinerja.delete({ where: { id: dialogId } });
  revalidatePath("/atasan/dialog");
  return {};
}
