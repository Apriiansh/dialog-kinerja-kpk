"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { saveTtdFile } from "@/lib/ttd";
import { canValidateDialog } from "@/lib/dialog-queries";
import type { JenisAspek } from "@/generated/prisma/enums";

export interface AspekItemInput {
  id?: number;
  dialog_evaluasi?: string;
  kompetensi_dikembangkan?: string;
  id_metode_pengembangan?: number | null;
  metode_pengembangan_lainnya?: string;
  waktu_pelaksanaan?: string | null;
}

export interface AspekInput {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai?: string;
  items: AspekItemInput[];
}

export interface SaveDialogState {
  error?: string;
}

export interface ValidateDialogState {
  error?: string;
}

const VALID_JENIS: JenisAspek[] = [
  "SKP",
  "GAP_ASESMEN",
  "PERILAKU",
  "KARIR_PENDEK",
  "KARIR_MENENGAH",
];

function toNullable(value: string | undefined) {
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

function isEmptyItem(item: AspekItemInput) {
  return (
    !item.dialog_evaluasi?.trim() &&
    !item.kompetensi_dikembangkan?.trim() &&
    !item.id_metode_pengembangan &&
    !item.metode_pengembangan_lainnya?.trim() &&
    !item.waktu_pelaksanaan
  );
}

const ASPEK_SECTION_LABEL: Record<JenisAspek, string> = {
  SKP: "Bagian A (SKP)",
  GAP_ASESMEN: "Bagian B (Gap Asesmen)",
  PERILAKU: "Bagian C (Perilaku)",
  KARIR_PENDEK: "Bagian D.1 (Karir Jangka Pendek)",
  KARIR_MENENGAH: "Bagian D.2 (Karir Jangka Menengah)",
};

function isAspekItemComplete(
  item: AspekItemInput,
  isLainnya: (id: number | null) => boolean,
) {
  if (
    !item.dialog_evaluasi?.trim() ||
    !item.kompetensi_dikembangkan?.trim() ||
    !item.id_metode_pengembangan ||
    !item.waktu_pelaksanaan?.trim()
  ) {
    return false;
  }
  if (
    isLainnya(item.id_metode_pengembangan ?? null) &&
    !item.metode_pengembangan_lainnya?.trim()
  ) {
    return false;
  }
  return true;
}

async function validateSubmitInput(aspekInput: AspekInput[]): Promise<string | null> {
  const metodeList = await prisma.masterMetodePengembangan.findMany({
    select: { id: true, nama_metode: true },
  });
  const metodeNames = new Map(metodeList.map((m) => [m.id, m.nama_metode]));
  const isLainnya = (id: number | null) => {
    if (!id) return false;
    const name = metodeNames.get(id);
    return name ? name.toLowerCase().includes("lainnya") : false;
  };

  const problems: string[] = [];
  for (const aspek of aspekInput) {
    const label = ASPEK_SECTION_LABEL[aspek.jenis_aspek] ?? aspek.jenis_aspek;
    const nonEmptyItems = (aspek.items ?? []).filter(
      (item) => !isEmptyItem(item),
    );
    if (nonEmptyItems.length === 0) {
      problems.push(`${label} belum memiliki rincian`);
      continue;
    }
    if (
      nonEmptyItems.some((item) => !isAspekItemComplete(item, isLainnya))
    ) {
      problems.push(`${label} terdapat rincian yang belum lengkap`);
    }
    if (!aspek.tanggung_jawab_pegawai?.trim()) {
      problems.push(`${label} tanggung jawab pegawai wajib diisi`);
    }
  }
  return problems.length > 0 ? problems.join("; ") : null;
}

export async function saveDialogForm(
  dialogId: number,
  mode: "draft" | "submit",
  aspekInput: AspekInput[],
): Promise<SaveDialogState> {
  const session = await requireRole("PEGAWAI");

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id },
    select: { id: true, status: true },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan." };
  }
  if (dialog.status !== "menunggu_pegawai") {
    return { error: "Dialog sudah dikirim dan tidak dapat diubah." };
  }

  for (const aspek of aspekInput) {
    if (!VALID_JENIS.includes(aspek.jenis_aspek)) {
      return { error: "Jenis aspek tidak valid." };
    }
  }

  if (mode === "submit") {
    const validationError = await validateSubmitInput(aspekInput);
    if (validationError) {
      return {
        error: `Lengkapi isian sebelum mengirim ke atasan: ${validationError}`,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const aspek of aspekInput) {
        const savedAspek = await tx.dialogKinerjaAspek.upsert({
          where: {
            id_dialog_jenis_aspek: {
              id_dialog: dialog.id,
              jenis_aspek: aspek.jenis_aspek,
            },
          },
          update: {
            tanggung_jawab_pegawai: toNullable(aspek.tanggung_jawab_pegawai),
          },
          create: {
            id_dialog: dialog.id,
            jenis_aspek: aspek.jenis_aspek,
            tanggung_jawab_pegawai: toNullable(aspek.tanggung_jawab_pegawai),
          },
        });

        const existing = await tx.dialogKinerjaItem.findMany({
          where: { id_aspek: savedAspek.id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((item) => item.id));
        const keepIds = new Set<number>();

        for (const item of aspek.items) {
          if (isEmptyItem(item)) continue;

          const data = {
            dialog_evaluasi: toNullable(item.dialog_evaluasi),
            kompetensi_dikembangkan: toNullable(item.kompetensi_dikembangkan),
            id_metode_pengembangan: item.id_metode_pengembangan ?? null,
            metode_pengembangan_lainnya: toNullable(
              item.metode_pengembangan_lainnya,
            ),
            waktu_pelaksanaan: toNullableDate(item.waktu_pelaksanaan),
          };

          if (item.id && existingIds.has(item.id)) {
            keepIds.add(item.id);
            await tx.dialogKinerjaItem.update({ where: { id: item.id }, data });
          } else {
            await tx.dialogKinerjaItem.create({
              data: { id_aspek: savedAspek.id, ...data },
            });
          }
        }

        const idsToDelete = existing
          .filter((item) => !keepIds.has(item.id))
          .map((item) => item.id);
        if (idsToDelete.length > 0) {
          await tx.dialogKinerjaItem.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
      }

      if (mode === "submit") {
        await tx.dialogKinerja.update({
          where: { id: dialog.id },
          data: { status: "menunggu_atasan" },
        });
      }
    });
  } catch {
    return { error: "Gagal menyimpan dialog. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/dashboard");
  revalidatePath(`/pegawai/dialog/${dialog.id}`);

  if (mode === "submit") {
    redirect(`/pegawai/dialog/${dialog.id}`);
  }

  return {};
}

export async function validateDialog(
  dialogId: number,
  input: { setuju: boolean; ttdDataUrl: string | null },
): Promise<ValidateDialogState> {
  const session = await requireRole("PEGAWAI");

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }
  if (!input.ttdDataUrl) {
    return { error: "Tanda tangan wajib diisi." };
  }

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id },
    select: {
      id: true,
      status: true,
      is_valid_pegawai: true,
      is_valid_atasan: true,
    },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan." };
  }
  if (!canValidateDialog(dialog.status)) {
    return { error: "Dialog belum siap untuk divalidasi." };
  }
  if (dialog.is_valid_pegawai) {
    return { error: "Anda sudah melakukan validasi." };
  }

  let ttdUrl: string;
  try {
    ttdUrl = await saveTtdFile(input.ttdDataUrl, dialog.id, "pegawai");
  } catch {
    return { error: "Tanda tangan gagal disimpan. Silakan coba lagi." };
  }

  try {
    await prisma.dialogKinerja.update({
      where: { id: dialog.id },
      data: {
        is_valid_pegawai: true,
        ttd_pegawai_path: ttdUrl,
        waktu_validasi_pegawai: new Date(),
        status: dialog.is_valid_atasan ? "selesai" : "menunggu_validasi",
      },
    });
  } catch {
    return { error: "Gagal menyimpan validasi. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/dashboard");
  revalidatePath(`/pegawai/dialog/${dialog.id}`);
  return {};
}
