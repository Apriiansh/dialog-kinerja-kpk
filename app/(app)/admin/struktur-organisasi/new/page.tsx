import { AdminUnitForm } from "@/components/admin/unit-form";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createUnit } from "@/lib/actions/admin-unit";

export const dynamic = "force-dynamic";

export default async function AdminUnitNewPage() {
  await requireRole("ADMIN");

  const units = await prisma.unitKerja.findMany({
    orderBy: [{ level: "asc" }, { nama_unit: "asc" }],
    select: { id: true, nama_unit: true, level: true },
  });

  return (
    <AdminUnitForm
      backHref="/admin/struktur-organisasi"
      backLabel="Kembali ke Struktur Organisasi"
      submitLabel="Tambah Unit"
      parentOptions={units.map((u) => ({
        id: u.id,
        nama_unit: u.nama_unit,
        depth: u.level,
      }))}
      action={async (formData) => {
        "use server";
        return createUnit({}, formData);
      }}
    />
  );
}
