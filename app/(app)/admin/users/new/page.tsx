import { AdminUserForm } from "@/components/admin-user-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { createAdminUser } from "@/lib/actions/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminUserNewPage() {
  await requireRole("ADMIN");

  const atasanOptions = await prisma.user.findMany({
    where: { is_admin: false, is_active: true },
    select: { id: true, nama_pegawai: true, npp: true },
    orderBy: { nama_pegawai: "asc" },
  });

  return (
    <AdminUserForm
      backHref="/admin/users"
      backLabel="Kembali ke Kelola Pengguna"
      submitLabel="Tambah Pengguna"
      atasanOptions={atasanOptions}
      action={async (formData) => {
        "use server";
        return createAdminUser({}, formData);
      }}
    />
  );
}