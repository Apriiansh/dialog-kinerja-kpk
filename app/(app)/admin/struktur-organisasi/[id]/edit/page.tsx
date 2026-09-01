import { notFound } from "next/navigation";
import { AdminUnitForm } from "@/components/admin/unit-form";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { updateUnit } from "@/lib/actions/admin-unit";

export const dynamic = "force-dynamic";

export default async function AdminUnitEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const unitId = Number(id);
  if (Number.isNaN(unitId)) notFound();

  await requireRole("ADMIN");

  const [unit, units] = await Promise.all([
    prisma.unitKerja.findUnique({ where: { id: unitId } }),
    prisma.unitKerja.findMany({
      where: { id: { not: unitId } },
      orderBy: [{ level: "asc" }, { nama_unit: "asc" }],
      select: { id: true, nama_unit: true, level: true },
    }),
  ]);
  if (!unit) notFound();

  return (
    <AdminUnitForm
      backHref="/admin/struktur-organisasi"
      backLabel="Kembali ke Struktur Organisasi"
      submitLabel="Edit Unit"
      parentOptions={units.map((u) => ({
        id: u.id,
        nama_unit: u.nama_unit,
        depth: u.level,
      }))}
      action={async (formData) => {
        "use server";
        return updateUnit(unitId, {}, formData);
      }}
      values={{
        nama_unit: unit.nama_unit,
        jenis: unit.jenis ?? "",
        kepala_jabatan: unit.kepala_jabatan ?? "",
        parent_id: unit.parent_id ? String(unit.parent_id) : "",
        is_active: unit.is_active ? "1" : "",
      }}
    />
  );
}
