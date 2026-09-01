import { AdminUserForm } from "@/components/admin/user-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { createAdminUser } from "@/lib/actions/admin-users";
import { unitsToTreeOptions } from "@/lib/utils/unit-tree";

export const dynamic = "force-dynamic";

export default async function AdminUserNewPage() {
  await requireRole("ADMIN");

  const atasanOptions = await prisma.user.findMany({
    where: { is_admin: false, is_active: true },
    select: { id: true, nama_pegawai: true, npp: true, unit_kerja_id: true },
    orderBy: { nama_pegawai: "asc" },
  });

  const unitOptions = unitsToTreeOptions(
    await prisma.unitKerja.findMany({
      where: { is_active: true },
      select: { id: true, nama_unit: true, parent_id: true },
    }),
  );

  return (
    <AdminUserForm
      backHref="/admin/users"
      backLabel="Kembali ke Kelola Pengguna"
      submitLabel="Tambah Pengguna"
      atasanOptions={atasanOptions}
      unitOptions={unitOptions}
      action={async (formData) => {
        "use server";
        return createAdminUser({}, formData);
      }}
    />
  );
}