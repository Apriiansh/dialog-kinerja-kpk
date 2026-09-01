"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { requireRole } from "../auth/session";
import { assertActiveActor } from "../auth/guards";
import { flashRedirect } from "../utils";

export interface AdminUnitFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

const unitSchema = z.object({
  nama_unit: z.string().trim().min(1, "Nama Unit Wajib").max(255),
  jenis: z.string().trim().max(100).optional().or(z.literal("")),
  kepala_jabatan: z.string().trim().max(150).optional().or(z.literal("")),
  parent_id: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null)),
  is_active: z.string().transform((v) => v === "1" || v === "true"),
});

const toValues = (formData: FormData) => ({
  nama_unit: String(formData.get("nama_unit")),
  jenis: String(formData.get("jenis") ?? ""),
  kepala_jabatan: String(formData.get("kepala_jabatan") ?? ""),
  parent_id: String(formData.get("parent_id") ?? ""),
  is_active: String(formData.get("is_active") ?? ""),
});

function fieldErrorMap(issues: { path: PropertyKey[]; message: string }[]) {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

async function levelOf(parentId: number | null): Promise<number> {
  if (!parentId) return 1;
  const p = await prisma.unitKerja.findUnique({ where: { id: parentId } });
  return p ? p.level + 1 : 1;
}

export async function createUnit(
  _prev: AdminUnitFormState,
  formData: FormData,
): Promise<AdminUnitFormState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const values = toValues(formData);
  const parsed = unitSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian form...",
      fieldErrors: fieldErrorMap(parsed.error.issues),
      values,
    };
  }
  const data = parsed.data;

  try {
    await prisma.unitKerja.create({
      data: {
        nama_unit: data.nama_unit,
        jenis: data.jenis || null,
        kepala_jabatan: data.kepala_jabatan || null,
        parent_id: data.parent_id,
        level: await levelOf(data.parent_id),
        is_active: data.is_active,
      },
    });
  } catch {
    return { error: "Gagal menyimpan unit. Silahkan coba lagi.", values };
  }

  revalidatePath("/admin/struktur-organisasi");
  flashRedirect("/admin/struktur-organisasi", {
    type: "success",
    title: "Unit brehasil ditambahkan",
  });
}

export async function updateUnit(
  id: number,
  _prev: AdminUnitFormState,
  formData: FormData,
): Promise<AdminUnitFormState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const values = toValues(formData);
  const parsed = unitSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Periksa kembali isian form.",
      fieldErrors: fieldErrorMap(parsed.error.issues),
      values,
    };
  }
  const data = parsed.data;

  const existing = await prisma.unitKerja.findUnique({ where: { id } });
  if (!existing) return { error: "Unit tidak ditemukan." };
  // blok parent = diri sendiri atau turunan
  if (data.parent_id == id)
    return { error: "Unit tidak bisa menjadi parent dirinya sendiri.", values };

  try {
    await prisma.unitKerja.update({
      where: { id },
      data: {
        nama_unit: data.nama_unit,
        jenis: data.jenis || "",
        kepala_jabatan: data.kepala_jabatan || null,
        parent_id: data.parent_id,
        level: await levelOf(data.parent_id),
        is_active: data.is_active,
      },
    });
  } catch {
    return { error: "Gagal memperbarui unit. Silahkan coba lagi", values };
  }

  revalidatePath("/admin/struktur-organisasi");
  revalidatePath(`/admin/struktur-organisasi/${id}/edit`);
  flashRedirect("/admin/struktur-organisasi", {
    type: "success",
    title: "Unit berhasil diperbarui",
  });
}

export interface AdminUnitstatusState {
  error?: string;
}

export async function setUnitStatus(
  id: number,
  isActive: boolean,
): Promise<AdminUnitstatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };
  const existing = await prisma.unitKerja.findUnique({ where: { id } });
  if (!existing) return { error: "Unit tidak ditemukan." };
  await prisma.unitKerja.update({
    where: { id },
    data: { is_active: isActive },
  });
  revalidatePath("/admin/struktur-organisasi");
  return {};
}

export async function deleteUnit(id: number): Promise<AdminUnitstatusState> {
  const session = await requireRole("ADMIN");
  const err = await assertActiveActor(session.id);
  if (err) return { error: err };

  const existing = await prisma.unitKerja.findUnique({
    where: { id },
    include: { _count: { select: { children: true, users: true } } },
  });
  if (!existing) return { error: "Unit tidak ditemukan." };
  if (existing._count.children > 0)
    return { error: "Hapus dulu sub-unit nya." };
  if (existing._count.users > 0)
    return { error: "unit masih memiliki pengguna." };

  try {
    await prisma.unitKerja.delete({ where: { id } });
  } catch {
    return { error: "Gagal menghapus unit, Silahkan coba lagi." };
  }

  revalidatePath("/admin/struktur-organisasi");
  return {};
}
