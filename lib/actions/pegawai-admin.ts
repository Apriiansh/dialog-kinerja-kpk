"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import { isDurasiText } from "@/lib/utils/format";
import { flashRedirect } from "@/lib/utils/flash";

export interface PegawaiFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

const profileSchema = z.object({
  npp: z.string().regex(/^\d{7}$/, "NPP harus terdiri dari 7 digit angka."),
  nip: z
    .string()
    .trim()
    .regex(/^\d{0,18}$/, "NIP maksimal 18 digit angka.")
    .optional()
    .transform((v) => (v ? v : undefined)),
  nama_pegawai: z
    .string()
    .trim()
    .min(1, "Nama pegawai wajib diisi."),
  tanggal_bergabung: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
  nama_jabatan: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  unit_kerja: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  masa_kerja_unit_terakhir: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => (v ? isDurasiText(v) : true), {
      message:
        "Format Masa Kerja tidak valid (contoh: 3 Tahun 4 Bulan 12 Hari).",
    }),
});

const createSchema = profileSchema.extend({
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter."),
});

const updateSchema = profileSchema.extend({
  password: z.string().optional(),
});

function toValues(formData: FormData): Record<string, string> {
  const keys = [
    "npp",
    "nip",
    "nama_pegawai",
    "tanggal_bergabung",
    "nama_jabatan",
    "unit_kerja",
    "masa_kerja_unit_terakhir",
    "password",
  ];
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = String(formData.get(key) ?? "");
    if (value) values[key] = value;
  }
  return values;
}

export async function createPegawai(
  _prev: PegawaiFormState,
  formData: FormData,
): Promise<PegawaiFormState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const values = toValues(formData);
  const parsed = createSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian form.",
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(
          ([key, messages]) => [key, messages?.[0] ?? "Isian tidak valid."],
        ),
      ),
      values,
    };
  }

  const data = parsed.data;
  const tanggal = data.tanggal_bergabung
    ? new Date(data.tanggal_bergabung)
    : null;

  try {
    await prisma.user.create({
      data: {
        npp: data.npp,
        nip: data.nip,
        nama_pegawai: data.nama_pegawai,
        tanggal_bergabung: tanggal,
        nama_jabatan: data.nama_jabatan,
        unit_kerja: data.unit_kerja,
        masa_kerja_unit_terakhir: data.masa_kerja_unit_terakhir,
        password: await bcrypt.hash(data.password, 10),
        default_role: "PEGAWAI",
        as_pegawai: true,
        is_admin: false,
        is_active: true,
        id_atasan: session.id,
      },
    });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return {
        error: "NPP atau NIP sudah terdaftar.",
        values,
      };
    }
    return { error: "Gagal menyimpan pegawai. Silakan coba lagi.", values };
  }

  revalidatePath("/atasan/pegawai");
  revalidatePath("/atasan/dashboard");
  flashRedirect("/atasan/pegawai", {
    type: "success",
    title: "Pegawai baru berhasil ditambahkan",
  });
}

export async function updatePegawai(
  id: number,
  _prev: PegawaiFormState,
  formData: FormData,
): Promise<PegawaiFormState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const target = await prisma.user.findFirst({
    where: { id, id_atasan: session.id },
    select: { id: true },
  });
  if (!target) return { error: "Pegawai tidak ditemukan atau bukan bawahan Anda." };

  const values = toValues(formData);
  const parsed = updateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian form.",
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(
          ([key, messages]) => [key, messages?.[0] ?? "Isian tidak valid."],
        ),
      ),
      values,
    };
  }

  const data = parsed.data;
  const tanggal = data.tanggal_bergabung
    ? new Date(data.tanggal_bergabung)
    : null;

  try {
    await prisma.user.update({
      where: { id },
      data: {
        npp: data.npp,
        nip: data.nip,
        nama_pegawai: data.nama_pegawai,
        tanggal_bergabung: tanggal,
        nama_jabatan: data.nama_jabatan,
        unit_kerja: data.unit_kerja,
        masa_kerja_unit_terakhir: data.masa_kerja_unit_terakhir,
        ...(data.password
          ? { password: await bcrypt.hash(data.password, 10) }
          : {}),
      },
    });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return {
        error: "NPP atau NIP sudah terdaftar.",
        values,
      };
    }
    return { error: "Gagal memperbarui pegawai. Silakan coba lagi.", values };
  }

  revalidatePath("/atasan/pegawai");
  revalidatePath(`/atasan/pegawai/${id}/edit`);
  flashRedirect("/atasan/pegawai", {
    type: "success",
    title: "Data pegawai berhasil diperbarui",
  });
}

export interface PegawaiStatusState {
  error?: string;
}

export async function nonaktifkanPegawai(
  id: number,
): Promise<PegawaiStatusState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  if (id === session.id) {
    return { error: "Tidak bisa menonaktifkan diri sendiri." };
  }

  const target = await prisma.user.findFirst({
    where: { id, id_atasan: session.id },
    select: { id: true },
  });
  if (!target) {
    return { error: "Bukan bawahan langsung Anda." };
  }

  const bawahanAktif = await prisma.user.count({
    where: { id_atasan: id, is_active: true },
  });
  if (bawahanAktif > 0) {
    return {
      error:
        "Pegawai ini masih punya bawahan aktif. Hubungi Admin untuk memindahkan bawahannya dulu.",
    };
  }

  await prisma.user.update({ where: { id }, data: { is_active: false } });
  revalidatePath("/atasan/pegawai");
  revalidatePath("/atasan/dashboard");
  return {};
}

export async function aktifkanPegawai(id: number): Promise<PegawaiStatusState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const target = await prisma.user.findFirst({
    where: { id, id_atasan: session.id },
    select: { id: true },
  });
  if (!target) {
    return { error: "Bukan bawahan langsung Anda." };
  }

  await prisma.user.update({ where: { id }, data: { is_active: true } });
  revalidatePath("/atasan/pegawai");
  revalidatePath("/atasan/dashboard");
  return {};
}

export async function deletePegawai(id: number): Promise<PegawaiStatusState> {
  const session = await requireRole("ATASAN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  if (id === session.id) {
    return { error: "Tidak dapat menghapus diri sendiri." };
  }

  const target = await prisma.user.findFirst({
    where: { id, id_atasan: session.id },
    select: { id: true, is_active: true },
  });
  if (!target) {
    return { error: "Bukan bawahan langsung Anda." };
  }
  if (target.is_active) {
    return {
      error: "Nonaktifkan pegawai terlebih dahulu sebelum menghapus.",
    };
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2003"
    ) {
      return {
        error:
          "Tidak dapat menghapus karena pegawai masih terhubung dengan data lain (mis. dialog kinerja).",
      };
    }
    return { error: "Gagal menghapus pegawai. Silakan coba lagi." };
  }

  revalidatePath("/atasan/pegawai");
  revalidatePath("/atasan/dashboard");
  return {};
}