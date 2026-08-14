import {
  PlusIcon,
  UserCircleIcon,
  UsersIcon,
  ShieldCheckIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { AdminUserStatusToggle } from "@/components/admin-user-status-toggle";
import { AdminUserDeleteButton } from "@/components/admin-user-delete-button";
import { RoleTag } from "@/components/role-tag";
import { formatTanggal } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
            <UsersIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada pengguna
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <Table>
            <TableHeader className="bg-surface-muted/60">
              <TableRow className="border-outline hover:bg-transparent">
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Nama / NPP
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Atasan
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Peran
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Bergabung
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Status
                </TableHead>
                <TableHead className="h-11 px-5 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="border-outline hover:bg-surface-muted/40"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                        {u.is_admin ? (
                          <ShieldCheckIcon size={20} weight="fill" />
                        ) : (
                          <UserCircleIcon size={20} weight="fill" />
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
                  </TableCell>
                  <TableCell
                    className={`truncate px-5 py-4 text-sm ${u.is_active ? "text-ink" : "text-ink-muted/60"}`}
                  >
                    {u.atasan?.nama_pegawai ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.is_admin ? <RoleTag role="ADMIN" /> : null}
                      {u.as_pegawai ? <RoleTag role="PEGAWAI" /> : null}
                      {u._count.bawahan > 0 ? <RoleTag role="ATASAN" /> : null}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`px-5 py-4 text-sm ${u.is_active ? "text-ink" : "text-ink-muted/60"}`}
                  >
                    {u.tanggal_bergabung
                      ? formatTanggal(u.tanggal_bergabung)
                      : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <AdminUserStatusToggle
                      id={u.id}
                      nama={u.nama_pegawai}
                      isActive={u.is_active}
                      isSelf={u.id === session.id}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}/edit`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
                      >
                        <PencilSimpleIcon size={14} weight="bold" />
                        Edit
                      </Link>
                      {!u.is_active ? (
                        <AdminUserDeleteButton
                          id={u.id}
                          nama={u.nama_pegawai}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}