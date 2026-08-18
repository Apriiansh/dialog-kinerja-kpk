"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import { isDurasiText } from "@/lib/utils/format";
import { flashRedirect } from "@/lib/utils/flash";

export interface AdminUserFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

const userSchema = z
  .object({
    npp: z.string().regex(/^\d{7}$/, "NPP harus terdiri dari 7 digit angka."),
    nip: z
      .string()
      .trim()
      .regex(/^\d{0,18}$/, "NIP maksimal 18 digit angka.")
      .optional()
      .transform((v) => (v ? v : undefined)),
    nama_pegawai: z.string().trim().min(1, "Nama pegawai wajib diisi."),
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
    default_role: z.enum(["ADMIN", "ATASAN", "PEGAWAI"]),
    is_admin: z
      .string()
      .transform((v) => v === "1" || v === "true"),
    as_pegawai: z
      .string()
      .transform((v) => v === "1" || v === "true"),
    id_atasan: z
      .string()
      .optional()
      .transform((v) => (v && v !== "" ? Number(v) : undefined)),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_admin && data.id_atasan !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id_atasan"],
        message: "Pengguna admin tidak memiliki atasan.",
      });
    }
  });

const createSchema = userSchema.superRefine((data, ctx) => {
  if (!data.password || data.password.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Kata sandi minimal 6 karakter.",
    });
  }
});

const updateSchema = userSchema;

function toValues(formData: FormData): Record<string, string> {
  const keys = [
    "npp",
    "nip",
    "nama_pegawai",
    "tanggal_bergabung",
    "nama_jabatan",
    "unit_kerja",
    "masa_kerja_unit_terakhir",
    "default_role",
    "is_admin",
    "as_pegawai",
    "id_atasan",
    "password",
  ];
  const values: Record<string, string> = {};
  for (const key of keys) {
    values[key] = String(formData.get(key) ?? "");
  }
  return values;
}

function fieldErrorMap(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

async function hasActiveCycles(
  userId: number,
  proposedAtasanId: number | undefined,
): Promise<boolean> {
  if (proposedAtasanId === undefined) return false;
  if (proposedAtasanId === userId) return true;
  const visited = new Set<number>([userId]);
  let current: number | null = proposedAtasanId;
  while (current !== null) {
    if (visited.has(current)) return true;
    visited.add(current);
    const atasan: { id_atasan: number | null } | null =
      await prisma.user.findUnique({
        where: { id: current },
        select: { id_atasan: true },
      });
    if (!atasan || atasan.id_atasan === null) break;
    current = atasan.id_atasan;
  }
  return false;
}

export async function createAdminUser(
  _prev: AdminUserFormState,
  formData: FormData,
): Promise<AdminUserFormState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const values = toValues(formData);
  const parsed = createSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian form.",
      fieldErrors: fieldErrorMap(parsed.error.issues),
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
        password: await bcrypt.hash(data.password!, 10),
        default_role: data.default_role,
        is_admin: data.is_admin,
        as_pegawai: data.as_pegawai,
        is_active: true,
        id_atasan: data.is_admin ? null : data.id_atasan,
      },
    });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return { error: "NPP atau NIP sudah terdaftar.", values };
    }
    return { error: "Gagal menyimpan pengguna. Silakan coba lagi.", values };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  flashRedirect("/admin/users", {
    type: "success",
    title: "Pengguna baru berhasil ditambahkan",
  });
}

export async function updateAdminUser(
  id: number,
  _prev: AdminUserFormState,
  formData: FormData,
): Promise<AdminUserFormState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const values = toValues(formData);
  const parsed = updateSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian form.",
      fieldErrors: fieldErrorMap(parsed.error.issues),
      values,
    };
  }

  const data = parsed.data;
  const tanggal = data.tanggal_bergabung
    ? new Date(data.tanggal_bergabung)
    : null;

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Pengguna tidak ditemukan." };

  if (id === session.id && !data.is_admin) {
    return {
      error: "Tidak dapat menghapus peran admin pada akun sendiri.",
      values,
    };
  }

  const proposedAtasan = data.is_admin ? null : data.id_atasan;
  if (
    data.id_atasan !== undefined &&
    (await hasActiveCycles(id, data.id_atasan))
  ) {
    return {
      error: "Atasan yang dipilih membentuk siklus hierarki.",
      values,
    };
  }

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
        default_role: data.default_role,
        is_admin: data.is_admin,
        as_pegawai: data.as_pegawai,
        id_atasan: proposedAtasan,
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
      return { error: "NPP atau NIP sudah terdaftar.", values };
    }
    return { error: "Gagal memperbarui pengguna. Silakan coba lagi.", values };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}/edit`);
  flashRedirect("/admin/users", {
    type: "success",
    title: "Data pengguna berhasil diperbarui",
  });
}

export interface AdminUserStatusState {
  error?: string;
}

export async function setUserStatus(
  id: number,
  isActive: boolean,
): Promise<AdminUserStatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  if (id === session.id) {
    return { error: "Tidak bisa menonaktifkan akun sendiri." };
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Pengguna tidak ditemukan." };

  await prisma.user.update({ where: { id }, data: { is_active: isActive } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return {};
}

export async function resetPassword(
  id: number,
  newPassword: string,
): Promise<AdminUserStatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Pengguna tidak ditemukan." };

  if (!newPassword || newPassword.length < 6) {
    return { error: "Kata sandi baru minimal 6 karakter." };
  }

  await prisma.user.update({
    where: { id },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
  revalidatePath("/admin/users");
  return {};
}

export async function deleteAdminUser(
  id: number,
): Promise<AdminUserStatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  if (id === session.id) {
    return { error: "Tidak dapat menghapus akun sendiri." };
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, is_active: true },
  });
  if (!existing) return { error: "Pengguna tidak ditemukan." };
  if (existing.is_active) {
    return {
      error: "Nonaktifkan pengguna terlebih dahulu sebelum menghapus.",
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
          "Tidak dapat menghapus karena pengguna masih terhubung dengan data lain (mis. dialog kinerja).",
      };
    }
    return { error: "Gagal menghapus pengguna. Silakan coba lagi." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return {};
}