import {
  PlusIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { UserImportDialog } from "@/components/admin/user-import-dialog";
import { UserListWrapper } from "@/components/admin/user-list-wrapper";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole("ADMIN");

  const [users, totalCount, activeCount, adminCount, atasanCount] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
          is_admin: true,
          as_pegawai: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          atasan: { select: { nama_pegawai: true } },
          _count: { select: { bawahan: true } },
        },
        orderBy: [{ is_active: "desc" }, { nama_pegawai: "asc" }],
      }),
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_admin: true } }),
      prisma.user.count({ where: { as_pegawai: false, is_admin: false } }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Kelola Pengguna
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {activeCount} pengguna aktif dari total {totalCount}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UserImportDialog />
          <Link
            href="/admin/users/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            <PlusIcon size={16} weight="bold" />
            Tambah Pengguna
          </Link>
        </div>
      </header>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <UsersIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada pengguna
          </h3>
        </div>
      ) : (
        <UserListWrapper
          users={users}
          stats={{
            total: totalCount,
            active: activeCount,
            inactive: totalCount - activeCount,
            admin: adminCount,
            atasan: atasanCount,
            pegawai: totalCount - adminCount - atasanCount,
          }}
        />
      )}
    </div>
  );
}
