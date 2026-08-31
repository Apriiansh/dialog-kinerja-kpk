"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { saveTtdFile } from "@/lib/export/ttd";
import { assertActiveActor } from "@/lib/auth/guards";
import { flashRedirect } from "@/lib/utils/flash";
import { JenisAspek, StatusDialog, Triwulan } from "@/generated/prisma/client";
import { createNotification } from "@/lib/notifications";
import { getTriwulanFromDate } from "@/lib/constants/triwulan";
import { publishDialogUpdate } from "@/lib/realtime/bus";

export async function startDialog(
  pegawaiId: number,
  tanggalPeriode?: string,
): Promise<{ error?: string; dialogId?: number }> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const user = await prisma.user.findFirst({
    where: { id: pegawaiId, id_atasan: session.id, is_active: true },
    select: { id: true, npp: true },
  });
  if (!user) return { error: "Pegawai tidak ditemukan" };

  const latestDialog = await prisma.dialogKinerja.findFirst({
    where: { id_pegawai: pegawaiId },
    orderBy: { id: "desc" },
    include: {
      reviu: {
        orderBy: { id: "desc" },
        take: 1,
      },
    },
  });

  let idDialogInduk: number | null = null;
  let aspekData:
    | {
        jenis_aspek: JenisAspek;
        tanggung_jawab_pegawai?: string | null;
        tanggung_jawab_atasan?: string | null;
        item?: {
          create: {
            dialog_evaluasi?: string | null;
            kompetensi_dikembangkan?: string | null;
            id_metode_pengembangan?: number | null;
            metode_pengembangan_lainnya?: string | null;
            waktu_pelaksanaan?: Date | null;
          }[];
        };
      }[]
    | undefined = undefined;

  if (latestDialog) {
    if (latestDialog.status !== "selesai") {
      return { error: "Pegawai masih memiliki dialog kinerja berjalan yang belum selesai." };
    }
    const latestReviu = latestDialog.reviu[0];
    if (!latestReviu) {
      return { error: "Dialog kinerja sebelumnya belum memiliki reviu." };
    }
    if (latestReviu.status !== "selesai") {
      return { error: "Reviu untuk dialog kinerja sebelumnya belum selesai divalidasi." };
    }

    idDialogInduk = latestDialog.id;

    const parent = await prisma.dialogKinerja.findFirst({
      where: { id: latestDialog.id },
      include: {
        aspek: {
          include: {
            item: {
              select: {
                dialog_evaluasi: true,
                kompetensi_dikembangkan: true,
                id_metode_pengembangan: true,
                metode_pengembangan_lainnya: true,
                waktu_pelaksanaan: true,
                is_tercapai: true,
              },
            },
          },
        },
      },
    });

    aspekData = Object.values(JenisAspek).map((jenis_aspek) => {
      const parentAspek = parent?.aspek.find((a) => a.jenis_aspek === jenis_aspek);
      const belumTercapai = (parentAspek?.item ?? []).filter((item) => item.is_tercapai === false);
      return {
        jenis_aspek,
        tanggung_jawab_pegawai: parentAspek?.tanggung_jawab_pegawai,
        tanggung_jawab_atasan: parentAspek?.tanggung_jawab_atasan,
        item: {
          create: belumTercapai.map((item) => ({
            dialog_evaluasi: item.dialog_evaluasi,
            kompetensi_dikembangkan: item.kompetensi_dikembangkan,
            id_metode_pengembangan: item.id_metode_pengembangan,
            metode_pengembangan_lainnya: item.metode_pengembangan_lainnya,
            waktu_pelaksanaan: item.waktu_pelaksanaan,
          })),
        },
      };
    });
  } else {
    aspekData = Object.values(JenisAspek).map((jenis_aspek) => ({
      jenis_aspek,
    }));
  }

  const periodeDate = tanggalPeriode ? new Date(tanggalPeriode) : new Date();
  const periodeTahun = periodeDate.getFullYear();
  const triwulan = getTriwulanFromDate(periodeDate);

  const existingSameTriwulan = await prisma.dialogKinerja.findFirst({
    where: {
      id_pegawai: pegawaiId,
      periode_tahun: periodeTahun,
      triwulan,
    },
  });
  if (existingSameTriwulan) {
    return {
      error: `Dialog kinerja untuk ${triwulan} Tahun ${periodeTahun} sudah pernah dibuat.`,
    };
  }

  const dialog = await prisma.dialogKinerja.create({
    data: {
      id_atasan: session.id,
      id_pegawai: pegawaiId,
      periode_tahun: periodeTahun,
      triwulan,
      id_dialog_induk: idDialogInduk,
      status: "draft",
      aspek: {
        create: aspekData,
      },
    },
    select: { id: true },
  });

  // Pull imported staging items for this employee if available
  const stagingItems = await prisma.importStagingItem.findMany({
    where: {
      npp: user.npp,
      periode_tahun: periodeTahun,
      triwulan,
      is_consumed: false,
    },
  });

  if (stagingItems.length > 0) {
    const dialogAspeks = await prisma.dialogKinerjaAspek.findMany({
      where: { id_dialog: dialog.id },
      select: { id: true, jenis_aspek: true },
    });
    const aspekIdByJenis = new Map(dialogAspeks.map((a) => [a.jenis_aspek, a.id]));

    const itemsToCreate: { id_aspek: number; dialog_evaluasi: string }[] = [];
    const consumedIds: number[] = [];

    for (const item of stagingItems) {
      const aspekId = aspekIdByJenis.get(item.jenis_aspek);
      if (aspekId) {
        itemsToCreate.push({
          id_aspek: aspekId,
          dialog_evaluasi: item.narasi,
        });
        consumedIds.push(item.id);
      }
    }

    if (itemsToCreate.length > 0) {
      await prisma.dialogKinerjaItem.createMany({
        data: itemsToCreate,
      });
      await prisma.importStagingItem.updateMany({
        where: { id: { in: consumedIds } },
        data: {
          is_consumed: true,
          id_dialog: dialog.id,
        },
      });
    }
  }

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
      status: { in: ["draft", "menunggu_pegawai", "menunggu_atasan"] },
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

  publishDialogUpdate(dialogId, {
    kind: "aspek_atasan",
    byUserId: session.id,
  });
}

export interface SaveDeskripsiState {
  error?: string;
}

export async function saveDeskripsiKinerja(
  dialogId: number,
  value: string,
  periode_tahun?: number,
  triwulan?: Triwulan,
): Promise<SaveDeskripsiState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const dialog = await prisma.dialogKinerja.findFirst({
    where: {
      id: dialogId,
      id_atasan: session.id,
      status: { in: ["draft", "menunggu_pegawai", "menunggu_atasan"] },
    },
    select: { id: true },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan atau sudah tidak dapat diubah." };
  }

  const updateData: Record<string, unknown> = {
    deskripsi_kinerja: value.trim() || null,
  };
  if (periode_tahun) {
    updateData.periode_tahun = periode_tahun;
  }
  if (triwulan) {
    updateData.triwulan = triwulan;
  }

  await prisma.dialogKinerja.update({
    where: { id: dialog.id },
    data: updateData,
  });

  publishDialogUpdate(dialogId, {
    kind: "aspek_atasan",
    byUserId: session.id,
  });

  revalidatePath(`/atasan/dialog/${dialog.id}`);
  revalidatePath(`/atasan/dialog/${dialog.id}/edit`);
  revalidatePath("/atasan/dialog");
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
    where: { id: dialogId, id_atasan: session.id, status: "draft" },
    select: { id: true, id_pegawai: true, periode_tahun: true, triwulan: true },
  });
  if (!dialog) flashRedirect("/atasan/dashboard", {
    type: "error",
    title: "Dialog tidak ditemukan",
  });

  await prisma.dialogKinerja.update({
    where: { id: dialogId },
    data: { status: "menunggu_pegawai" },
  });

  publishDialogUpdate(dialogId, {
    kind: "status",
    byUserId: session.id,
  });

  await createNotification({
    userId: dialog.id_pegawai,
    type: "dialog_status",
    title: "Dialog Kinerja Baru",
    description: `Anda memiliki dialog kinerja baru tahun ${dialog.periode_tahun} (${dialog.triwulan}) yang perlu dilengkapi.`,
    link: `/pegawai/dialog/${dialog.id}`,
  });

  flashRedirect(`/atasan/dialog/${dialogId}`, {
    type: "success",
    title: "Dialog kinerja berhasil dikirim ke pegawai",
  });
}

export async function approveDialog(
  dialogId: number,
  deskripsiKinerja?: string,
): Promise<{ error?: string }> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft" },
    select: { id: true, id_pegawai: true, periode_tahun: true, triwulan: true },
  });
  if (!dialog) {
    return { error: "Pengajuan dialog tidak ditemukan atau sudah diproses." };
  }

  try {
    await prisma.dialogKinerja.update({
      where: { id: dialogId },
      data: {
        status: "menunggu_pegawai",
        alasan_tolak: null,
        ...(deskripsiKinerja !== undefined
          ? { deskripsi_kinerja: deskripsiKinerja.trim() || null }
          : {}),
      },
    });
  } catch {
    return { error: "Gagal menyetujui pengajuan dialog." };
  }

  publishDialogUpdate(dialogId, {
    kind: "status",
    byUserId: session.id,
  });

  await createNotification({
    userId: dialog.id_pegawai,
    type: "dialog_status",
    title: "Pengajuan Dialog Disetujui",
    description: `Pengajuan Dialog Kinerja untuk ${dialog.triwulan} ${dialog.periode_tahun} telah disetujui atasan. Silakan lengkapi isian aspek.`,
    link: `/pegawai/dialog/${dialog.id}`,
  });

  revalidatePath("/atasan/dialog");
  revalidatePath(`/atasan/dialog/${dialogId}`);
  revalidatePath("/pegawai/dialog");
  revalidatePath(`/pegawai/dialog/${dialogId}`);

  return {};
}

export async function rejectDialog(
  dialogId: number,
  alasan_tolak: string,
): Promise<{ error?: string }> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!alasan_tolak?.trim()) {
    return { error: "Alasan pengembalian/revisi wajib diisi." };
  }

  const dialog = await prisma.dialogKinerja.findFirst({
    where: {
      id: dialogId,
      id_atasan: session.id,
      status: { in: ["draft", "menunggu_atasan"] },
    },
    select: {
      id: true,
      id_pegawai: true,
      periode_tahun: true,
      triwulan: true,
      status: true,
    },
  });
  if (!dialog) {
    return { error: "Pengajuan dialog tidak ditemukan atau sudah diproses." };
  }

  const currentStatus = dialog.status;
  const targetStatus: StatusDialog =
    currentStatus === "menunggu_atasan" ? "revisi_evaluasi" : "draft";

  try {
    await prisma.dialogKinerja.update({
      where: { id: dialog.id },
      data: {
        status: targetStatus,
        alasan_tolak: alasan_tolak.trim(),
      },
    });
  } catch {
    return { error: "Gagal mengembalikan dialog untuk revisi." };
  }

  publishDialogUpdate(dialog.id, {
    kind: "status",
    byUserId: session.id,
  });

  const isEvaluasi =
    currentStatus === "menunggu_atasan";

  await createNotification({
    userId: dialog.id_pegawai,
    type: "dialog_status",
    title: isEvaluasi
      ? "Evaluasi Dialog Memerlukan Revisi"
      : "Pengajuan Dialog Memerlukan Revisi",
    description: `Dialog Kinerja ${dialog.triwulan} ${dialog.periode_tahun} ${
      isEvaluasi ? "dikembalikan untuk diperbaiki" : "perlu direvisi"
    }: "${alasan_tolak.trim()}".`,
    link: `/pegawai/dialog/${dialog.id}`,
  });

  revalidatePath("/atasan/dialog");
  revalidatePath(`/atasan/dialog/${dialog.id}`);
  revalidatePath("/pegawai/dialog");
  revalidatePath(`/pegawai/dialog/${dialog.id}`);

  return {};
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

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "menunggu_atasan" },
    select: { id: true, id_pegawai: true, periode_tahun: true, triwulan: true },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan atau belum siap dievaluasi." };
  }

  let ttdUrl: string | null = null;
  if (input.ttdDataUrl) {
    try {
      ttdUrl = await saveTtdFile(input.ttdDataUrl, dialog.id, "atasan");
    } catch {
      return { error: "Tanda tangan gagal disimpan. Silakan coba lagi." };
    }
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

  publishDialogUpdate(dialogId, {
    kind: "status",
    byUserId: session.id,
  });

  await createNotification({
    userId: dialog.id_pegawai,
    type: "dialog_status",
    title: "Evaluasi Atasan Selesai",
    description: `Evaluasi atasan untuk dialog kinerja tahun ${dialog.periode_tahun} (${dialog.triwulan}) telah selesai. Silakan validasi dan tanda tangani.`,
    link: `/pegawai/dialog/${dialog.id}`,
  });

  revalidatePath(`/atasan/dialog/${dialog.id}`);
  revalidatePath("/atasan/dashboard");
  return {};
}

export async function deleteDialog(dialogId: number): Promise<{ error?: string }> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft" },
    select: { id: true },
  });
  if (!dialog) return { error: "Dialog tidak ditemukan" };

  await prisma.dialogKinerja.delete({ where: { id: dialogId } });
  revalidatePath("/atasan/dialog");
  return {};
}
