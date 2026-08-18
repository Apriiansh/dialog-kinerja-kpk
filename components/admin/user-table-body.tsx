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
        </TableRow>
      ))}
    </>
  );
}
