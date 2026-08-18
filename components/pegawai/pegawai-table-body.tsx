"use client";

import { useRouter } from "next/navigation";
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface PegawaiRowProps {
  pegawai: {
    id: number;
    npp: string;
    nip: string | null;
    nama_pegawai: string;
    nama_jabatan: string | null;
    unit_kerja: string | null;
    is_active: boolean;
  };
}

export function PegawaiTableBody({
  rows,
}: {
  rows: PegawaiRowProps[];
}) {
  const router = useRouter();

  return (
    <>
      {rows.map(({ pegawai: p }) => (
        <TableRow
          key={p.id}
          onClick={() => router.push(`/atasan/pegawai/${p.id}`)}
          className="group cursor-pointer border-outline transition-colors hover:bg-surface-muted/60"
        >
          <TableCell className="px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                <UserCircleIcon size={20} weight="fill" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span
                  className={`truncate text-left text-sm font-semibold transition-colors group-hover:text-primary ${
                    p.is_active ? "text-ink" : "text-ink-muted/60"
                  }`}
                >
                  {p.nama_pegawai}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-col">
                <span
                  className={`text-xs ${p.is_active ? "text-ink-muted" : "text-ink-muted/60"}`}
                >
                  NPP {p.npp}
                </span>
                <span
                  className={`text-xs ${p.is_active ? "text-ink-muted" : "text-ink-muted/60"}`}
                >
                  NIP {p.nip ?? "—"}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell className="px-5 py-4">
            <span className="block max-w-[16rem] truncate text-sm text-ink">
              {[p.unit_kerja, p.nama_jabatan].filter(Boolean).join(" · ") || "—"}
            </span>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
