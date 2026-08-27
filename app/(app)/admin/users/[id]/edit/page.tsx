import { notFound } from "next/navigation";
import { AdminUserForm } from "@/components/admin/user-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { adminUserFormDefaults } from "@/lib/utils/user-defaults";
import { updateAdminUser } from "@/lib/actions/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ADMIN");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      npp: true,
      email: true,
      nip: true,
      nama_pegawai: true,
      tanggal_bergabung: true,
      nama_jabatan: true,
      unit_kerja: true,
      masa_kerja_unit_terakhir: true,
      default_role: true,
      is_admin: true,
      as_pegawai: true,
      id_atasan: true,
    },
  });
  if (!user) notFound();

  const atasanOptions = await prisma.user.findMany({
    where: {
      is_admin: false,
      is_active: true,
      NOT: { id: user.id },
    },
    select: { id: true, nama_pegawai: true, npp: true },
    orderBy: { nama_pegawai: "asc" },
  });

  return (
    <AdminUserForm
      backHref="/admin/users"
      backLabel="Kembali ke Kelola Pengguna"
      submitLabel={`Edit ${user.nama_pegawai}`}
      atasanOptions={atasanOptions}
      isSelf={user.id === session.id}
      action={async (formData) => {
        "use server";
        return updateAdminUser(Number(id), {}, formData);
      }}
      values={adminUserFormDefaults(user)}
    />
  );
}
