"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { saveTtdFile } from "@/lib/ttd";
import { assertActiveActor } from "@/lib/auth-helpers";
import { flashRedirect } from "@/lib/flash";

export interface ReviuInput {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai?: string;
  penjelasan_tidak_tercapai?: string;
  rencana_tindak_lanjut?: string;
  tanggal_next_reviu?: string | null;
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
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateSubmitInput(input: ReviuInput): string | null {
  const problems: string[] = [];
  const tercapai = Boolean(input.is_tercapai);
  const tidakTercapai = Boolean(input.is_tidak_tercapai);

  if (!tercapai && !tidakTercapai) {
    problems.push("Pilih minimal satu status tindak lanjut");
  }
  if (tercapai && !input.penjelasan_tercapai?.trim()) {
    problems.push("Penjelasan status tercapai wajib diisi");
  }
  if (tidakTercapai) {
    if (!input.penjelasan_tidak_tercapai?.trim()) {
      problems.push("Penjelasan status tidak tercapai wajib diisi");
    }
    if (!input.rencana_tindak_lanjut?.trim()) {
      problems.push("Rencana tindak lanjut ke depan wajib diisi");
    }
    if (!input.tanggal_next_reviu?.trim()) {
      problems.push("Tanggal reviu berikutnya wajib diisi");
    }
  }
  return problems.length > 0 ? problems.join("; ") : null;
}

export async function createReviu(
  dialogId: number,
  mode: "draft" | "submit",
  input: ReviuInput,
): Promise<ReviuSaveState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id },
    select: { id: true, status: true },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan." };
  }
  if (dialog.status !== "selesai") {
    return { error: "Reviu hanya dapat dibuat setelah dialog kinerja selesai." };
  }

  if (mode === "submit") {
    const validationError = validateSubmitInput(input);
    if (validationError) {
      return { error: `Lengkapi isian sebelum mengirim: ${validationError}` };
    }
  }

  let reviuId: number;
  try {
    const reviu = await prisma.reviu.create({
      data: {
        id_dialog: dialog.id,
        is_tercapai: Boolean(input.is_tercapai),
        is_tidak_tercapai: Boolean(input.is_tidak_tercapai),
        penjelasan_tercapai: toNullable(input.penjelasan_tercapai),
        penjelasan_tidak_tercapai: toNullable(input.penjelasan_tidak_tercapai),
        rencana_tindak_lanjut: toNullable(input.rencana_tindak_lanjut),
        tanggal_next_reviu: toNullableDate(input.tanggal_next_reviu),
        status: mode === "submit" ? "menunggu_atasan" : "draft_pegawai",
      },
      select: { id: true },
    });
    reviuId = reviu.id;
  } catch {
    return { error: "Gagal menyimpan reviu. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/dialog");
  revalidatePath("/pegawai/reviu");
  flashRedirect(
    `/pegawai/reviu/${reviuId}`,
    mode === "submit"
      ? { type: "success", title: "Reviu berhasil dikirim ke atasan" }
      : { type: "success", title: "Draft reviu berhasil disimpan" },
  );
}

export async function saveReviu(
  reviuId: number,
  mode: "draft" | "submit",
  input: ReviuInput,
): Promise<ReviuSaveState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: session.id } },
    select: { id: true, status: true },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan." };
  }
  if (reviu.status !== "draft_pegawai") {
    return { error: "Reviu sudah dikirim dan tidak dapat diubah." };
  }

  if (mode === "submit") {
    const validationError = validateSubmitInput(input);
    if (validationError) {
      return { error: `Lengkapi isian sebelum mengirim: ${validationError}` };
    }
  }

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        is_tercapai: Boolean(input.is_tercapai),
        is_tidak_tercapai: Boolean(input.is_tidak_tercapai),
        penjelasan_tercapai: toNullable(input.penjelasan_tercapai),
        penjelasan_tidak_tercapai: toNullable(input.penjelasan_tidak_tercapai),
        rencana_tindak_lanjut: toNullable(input.rencana_tindak_lanjut),
        tanggal_next_reviu: toNullableDate(input.tanggal_next_reviu),
        status: mode === "submit" ? "menunggu_atasan" : "draft_pegawai",
      },
    });
  } catch {
    return { error: "Gagal menyimpan reviu. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/reviu");
  revalidatePath(`/pegawai/reviu/${reviu.id}`);
  flashRedirect(
    `/pegawai/reviu/${reviu.id}`,
    mode === "submit"
      ? { type: "success", title: "Reviu berhasil dikirim ke atasan" }
      : { type: "success", title: "Draft reviu berhasil disimpan" },
  );
}

export async function deleteReviu(reviuId: number): Promise<void> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return;

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: session.id } },
    select: { id: true, status: true },
  });
  if (!reviu || reviu.status !== "draft_pegawai") return;

  await prisma.reviu.delete({ where: { id: reviu.id } });
  revalidatePath("/pegawai/reviu");
  revalidatePath("/pegawai/dialog");
  flashRedirect("/pegawai/reviu", {
    type: "success",
    title: "Reviu berhasil dihapus",
  });
}

export async function submitReviuAtasan(
  reviuId: number,
  input: { setuju: boolean; ttdDataUrl: string | null },
): Promise<ReviuSignState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }
  if (!input.ttdDataUrl) {
    return { error: "Tanda tangan wajib diisi." };
  }

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_atasan: session.id } },
    select: { id: true, status: true, dialog: { select: { id: true } } },
  });
  if (!reviu) {
    return { error: "Reviu tidak ditemukan." };
  }
  if (reviu.status !== "menunggu_atasan") {
    return { error: "Reviu belum siap untuk direviu atasan." };
  }

  let ttdUrl: string;
  try {
    ttdUrl = await saveTtdFile(input.ttdDataUrl, reviu.dialog.id, "atasan");
  } catch {
    return { error: "Tanda tangan gagal disimpan. Silakan coba lagi." };
  }

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        is_valid_atasan: true,
        ttd_atasan_path: ttdUrl,
        waktu_validasi_atasan: new Date(),
        status: "menunggu_validasi",
      },
    });
  } catch {
    return { error: "Gagal menyimpan tanda tangan. Silakan coba lagi." };
  }

  revalidatePath(`/atasan/dialog/${reviu.dialog.id}`);
  revalidatePath("/atasan/dashboard");
  revalidatePath("/atasan/reviu");
  revalidatePath(`/atasan/reviu/${reviu.id}`);
  revalidatePath(`/pegawai/reviu/${reviu.id}`);
  return {};
}

export async function validateReviu(
  reviuId: number,
  input: { setuju: boolean; ttdDataUrl: string | null },
): Promise<ReviuSignState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }
  if (!input.ttdDataUrl) {
    return { error: "Tanda tangan wajib diisi." };
  }

  const reviu = await prisma.reviu.findFirst({
    where: { id: reviuId, dialog: { id_pegawai: session.id } },
    select: {
      id: true,
      status: true,
      is_valid_pegawai: true,
      dialog: { select: { id: true } },
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

  let ttdUrl: string;
  try {
    ttdUrl = await saveTtdFile(input.ttdDataUrl, reviu.dialog.id, "pegawai");
  } catch {
    return { error: "Tanda tangan gagal disimpan. Silakan coba lagi." };
  }

  try {
    await prisma.reviu.update({
      where: { id: reviu.id },
      data: {
        is_valid_pegawai: true,
        ttd_pegawai_path: ttdUrl,
        waktu_validasi_pegawai: new Date(),
        status: "selesai",
      },
    });
  } catch {
    return { error: "Gagal menyimpan validasi. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/reviu");
  revalidatePath(`/pegawai/reviu/${reviu.id}`);
  revalidatePath("/pegawai/dashboard");
  revalidatePath("/pegawai/dialog");
  return {};
}
