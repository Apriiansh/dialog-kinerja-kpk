"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import { flashRedirect } from "@/lib/utils/flash";

export interface AdminMetodeFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

const metodeSchema = z.object({
  nama_metode: z
    .string()
    .trim()
    .min(1, "Nama metode wajib diisi.")
    .max(255, "Nama metode maksimal 255 karakter."),
  is_active: z.string().transform((v) => v === "1" || v === "true"),
});

const createSchema = metodeSchema;

const updateSchema = metodeSchema;

function toValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  values["nama_metode"] = String(formData.get("nama_metode") ?? "");
  values["is_active"] = String(formData.get("is_active") ?? "");
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

async function isDuplicateMetodeName(
  nama: string,
  excludeId?: number,
): Promise<boolean> {
  const normalized = nama.toLowerCase();
  const all = await prisma.masterMetodePengembangan.findMany({
    select: { id: true, nama_metode: true },
  });
  return all.some(
    (m) => m.id !== excludeId && m.nama_metode.toLowerCase() === normalized,
  );
}

export async function createMetode(
  _prev: AdminMetodeFormState,
  formData: FormData,
): Promise<AdminMetodeFormState> {
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

  if (await isDuplicateMetodeName(data.nama_metode)) {
    return { error: "Metode pengembangan dengan nama tersebut sudah ada.", values };
  }

  try {
    await prisma.masterMetodePengembangan.create({
      data: {
        nama_metode: data.nama_metode,
        is_active: data.is_active,
      },
    });
  } catch {
    return { error: "Gagal menyimpan metode. Silakan coba lagi.", values };
  }

  revalidatePath("/admin/metode");
  flashRedirect("/admin/metode", {
    type: "success",
    title: "Metode pengembangan berhasil ditambahkan",
  });
}

export async function updateMetode(
  id: number,
  _prev: AdminMetodeFormState,
  formData: FormData,
): Promise<AdminMetodeFormState> {
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

  const existing = await prisma.masterMetodePengembangan.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Metode tidak ditemukan." };

  if (await isDuplicateMetodeName(data.nama_metode, id)) {
    return { error: "Metode pengembangan dengan nama tersebut sudah ada.", values };
  }

  try {
    await prisma.masterMetodePengembangan.update({
      where: { id },
      data: {
        nama_metode: data.nama_metode,
        is_active: data.is_active,
      },
    });
  } catch {
    return { error: "Gagal memperbarui metode. Silakan coba lagi.", values };
  }

  revalidatePath("/admin/metode");
  revalidatePath(`/admin/metode/${id}/edit`);
  flashRedirect("/admin/metode", {
    type: "success",
    title: "Metode pengembangan berhasil diperbarui",
  });
}

export interface AdminMetodeStatusState {
  error?: string;
}

export async function setMetodeStatus(
  id: number,
  isActive: boolean,
): Promise<AdminMetodeStatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const existing = await prisma.masterMetodePengembangan.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Metode tidak ditemukan." };

  await prisma.masterMetodePengembangan.update({
    where: { id },
    data: { is_active: isActive },
  });
  revalidatePath("/admin/metode");
  return {};
}

export async function deleteMetode(
  id: number,
): Promise<AdminMetodeStatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const existing = await prisma.masterMetodePengembangan.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Metode tidak ditemukan." };

  try {
    await prisma.masterMetodePengembangan.delete({ where: { id } });
  } catch {
    return { error: "Gagal menghapus metode. Silakan coba lagi." };
  }

  revalidatePath("/admin/metode");
  return {};
}