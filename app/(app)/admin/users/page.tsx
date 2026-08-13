import {
  PlusIcon,
  UserCircle,
  Users,
  ShieldCheck,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { AdminUserStatusToggle } from "@/components/admin-user-status-toggle";
import { AdminUserDeleteButton } from "@/components/admin-user-delete-button";
import { RoleTag } from "@/components/role-tag";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      npp: true,
      nama_pegawai: true,
      nama_jabatan: true,
      unit_kerja: true,
      is_admin: true,
      as_pegawai: true,
      default_role: true,
      is_active: true,
      tanggal_bergabung: true,
      atasan: { select: { nama_pegawai: true } },
      _count: { select: { bawahan: true } },
    },
    orderBy: [{ is_active: "desc" }, { nama_pegawai: "asc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Kelola Pengguna
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {users.filter((u) => u.is_active).length} pengguna aktif dari total{" "}
            {users.length}.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
        >
          <PlusIcon size={16} weight="bold" />
          Tambah Pengguna
        </Link>
      </header>

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <Users size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada pengguna
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <div className="hidden grid-cols-[1fr_140px_120px_110px_130px_150px] gap-4 border-b border-outline bg-surface-muted/60 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted lg:grid">
            <span>Nama / NPP</span>
            <span>Atasan</span>
            <span>Peran</span>
            <span>Bergabung</span>
            <span>Status</span>
            <span className="text-right">Aksi</span>
          </div>
          <ul className="divide-y divide-outline">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 px-5 py-4 lg:grid lg:grid-cols-[1fr_140px_120px_110px_130px_150px] lg:items-center lg:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                    {u.is_admin ? (
                      <ShieldCheck size={20} weight="fill" />
                    ) : (
                      <UserCircle size={20} weight="fill" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/admin/users/${u.id}/edit`}
                      className="truncate text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      {u.nama_pegawai}
                    </Link>
                    <span
                      className={`text-xs ${u.is_active ? "text-ink-muted" : "text-ink-muted/60"}`}
                    >
                      NPP {u.npp}
                    </span>
                  </div>
                </div>
                <span
                  className={`truncate text-sm ${u.is_active ? "text-ink" : "text-ink-muted/60"}`}
                >
                  {u.atasan?.nama_pegawai ?? "—"}
                </span>
                <div className="flex flex-wrap gap-1">
                  {u.is_admin ? <RoleTag role="ADMIN" /> : null}
                  {u.as_pegawai ? <RoleTag role="PEGAWAI" /> : null}
                  {u._count.bawahan > 0 ? <RoleTag role="ATASAN" /> : null}
                </div>
                <span
                  className={`text-sm ${u.is_active ? "text-ink" : "text-ink-muted/60"}`}
                >
                  {u.tanggal_bergabung
                    ? formatTanggal(u.tanggal_bergabung)
                    : "—"}
                </span>
                <AdminUserStatusToggle
                  id={u.id}
                  nama={u.nama_pegawai}
                  isActive={u.is_active}
                  isSelf={u.id === session.id}
                />
                <div className="flex items-center justify-start gap-2 lg:justify-end">
                  <Link
                    href={`/admin/users/${u.id}/edit`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
                  >
                    <PencilSimple size={14} weight="bold" />
                    Edit
                  </Link>
                  {!u.is_active ? (
                    <AdminUserDeleteButton id={u.id} nama={u.nama_pegawai} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}