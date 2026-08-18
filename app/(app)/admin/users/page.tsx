import {
  PlusIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { UserImportDialog } from "@/components/admin/user-import-dialog";
import { UserListSection } from "@/components/admin/user-list-section";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildUserWhere(sp: Record<string, string | string[] | undefined>) {
  const where: Prisma.UserWhereInput = {};
  const and: Prisma.UserWhereInput[] = [];

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  if (q) {
    and.push({
      OR: [
        { nama_pegawai: { contains: q } },
        { npp: { contains: q } },
        { nama_jabatan: { contains: q } },
        { unit_kerja: { contains: q } },
      ],
    });
  }

  const role = typeof sp.role === "string" ? sp.role : "all";
  if (role === "admin") and.push({ is_admin: true });
  else if (role === "atasan") and.push({ is_admin: false, as_pegawai: false });
  else if (role === "pegawai") and.push({ as_pegawai: true });

  const status = typeof sp.status === "string" ? sp.status : "all";
  if (status === "active") and.push({ is_active: true });
  else if (status === "inactive") and.push({ is_active: false });

  if (and.length > 0) where.AND = and;
  return where;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const { page, skip, existingParams } = getPageParams(sp, ["q", "role", "status"]);

  const where = buildUserWhere(sp);

  const [users, total, totalCount, activeCount, adminCount, atasanCount] =
    await Promise.all([
      prisma.user.findMany({
        where,
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
        skip,
        take: PAGE_SIZE,
      }),
      prisma.user.count({ where }),
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { is_admin: true } }),
      prisma.user.count({ where: { as_pegawai: false, is_admin: false } }),
    ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
        <>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total" value={totalCount} />
              <StatCard label="Aktif" value={activeCount} tone="emerald" />
              <StatCard label="Nonaktif" value={totalCount - activeCount} tone="red" />
              <StatCard label="Admin" value={adminCount} tone="indigo" />
              <StatCard label="Atasan" value={atasanCount} tone="primary" />
              <StatCard label="Pegawai" value={totalCount - adminCount - atasanCount} />
            </div>
            <UserListSection users={users} />
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            basePath="/admin/users"
            existingParams={existingParams}
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "emerald" | "red" | "indigo" | "primary";
}) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-indigo-700",
    primary: "bg-primary/10 text-primary",
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-outline bg-surface px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
        {label}
      </span>
      <span
        className={`inline-flex h-7 w-fit items-center rounded-md px-2 text-sm font-bold ${tone ? toneClasses[tone] : "bg-surface-muted text-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}
