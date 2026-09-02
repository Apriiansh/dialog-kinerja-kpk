"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { AdminUserTableBody } from "./user-table-body";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserRow {
  id: string;
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

export function UserListSection({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "all";
  const status = searchParams.get("status") ?? "all";

  const updateParam = useCallback(
    (key: string, value: string) => {
      startTransition(() => {
        const sp = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
          sp.set(key, value);
        } else {
          sp.delete(key);
        }
        sp.delete("page");
        router.push(`/admin/users?${sp.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const debouncedSearch = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => updateParam("q", value), 300);
    },
    [updateParam],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="w-full flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon
            size={14}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            defaultValue={q}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Cari nama, NPP, jabatan..."
            className="h-9 w-full rounded-md border border-outline bg-surface pl-8 pr-8 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
          />
          {q && (
            <button
              type="button"
              onClick={() => updateParam("q", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <XIcon size={12} weight="bold" />
            </button>
          )}
        </div>

        <select
          value={role}
          onChange={(e) => updateParam("role", e.target.value)}
          className="h-9 w-32.5 shrink-0 rounded-md border border-outline bg-surface px-3 text-xs text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
        >
          <option value="all">Semua Peran</option>
          <option value="admin">Admin</option>
          <option value="atasan">Atasan</option>
          <option value="pegawai">Pegawai</option>
        </select>

        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="h-9 w-32.5 shrink-0 rounded-md border border-outline bg-surface px-3 text-xs text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <p className="text-sm text-ink-muted">
            Tidak ada pengguna yang cocok dengan filter.
          </p>
        </div>
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
              <AdminUserTableBody users={users} />
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
