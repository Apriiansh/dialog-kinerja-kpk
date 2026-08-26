"use client";

import { useMemo, useState } from "react";
import { UserListToolbar } from "./user-list-toolbar";
import { AdminUserTableBody } from "./user-table-body";
import { UserListPagination } from "./user-list-pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

interface UserRow {
  id: number;
  npp: string;
  nama_pegawai: string;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  is_admin: boolean;
  as_pegawai: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  atasan: { nama_pegawai: string } | null;
  _count: { bawahan: number };
}

interface UserListWrapperProps {
  users: UserRow[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    admin: number;
    atasan: number;
    pegawai: number;
  };
}

const PAGE_SIZE = 10;

export function UserListWrapper({ users, stats }: UserListWrapperProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = users;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nama_pegawai.toLowerCase().includes(q) ||
          u.npp.includes(q) ||
          (u.nama_jabatan && u.nama_jabatan.toLowerCase().includes(q)) ||
          (u.unit_kerja && u.unit_kerja.toLowerCase().includes(q)),
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => {
        if (roleFilter === "admin") return u.is_admin;
        if (roleFilter === "atasan")
          return !u.is_admin && !u.as_pegawai && u._count.bawahan > 0;
        if (roleFilter === "pegawai") return u.as_pegawai;
        return true;
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((u) =>
        statusFilter === "active" ? u.is_active : !u.is_active,
      );
    }

    return result;
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  if (page !== safePage) {
    setPage(safePage);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Aktif" value={stats.active} tone="emerald" />
        <StatCard label="Nonaktif" value={stats.inactive} tone="red" />
        <StatCard label="Admin" value={stats.admin} tone="indigo" />
        <StatCard label="Atasan" value={stats.atasan} tone="primary" />
        <StatCard label="Pegawai" value={stats.pegawai} />
      </div>

      {/* Toolbar */}
      <UserListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(v) => {
          setRoleFilter(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          variant="search"
          title="Tidak ada pengguna ditemukan"
          description="Tidak ada pengguna yang cocok dengan filter. Coba ubah kata kunci atau reset filter."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <Table>
            <TableHeader className="bg-surface-muted/60">
              <TableRow className="border-outline hover:bg-transparent">
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Nama / NPP
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Atasan
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Peran
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Dibuat
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AdminUserTableBody users={paginated} />
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <UserListPagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
        />
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
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
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
