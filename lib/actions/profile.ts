"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, capabilitiesForUser, type Role } from "@/lib/session";
import { isDurasiText, parseDateInput, formatDurasiKeHariIni } from "@/lib/format";

export interface ChangePasswordState {
  error?: string;
  fieldErrors?: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  success?: boolean;
  message?: string;
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    newPassword: z
      .string()
      .min(6, "Kata sandi baru minimal harus terdiri dari 6 karakter."),
    confirmPassword: z
      .string()
      .min(1, "Konfirmasi kata sandi baru wajib diisi."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok dengan kata sandi baru.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await requireAuth();

  const raw = {
    currentPassword: (formData.get("currentPassword") as string) ?? "",
    newPassword: (formData.get("newPassword") as string) ?? "",
    confirmPassword: (formData.get("confirmPassword") as string) ?? "",
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ChangePasswordState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NonNullable<
        ChangePasswordState["fieldErrors"]
      >;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, password: true },
  });

  if (!user) {
    return { error: "Pengguna tidak ditemukan dalam sistem." };
  }

  const isPasswordValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.password,
  );

  if (!isPasswordValid) {
    return {
      fieldErrors: {
        currentPassword: "Kata sandi saat ini yang Anda masukkan tidak sesuai.",
      },
    };
  }

  const isSamePassword = await bcrypt.compare(
    parsed.data.newPassword,
    user.password,
  );

  if (isSamePassword) {
    return {
      fieldErrors: {
        newPassword:
          "Kata sandi baru tidak boleh sama dengan kata sandi saat ini.",
      },
    };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.user.update({
    where: { id: session.id },
    data: { password: hashedPassword },
  });

  revalidatePath("/pegawai/profil");
  revalidatePath("/atasan/profil");
  revalidatePath("/admin/profil");

  return {
    success: true,
    message: "Kata sandi Anda berhasil diperbarui dengan aman.",
  };
}

export interface UpdateProfileState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  message?: string;
}

const updateProfileSchema = z.object({
  nama_pegawai: z.string().trim().min(1, "Nama pegawai wajib diisi."),
  nip: z
    .string()
    .trim()
    .regex(/^\d{0,18}$/, "NIP maksimal 18 digit angka.")
    .optional()
    .transform((v) => (v ? v : null)),
  nama_jabatan: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  unit_kerja: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  tanggal_bergabung: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  masa_kerja_unit_terakhir: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function updateUserProfileDataAction(
  prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await requireAuth();

  const masaKerjaInput = (formData.get("masa_kerja_unit_terakhir") as string) ?? "";
  let masaKerjaFinal: string | null = masaKerjaInput ? masaKerjaInput.trim() : null;

  // If a date was provided for masa kerja, convert to readable duration
  const masaKerjaDate = parseDateInput(masaKerjaInput);
  if (masaKerjaDate) {
    masaKerjaFinal = formatDurasiKeHariIni(masaKerjaDate);
  }

  const raw = {
    nama_pegawai: (formData.get("nama_pegawai") as string) ?? "",
    nip: (formData.get("nip") as string) ?? "",
    nama_jabatan: (formData.get("nama_jabatan") as string) ?? "",
    unit_kerja: (formData.get("unit_kerja") as string) ?? "",
    tanggal_bergabung: (formData.get("tanggal_bergabung") as string) ?? "",
    masa_kerja_unit_terakhir: masaKerjaFinal,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  // Check NIP uniqueness if modified
  if (parsed.data.nip) {
    const existingNip = await prisma.user.findFirst({
      where: {
        nip: parsed.data.nip,
        id: { not: session.id },
      },
    });
    if (existingNip) {
      return {
        fieldErrors: {
          nip: "NIP tersebut sudah digunakan oleh pegawai lain.",
        },
      };
    }
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      nama_pegawai: parsed.data.nama_pegawai,
      nip: parsed.data.nip,
      nama_jabatan: parsed.data.nama_jabatan,
      unit_kerja: parsed.data.unit_kerja,
      tanggal_bergabung: parsed.data.tanggal_bergabung,
      masa_kerja_unit_terakhir: parsed.data.masa_kerja_unit_terakhir,
    },
  });

  // Update session nama in iron-session cookie
  session.nama = parsed.data.nama_pegawai;
  await session.save();

  revalidatePath("/", "layout");
  revalidatePath("/pegawai/profil");
  revalidatePath("/atasan/profil");
  revalidatePath("/admin/profil");

  return {
    success: true,
    message: "Data profil kepegawaian Anda berhasil diperbarui.",
  };
}

export interface ProfilePreferencesState {
  error?: string;
  success?: boolean;
  message?: string;
}

export async function updateProfilePreferencesAction(
  prevState: ProfilePreferencesState,
  formData: FormData,
): Promise<ProfilePreferencesState> {
  const session = await requireAuth();

  const defaultRole = formData.get("default_role") as Role;

  if (!defaultRole || !["ADMIN", "ATASAN", "PEGAWAI"].includes(defaultRole)) {
    return { error: "Pilihan peran default tidak valid." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, is_admin: true, as_pegawai: true },
  });

  if (!user) {
    return { error: "Pengguna tidak ditemukan." };
  }

  const allowedRoles = capabilitiesForUser(user);
  if (!allowedRoles.includes(defaultRole)) {
    return {
      error: `Anda tidak memiliki hak akses untuk menetapkan peran ${defaultRole}.`,
    };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { default_role: defaultRole },
  });

  revalidatePath("/pegawai/profil");
  revalidatePath("/atasan/profil");
  revalidatePath("/admin/profil");

  return {
    success: true,
    message: `Preferensi peran utama saat login berhasil diubah menjadi ${defaultRole}.`,
  };
}
