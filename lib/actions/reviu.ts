"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import { flashRedirect } from "@/lib/utils/flash";
import { createNotification } from "@/lib/notifications";

export interface ReviuCapaianItem {
  id: string;
  is_tercapai: boolean;
  keterangan?: string;
}

export interface ReviuInput {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai?: string;
  penjelasan_tidak_tercapai?: string;
  rencana_tindak_lanjut?: string;
  tanggal_next_evaluasi?: string | null;
  itemCapaian?: ReviuCapaianItem[];
}

export interface ReviuSaveState {
  error?: string;
}

export interface ReviuSignState {
  error?: string;
}

function toNullable(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toNullableDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateSubmitInput(
  input: ReviuInput,
  itemIds: string[],
): string | null {
  const problems: string[] = [];
  const capaianMap = new Map(
    (input.itemCapaian ?? []).map((c) => [c.id, c.is_tercapai]),
  );
  const allAssessed =
    itemIds.length > 0 && itemIds.every((id) => capaianMap.has(id));
  if (!allAssessed) {
    problems.push("Semua item evaluasi harus ditandai tercapai atau tidak");
  }
  const anyTidakTercapai = itemIds.some((id) => capaianMap.get(id) === false);
  if (!anyTidakTercapai && !input.penjelasan_tercapai?.trim()) {
    problems.push("Penjelasan singkat hasilnya wajib diisi");
  }
  if (anyTidakTercapai) {
    if (!input.penjelasan_tidak_tercapai?.trim()) {
      problems.push("Deskripsi penyebab tidak tercapai wajib diisi");
    }
    if (!input.rencana_tindak_lanjut?.trim()) {
      problems.push("Rencana tindak lanjut ke depan wajib diisi");
    }
    if (!input.tanggal_next_evaluasi?.trim()) {
      problems.push("Tanggal evaluasi berikutnya wajib diisi");
    }
  }
  return problems.length > 0 ? problems.join("; ") : null;
}

function deriveGlobalFlags(
  itemIds: string[],
  itemCapaian: ReviuCapaianItem[] | undefined,
): { is_tercapai: boolean; is_tidak_tercapai: boolean } {
  const capaianMap = new Map((itemCapaian ?? []).map((c) => [c.id, c]));
  const assessed = itemIds.filter((id) => capaianMap.has(id));
  const allTercapai =
    assessed.length > 0 && assessed.every((id) => capaianMap.get(id)!.is_tercapai);
  const anyTidakTercapai = assessed.some((id) => capaianMap.get(id)!.is_tercapai === false);
  return { is_tercapai: allTercapai, is_tidak_tercapai: anyTidakTercapai };
}

async function applyItemCapaian(
  dialogId: string,
  itemCapaian: ReviuCapaianItem[] | undefined,
): Promise<void> {
  if (!itemCapaian || itemCapaian.length === 0) return;
  const items = await prisma.dialogKinerjaItem.findMany({
    where: { aspek: { id_dialog: dialogId } },
    select: { id: true },
  });
  const validIds = new Set(items.map((i) => i.id));
  const toUpdate = itemCapaian.filter((c) => validIds.has(c.id));
  if (toUpdate.length === 0) return;
  await prisma.$transaction(
    toUpdate.map((c) =>
      prisma.dialogKinerjaItem.update({
        where: { id: c.id },
        data: {
          is_tercapai: Boolean(c.is_tercapai),
          capaian_keterangan: toNullable(c.keterangan),
        },
      }),
    ),
  );
}

export async function createReviu(
  dialogId: string,
  mode: "draft" | "submit",
  input: ReviuInput,
): Promise<ReviuSaveState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id },
    select: {
      id: true,
      status: true,
      id_atasan: true,
      periode_tahun: true,
      triwulan: true,
      aspek: { select: { item: { select: { id: true } } } },
    },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan." };
  }
  if (dialog.status !== "selesai") {
    return { error: "Reviu hanya dapat dibuat setelah dialog kinerja selesai." };
  }

  const itemIds = dialog.aspek.flatMap((a) => a.item.map((i) => i.id));

  if (mode === "submit") {
    const validationError = validateSubmitInput(input, itemIds);
    if (validationError) {
      return { error: `Lengkapi isian sebelum mengirim: ${validationError}` };
    }
  }

  const { is_tercapai, is_tidak_tercapai } = deriveGlobalFlags(
    itemIds,
    input.itemCapaian,
  );

  let reviuId: string;
  try {
    const reviu = await prisma.reviu.create({
      data: {
        id_dialog: dialog.id,
        is_tercapai,
        is_tidak_tercapai,
        penjelasan_tercapai: toNullable(input.penjelasan_tercapai),
        penjelasan_tidak_tercapai: toNullable(input.penjelasan_tidak_tercapai),
        rencana_tindak_lanjut: toNullable(input.rencana_tindak_lanjut),
        tanggal_next_evaluasi: toNullableDate(input.tanggal_next_evaluasi),
        status: mode === "submit" ? "menunggu_atasan" : "draft_pegawai",
      },
      select: { id: true },
    });
    reviuId = reviu.id;
  } catch {
    return { error: "Gagal menyimpan reviu. Silakan coba lagi." };
  }

  await applyItemCapaian(dialog.id, input.itemCapaian);
  revalidatePath("/pegawai/dialog");
  revalidatePath("/pegawai/reviu");

  if (mode === "submit") {
    await createNotification({
      userId: dialog.id_atasan,
      type: "reviu_status",
      title: "Reviu Baru",
      description: `Reviu untuk dialog kinerja tahun ${dialog.periode_tahun} (${dialog.triwulan}) telah dikirim dan menunggu review Anda.`,
      link: `/atasan/reviu/${reviuId}`,
    });
  }

  flashRedirect(
    `/pegawai/reviu/${reviuId}`,
    mode === "submit"
      ? { type: "success", title: "Reviu berhasil dikirim ke atasan" }
      : { type: "success", title: "Draft reviu berhasil disimpan" },
  );
}

export async function saveReviu(
  reviuId: string,
  mode: "draft" | "submit",
  input: ReviuInput,
): Promise<ReviuSaveState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: session.id } },
    select: {
      id: true,
      status: true,
      dialog: {
        select: {
          id: true,
          id_atasan: true,
          periode_tahun: true,
          triwulan: true,
          aspek: { select: { item: { select: { id: true } } } },
        },
      },
    },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan." };
  }
  if (reviu.status !== "draft_pegawai" && reviu.status !== "revisi_capaian") {
    return { error: "Reviu sudah dikirim dan tidak dapat diubah." };
  }

  const itemIds = reviu.dialog.aspek.flatMap((a) => a.item.map((i) => i.id));

  if (mode === "submit") {
    const validationError = validateSubmitInput(input, itemIds);
    if (validationError) {
      return { error: `Lengkapi isian sebelum mengirim: ${validationError}` };
    }
  }

  const { is_tercapai, is_tidak_tercapai } = deriveGlobalFlags(
    itemIds,
    input.itemCapaian,
  );

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        is_tercapai,
        is_tidak_tercapai,
        penjelasan_tercapai: toNullable(input.penjelasan_tercapai),
        penjelasan_tidak_tercapai: toNullable(input.penjelasan_tidak_tercapai),
        rencana_tindak_lanjut: toNullable(input.rencana_tindak_lanjut),
        tanggal_next_evaluasi: toNullableDate(input.tanggal_next_evaluasi),
        status: mode === "submit" ? "menunggu_atasan" : reviu.status,
        ...(mode === "submit" ? { alasan_tolak: null } : {}),
      },
    });
  } catch {
    return { error: "Gagal menyimpan reviu. Silakan coba lagi." };
  }

  await applyItemCapaian(reviu.dialog.id, input.itemCapaian);
  revalidatePath("/pegawai/reviu");
  revalidatePath(`/pegawai/reviu/${reviu.id}`);

  if (mode === "submit") {
    await createNotification({
      userId: reviu.dialog.id_atasan,
      type: "reviu_status",
      title: "Reviu Baru",
      description: `Reviu untuk dialog kinerja tahun ${reviu.dialog.periode_tahun} (${reviu.dialog.triwulan}) telah dikirim dan menunggu review Anda.`,
      link: `/atasan/reviu/${reviu.id}`,
    });
  }

  flashRedirect(
    `/pegawai/reviu/${reviu.id}`,
    mode === "submit"
      ? { type: "success", title: "Reviu berhasil dikirim ke atasan" }
      : { type: "success", title: "Draft reviu berhasil disimpan" },
  );
}

export async function deleteReviu(reviuId: string): Promise<{ error?: string }> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: session.id } },
    select: { id: true, status: true },
  });
  if (!reviu || reviu.status !== "draft_pegawai") {
    return { error: "Reviu tidak ditemukan atau sudah tidak berstatus draft." };
  }

  await prisma.reviu.delete({ where: { id: reviu.id } });
  revalidatePath("/pegawai/reviu");
  revalidatePath("/pegawai/dialog");
  return {};
}

export async function submitReviuAtasan(
  reviuId: string,
  input: { setuju: boolean },
): Promise<ReviuSignState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_atasan: session.id } },
    select: { id: true, status: true, dialog: { select: { id: true, id_pegawai: true, periode_tahun: true, triwulan: true } } },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan." };
  }
  if (reviu.status !== "menunggu_atasan") {
    return { error: "Reviu belum siap untuk direviu atasan." };
  }

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        is_valid_atasan: true,
        waktu_validasi_atasan: new Date(),
        status: "menunggu_validasi",
      },
    });
  } catch {
    return { error: "Gagal menyimpan evaluasi. Silakan coba lagi." };
  }

  await createNotification({
    userId: reviu.dialog.id_pegawai,
    type: "reviu_status",
    title: "Reviu Perlu Validasi",
    description: `Reviu untuk dialog kinerja tahun ${reviu.dialog.periode_tahun} (${reviu.dialog.triwulan}) telah divalidasi atasan. Silakan validasi.`,
    link: `/pegawai/reviu/${reviu.id}`,
  });

  revalidatePath(`/atasan/dialog/${reviu.dialog.id}`);
  revalidatePath("/atasan/dashboard");
  revalidatePath("/atasan/reviu");
  revalidatePath(`/atasan/reviu/${reviu.id}`);
  revalidatePath(`/pegawai/reviu/${reviu.id}`);
  return {};
}

export async function rejectReviu(
  reviuId: string,
  alasan_tolak: string,
): Promise<ReviuSignState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!alasan_tolak?.trim()) {
    return { error: "Alasan pengembalian/revisi wajib diisi." };
  }

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_atasan: session.id } },
    select: {
      id: true,
      status: true,
      dialog: {
        select: {
          id: true,
          id_pegawai: true,
          periode_tahun: true,
          triwulan: true,
        },
      },
    },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan." };
  }
  if (reviu.status !== "menunggu_atasan") {
    return { error: "Reviu belum siap untuk direviu atasan." };
  }

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        status: "revisi_capaian",
        alasan_tolak: alasan_tolak.trim(),
        is_valid_atasan: false,
        waktu_validasi_atasan: null,
      },
    });
  } catch {
    return { error: "Gagal mengembalikan reviu untuk revisi." };
  }

  await createNotification({
    userId: reviu.dialog.id_pegawai,
    type: "reviu_status",
    title: "Reviu Perlu Revisi",
    description: `Reviu untuk dialog kinerja tahun ${reviu.dialog.periode_tahun} (${reviu.dialog.triwulan}) dikembalikan untuk diperbaiki: "${alasan_tolak.trim()}".`,
    link: `/pegawai/reviu/${reviu.id}`,
  });

  revalidatePath("/atasan/reviu");
  revalidatePath(`/atasan/reviu/${reviu.id}`);
  revalidatePath("/atasan/dialog");
  revalidatePath(`/atasan/dialog/${reviu.dialog.id}`);
  revalidatePath("/pegawai/reviu");
  revalidatePath(`/pegawai/reviu/${reviu.id}`);
  return {};
}

export async function validateReviu(
  reviuId: string,
  input: { setuju: boolean },
): Promise<ReviuSignState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: session.id } },
    select: {
      id: true,
      status: true,
      is_valid_pegawai: true,
      dialog: { select: { id: true, id_atasan: true, periode_tahun: true, triwulan: true } },
    },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan." };
  }
  if (reviu.status !== "menunggu_validasi") {
    return { error: "Reviu belum siap untuk divalidasi." };
  }
  if (reviu.is_valid_pegawai) {
    return { error: "Anda sudah melakukan validasi." };
  }

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        is_valid_pegawai: true,
        waktu_validasi_pegawai: new Date(),
        status: "selesai",
      },
    });
  } catch {
    return { error: "Gagal menyimpan validasi. Silakan coba lagi." };
  }

  await createNotification({
    userId: reviu.dialog.id_atasan,
    type: "reviu_status",
    title: "Reviu Selesai",
    description: `Reviu untuk dialog kinerja tahun ${reviu.dialog.periode_tahun} (${reviu.dialog.triwulan}) telah divalidasi oleh pegawai dan selesai.`,
    link: `/atasan/reviu/${reviu.id}`,
  });

  revalidatePath("/pegawai/reviu");
  revalidatePath(`/pegawai/reviu/${reviu.id}`);
  revalidatePath("/pegawai/dashboard");
  revalidatePath("/pegawai/dialog");
  return {};
}
