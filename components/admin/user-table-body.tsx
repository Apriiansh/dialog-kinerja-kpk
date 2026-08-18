"use client";

import { useRouter } from "next/navigation";
import {
  ShieldCheckIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { RoleTag } from "@/components/shared/role-tag";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";

const RECENT_DAYS = 2;

function isRecentlyAdded(date: Date): boolean {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= RECENT_DAYS;
}

function isRecentlyUpdated(created: Date, updated: Date): boolean {
  const now = new Date();
  const d = new Date(updated);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= RECENT_DAYS && d.getTime() > new Date(created).getTime();
}

interface AdminUserRowProps {
  user: {
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
  };
}

export function AdminUserTableBody({
  users,
}: {
  users: AdminUserRowProps["user"][];
}) {
  const router = useRouter();

  return (
    <>
      {users.map((u) => (
        <TableRow
          key={u.id}
          onClick={() => router.push(`/admin/users/${u.id}`)}
          className="group cursor-pointer border-outline transition-colors hover:bg-surface-muted/60"
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
                <span
                  className={`truncate text-left text-sm font-semibold transition-colors group-hover:text-primary ${
                    u.is_active ? "text-ink" : "text-ink-muted/60"
                  }`}
                >
                  {u.nama_pegawai}
                </span>
                <span
                  className={`text-xs ${u.is_active ? "text-ink-muted" : "text-ink-muted/60"}`}
                >
                  NPP {u.npp}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell
            className={`px-5 py-4 text-sm ${u.is_active ? "text-ink" : "text-ink-muted/60"}`}
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
          <TableCell className="px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink-muted">
                {new Date(u.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {isRecentlyAdded(u.created_at) && (
                <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Recently Added
                </span>
              )}
              {isRecentlyUpdated(u.created_at, u.updated_at) && (
                <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Recently Updated
                </span>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
