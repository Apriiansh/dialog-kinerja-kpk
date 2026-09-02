"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import { canValidateDialog } from "@/lib/queries/dialog";
import { flashRedirect } from "@/lib/utils/flash";
import { createNotification } from "@/lib/notifications";
import { publishDialogUpdate } from "@/lib/realtime/bus";
import {
  formatPeriode,
  getTriwulanFromDate,
  triwulanLabel,
} from "@/lib/constants/triwulan";
import type { JenisAspek } from "@/generated/prisma/enums";
import { sendDialogSubmissionEmail } from "@/lib/dialog-email";
import { dateInputFromDaysFromNow } from "@/lib/utils/format";
import { isDialogExpired } from "@/lib/utils/dialog-deadline";

export interface AspekItemInput {
  id?: string;
  dialog_evaluasi?: string;
  kompetensi_dikembangkan?: string;
  id_metode_pengembangan?: number | null;
  metode_pengembangan_lainnya?: string;
  waktu_pelaksanaan?: string | null;
}

export interface AspekInput {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai?: string;
  tanggung_jawab_atasan?: string;
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
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
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

async function validateSubmitInput(
  aspekInput: AspekInput[],
  isLanjutan: boolean,
): Promise<string | null> {
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
      if (isLanjutan) {
        // if (!aspek.tanggung_jawab_pegawai?.trim()) {
        //   problems.push(`${label} tanggung jawab pegawai wajib diisi`);
        // }
        continue;
      }
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
  dialogId: string,
  mode: "draft" | "submit",
  aspekInput: AspekInput[],
  deskripsiPegawai?: string,
): Promise<SaveDialogState> {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id },
    select: {
      id: true,
      status: true,
      id_dialog_induk: true,
      id_atasan: true,
      jadwal_dialog: true,
      atasan: {
        select: { nama_pegawai: true, email: true },
      },
      pegawai: {
        select: { nama_pegawai: true },
      },
      periode_tahun: true,
      triwulan: true,
    },
  });
  if (!dialog) {
    return { error: "Dialog tidak ditemukan." };
  }
  if (dialog.status !== "menunggu_pegawai" && dialog.status !== "revisi_evaluasi") {
    return { error: "Dialog sudah dikirim dan tidak dapat diubah." };
  }

  // Check H+7 expiry (7 days after jadwal_dialog) - server-side enforcement
  if (isDialogExpired(dialog.jadwal_dialog)) {
    return { error: "Waktu pengisian dialog telah berakhir (maksimal 7 hari setelah jadwal dialog)." };
  }

  for (const aspek of aspekInput) {
    if (!VALID_JENIS.includes(aspek.jenis_aspek)) {
      return { error: "Jenis aspek tidak valid." };
    }
  }

  if (mode === "submit") {
    const validationError = await validateSubmitInput(
      aspekInput,
      dialog.id_dialog_induk !== null,
    );
    if (validationError) {
      return {
        error: `Lengkapi isian sebelum mengirim ke atasan: ${validationError}`,
      };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update deskripsi_pegawai if provided
      if (deskripsiPegawai !== undefined) {
        await tx.dialogKinerja.update({
          where: { id: dialog.id },
          data: { deskripsi_pegawai: toNullable(deskripsiPegawai) },
        });
      }

      for (const aspek of aspekInput) {
        const updateData: {
          tanggung_jawab_pegawai?: string | null;
          tanggung_jawab_atasan?: string | null;
        } = {
          tanggung_jawab_pegawai: toNullable(aspek.tanggung_jawab_pegawai),
        };
        if (aspek.tanggung_jawab_atasan !== undefined) {
          updateData.tanggung_jawab_atasan = toNullable(aspek.tanggung_jawab_atasan);
        }

        const savedAspek = await tx.dialogKinerjaAspek.upsert({
          where: {
            id_dialog_jenis_aspek: {
              id_dialog: dialog.id,
              jenis_aspek: aspek.jenis_aspek,
            },
          },
          update: updateData,
          create: {
            id_dialog: dialog.id,
            jenis_aspek: aspek.jenis_aspek,
            tanggung_jawab_pegawai: toNullable(aspek.tanggung_jawab_pegawai),
            tanggung_jawab_atasan: toNullable(aspek.tanggung_jawab_atasan),
          },
        });

        const existing = await tx.dialogKinerjaItem.findMany({
          where: { id_aspek: savedAspek.id },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((item) => item.id));
        const keepIds = new Set<string>();

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
          data: { status: "menunggu_atasan", alasan_tolak: null },
        });
      }
    });
  } catch {
    return { error: "Gagal menyimpan dialog. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/dashboard");
  revalidatePath(`/pegawai/dialog/${dialog.id}`);

  publishDialogUpdate(dialog.id, {
    kind: mode === "submit" ? "status" : "aspek_pegawai",
    byUserId: session.id,
  });

  if (mode === "submit") {
    if (dialog.atasan.email) {
      const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const link = new URL(`/atasan/dialog/${dialog.id}`, baseUrl).toString();
      await sendDialogSubmissionEmail({
        to: dialog.atasan.email,
        atasanName: dialog.atasan.nama_pegawai,
        pegawaiName: dialog.pegawai.nama_pegawai,
        periode: formatPeriode(dialog.triwulan, dialog.periode_tahun),
        link,
      }).catch((err) => {
        console.error("Gagal kirim email pengajuan dialog ke atasan:", err);
      });
    }

    await createNotification({
      userId: dialog.id_atasan,
      type: "dialog_status",
      title: "Dialog Kinerja Perlu Review",
      description: `Dialog kinerja tahun ${dialog.periode_tahun} (${dialog.triwulan}) telah dikirim oleh pegawai dan menunggu review Anda.`,
      link: `/atasan/dialog/${dialog.id}`,
    });

    flashRedirect(`/pegawai/dialog/${dialog.id}`, {
      type: "success",
      title: "Dialog kinerja berhasil dikirim ke atasan",
    });
  }

  return {};
}

export async function validateDialog(
  dialogId: string,
  input: { setuju: boolean },
): Promise<ValidateDialogState> {
  const session = await requireRole("PEGAWAI");

  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  if (!input.setuju) {
    return { error: "Centang persetujuan untuk melanjutkan." };
  }

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id },
    select: {
      id: true,
      status: true,
      is_valid_pegawai: true,
      is_valid_atasan: true,
      id_atasan: true,
      periode_tahun: true,
      triwulan: true,
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

  try {
    await prisma.dialogKinerja.update({
      where: { id: dialog.id },
      data: {
        is_valid_pegawai: true,
        waktu_validasi_pegawai: new Date(),
        status: dialog.is_valid_atasan ? "selesai" : "menunggu_validasi",
      },
    });
  } catch {
    return { error: "Gagal menyimpan validasi. Silakan coba lagi." };
  }

  if (dialog.is_valid_atasan) {
    await createNotification({
      userId: dialog.id_atasan,
      type: "dialog_status",
      title: "Dialog Kinerja Selesai",
      description: `Dialog kinerja tahun ${dialog.periode_tahun} (${dialog.triwulan}) telah divalidasi oleh pegawai dan selesai.`,
      link: `/atasan/dialog/${dialog.id}`,
    });
  }

  revalidatePath("/pegawai/dashboard");
  revalidatePath(`/pegawai/dialog/${dialog.id}`);
  return {};
}

export async function initiateDialog(input: {
  jadwal_dialog: string;
  deskripsi_pegawai?: string;
  id_dialog_induk?: string;
}) {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      id_atasan: true,
      nama_pegawai: true,
      atasan: {
        select: {
          id: true,
          nama_pegawai: true,
          email: true,
        },
      },
    },
  });
  if (!user || !user.id_atasan) {
    return { error: "Anda belum terhubung dengan Atasan. Silakan hubungi admin." };
  }

  const dateObj = toNullableDate(input.jadwal_dialog);
  if (!dateObj) {
    return { error: "Tanggal jadwal dialog tidak valid." };
  }

  const minDate = toNullableDate(dateInputFromDaysFromNow(2))!;
  if (dateObj < minDate) {
    return {
      error:
        "Jadwal dialog paling cepat 2 (dua) hari setelah hari ini. Silakan pilih tanggal lain.",
    };
  }

  const periode_tahun = dateObj.getFullYear();
  const triwulan = getTriwulanFromDate(dateObj);

  const existing = await prisma.dialogKinerja.findFirst({
    where: {
      id_pegawai: session.id,
      periode_tahun,
      triwulan,
    },
  });
  if (existing) {
    return {
      error: `Sudah terdapat Dialog Kinerja untuk ${triwulanLabel(triwulan)} ${periode_tahun}.`,
    };
  }

  let parentDialog = null;
  if (input.id_dialog_induk) {
    parentDialog = await prisma.dialogKinerja.findFirst({
      where: {
        id: input.id_dialog_induk,
        id_pegawai: session.id,
        status: "selesai",
      },
      include: {
        aspek: {
          include: {
            item: true,
          },
        },
        dialog_lanjutan: { select: { id: true } },
      },
    });

    if (!parentDialog) {
      return { error: "Dialog induk tidak ditemukan atau belum selesai." };
    }
    if (parentDialog.dialog_lanjutan.length > 0) {
      return { error: "Dialog lanjutan untuk dialog ini sudah pernah dibuat." };
    }
  }

  let newDialogId: string;
  try {
    const dialog = await prisma.$transaction(async (tx) => {
      const created = await tx.dialogKinerja.create({
        data: {
          id_pegawai: session.id,
          id_atasan: user.id_atasan!,
          periode_tahun,
          triwulan,
          jadwal_dialog: dateObj,
          deskripsi_pegawai: toNullable(input.deskripsi_pegawai),
          status: "draft",
          id_dialog_induk: parentDialog ? parentDialog.id : null,
          aspek: {
            create: VALID_JENIS.map((jenis_aspek) => {
              const parentAspek = parentDialog?.aspek.find(
                (a) => a.jenis_aspek === jenis_aspek,
              );
              const belumTercapai = (parentAspek?.item ?? []).filter(
                (item) => item.is_tercapai === false,
              );
              return {
                jenis_aspek,
                tanggung_jawab_pegawai: parentAspek?.tanggung_jawab_pegawai ?? null,
                tanggung_jawab_atasan: parentAspek?.tanggung_jawab_atasan ?? null,
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
            }),
          },
        },
      });
      return created;
    });
    newDialogId = dialog.id;
  } catch {
    return { error: "Gagal membuat pengajuan dialog. Silakan coba lagi." };
  }

  revalidatePath("/pegawai/dialog");
  revalidatePath("/pegawai/dashboard");
  revalidatePath("/atasan/dialog");

  const isLanjutan = Boolean(parentDialog);
  await createNotification({
    userId: user.id_atasan,
    type: "dialog_status",
    title: isLanjutan ? "Pengajuan Dialog Kinerja Lanjutan" : "Pengajuan Dialog Kinerja Baru",
    description: `${user.nama_pegawai} mengajukan jadwal Dialog Kinerja ${isLanjutan ? "Lanjutan " : ""}untuk ${triwulanLabel(triwulan)} ${periode_tahun}.`,
    link: `/atasan/dialog/${newDialogId}`,
  });

  if (user.atasan?.email) {
    const baseUrl =
      process.env.APP_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    const link = new URL(`/atasan/dialog/${newDialogId}`, baseUrl).toString();
    await sendDialogSubmissionEmail({
      to: user.atasan.email,
      atasanName: user.atasan.nama_pegawai,
      pegawaiName: user.nama_pegawai,
      periode: formatPeriode(triwulan, periode_tahun),
      link,
      isLanjutan,
      jadwalDialog: input.jadwal_dialog,
      deskripsiPegawai: input.deskripsi_pegawai,
    }).catch((err) => {
      console.error("Gagal kirim email pengajuan dialog ke atasan:", err);
    });
  }

  flashRedirect(`/pegawai/dialog/${newDialogId}`, {
    type: "success",
    title: isLanjutan
      ? "Pengajuan dialog lanjutan berhasil dikirim ke atasan"
      : "Pengajuan dialog berhasil dikirim ke atasan",
  });

  return {};
}

export async function updateDraftDialog(
  dialogId: string,
  input: {
    jadwal_dialog: string;
    deskripsi_pegawai?: string;
  },
) {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id, status: "draft" },
    select: {
      id: true,
      id_atasan: true,
      periode_tahun: true,
      triwulan: true,
      id_dialog_induk: true,
      pegawai: { select: { nama_pegawai: true } },
      atasan: { select: { nama_pegawai: true, email: true } },
    },
  });
  if (!dialog) {
    return { error: "Dialog draft tidak ditemukan atau sudah diproses." };
  }

  const dateObj = toNullableDate(input.jadwal_dialog);
  if (!dateObj) {
    return { error: "Tanggal jadwal dialog tidak valid." };
  }

  const minDate = toNullableDate(dateInputFromDaysFromNow(2))!;
  if (dateObj < minDate) {
    return {
      error:
        "Jadwal dialog paling cepat 2 (dua) hari setelah hari ini. Silakan pilih tanggal lain.",
    };
  }

  const newYear = dateObj.getFullYear();
  const newTw = getTriwulanFromDate(dateObj);

  if (newYear !== dialog.periode_tahun || newTw !== dialog.triwulan) {
    const existing = await prisma.dialogKinerja.findFirst({
      where: {
        id_pegawai: session.id,
        periode_tahun: newYear,
        triwulan: newTw,
        id: { not: dialogId },
      },
    });
    if (existing) {
      return {
        error: `Sudah terdapat Dialog Kinerja lain untuk ${triwulanLabel(newTw)} ${newYear}.`,
      };
    }
  }

  try {
    await prisma.dialogKinerja.update({
      where: { id: dialogId },
      data: {
        jadwal_dialog: dateObj,
        periode_tahun: newYear,
        triwulan: newTw,
        deskripsi_pegawai: toNullable(input.deskripsi_pegawai),
        alasan_tolak: null,
      },
    });
  } catch {
    return { error: "Gagal memperbarui pengajuan dialog." };
  }

  revalidatePath("/pegawai/dialog");
  revalidatePath(`/pegawai/dialog/${dialogId}`);
  revalidatePath("/pegawai/dashboard");

  await createNotification({
    userId: dialog.id_atasan,
    type: "dialog_status",
    title: "Revisi Jadwal Dialog Kinerja",
    description: `Pegawai memperbarui pengajuan jadwal Dialog Kinerja untuk ${triwulanLabel(newTw)} ${newYear}.`,
    link: `/atasan/dialog/${dialogId}`,
  });

  if (dialog.atasan?.email) {
    const baseUrl =
      process.env.APP_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    const link = new URL(`/atasan/dialog/${dialogId}`, baseUrl).toString();
    await sendDialogSubmissionEmail({
      to: dialog.atasan.email,
      atasanName: dialog.atasan.nama_pegawai,
      pegawaiName: dialog.pegawai.nama_pegawai,
      periode: formatPeriode(newTw, newYear),
      link,
      isLanjutan: Boolean(dialog.id_dialog_induk),
      jadwalDialog: input.jadwal_dialog,
      deskripsiPegawai: input.deskripsi_pegawai,
    }).catch((err) => {
      console.error("Gagal kirim email revisi dialog ke atasan:", err);
    });
  }

  return {};
}

export async function deleteDraftDialog(dialogId: string) {
  const session = await requireRole("PEGAWAI");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_pegawai: session.id, status: "draft" },
  });
  if (!dialog) {
    return { error: "Draft dialog tidak ditemukan atau sudah tidak dapat dihapus." };
  }

  try {
    await prisma.dialogKinerja.delete({
      where: { id: dialogId },
    });
  } catch {
    return { error: "Gagal menghapus draft dialog." };
  }

  revalidatePath("/pegawai/dialog");
  revalidatePath("/pegawai/dashboard");

  flashRedirect("/pegawai/dialog", {
    type: "info",
    title: "Draft dialog berhasil dihapus",
  });
  return {};
}
