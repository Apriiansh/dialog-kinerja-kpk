import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { formatTanggal } from "@/lib/utils/format";
import { UserDetailView, type UserDetailData } from "@/components/shared/user-detail-view";
import {
  setUserStatus,
  deleteAdminUser,
} from "@/lib/actions/admin-users";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ADMIN");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
      select: {
        id: true,
        npp: true,
        email: true,
        email_verified_at: true,
        nip: true,
      nama_pegawai: true,
      nama_jabatan: true,
      unit_kerja: true,
      tanggal_bergabung: true,
      masa_kerja_unit_terakhir: true,
      is_admin: true,
      as_pegawai: true,
      is_active: true,
      default_role: true,
      atasan: {
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
        },
      },
      bawahan: {
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
          is_active: true,
        },
        orderBy: { nama_pegawai: "asc" },
      },
      dialogAsPegawai: {
        select: {
          id: true,
          periode_tahun: true,
          triwulan: true,
          status: true,
          deskripsi_kinerja: true,
          updated_at: true,
        },
        orderBy: { periode_tahun: "desc" },
      },
    },
  });

  if (!user) notFound();

  const userData: UserDetailData = {
    id: user.id,
    npp: user.npp,
    email: user.email,
    email_verified: Boolean(user.email_verified_at),
    nip: user.nip,
    nama_pegawai: user.nama_pegawai,
    nama_jabatan: user.nama_jabatan,
    unit_kerja: user.unit_kerja,
    tanggal_bergabung: user.tanggal_bergabung
      ? formatTanggal(user.tanggal_bergabung)
      : null,
    masa_kerja_unit_terakhir: user.masa_kerja_unit_terakhir,
    is_admin: user.is_admin,
    as_pegawai: user.as_pegawai,
    is_active: user.is_active,
    default_role: user.default_role,
    atasan: user.atasan,
    bawahan: user.bawahan,
    dialogs: user.dialogAsPegawai.map((d) => ({
      id: d.id,
      periode_tahun: d.periode_tahun,
      triwulan: d.triwulan,
      status: d.status,
      deskripsi_kinerja: d.deskripsi_kinerja,
      updated_at: d.updated_at ? formatTanggal(d.updated_at) : null,
    })),
  };

  async function handleToggleStatus(isActive: boolean) {
    "use server";
    return await setUserStatus(id, isActive);
  }

  async function handleDelete() {
    "use server";
    return await deleteAdminUser(id);
  }

  return (
    <UserDetailView
      user={userData}
      context="ADMIN"
      backHref="/admin/users"
      editHref={`/admin/users/${id}/edit`}
      isSelf={session.id === id}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDelete}
    />
  );
}
