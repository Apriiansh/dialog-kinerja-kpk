"use client";

import Link from "next/link";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { SelesaiDialogOption } from "@/lib/queries/reviu";
import { formatPeriode, triwulanLabel } from "@/lib/constants/triwulan";

export function NewReviuButton({ dialogs }: { dialogs: SelesaiDialogOption[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dialogs.filter(
      (d) =>
        !q ||
        String(d.periode_tahun).includes(q) ||
        triwulanLabel(d.triwulan).toLowerCase().includes(q) ||
        d.atasan.nama_pegawai.toLowerCase().includes(q),
    );
  }, [dialogs, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong"
      >
        <PlusIcon size={16} weight="bold" />
        Buat Evaluasi
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pilih dialog kinerja"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-surface shadow-ambient"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold text-ink">
                  Pilih Dialog untuk Dievaluasi
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  Pilih dokumen dialog kinerja selesai yang belum memiliki formulir evaluasi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-outline px-6 py-4 sm:flex-row">
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  size={16}
                  weight="bold"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari tahun dialog atau nama atasan"
                  className="h-10 w-full rounded-md border border-outline bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-ink-muted">
                    Tidak ada dialog kinerja yang siap dievaluasi. Seluruh dialog yang selesai telah memiliki formulir evaluasi.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 border-b border-outline bg-surface">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      <th className="px-6 py-3">Dialog Kinerja</th>
                      <th className="px-6 py-3">Atasan Penilai</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {filtered.map((d) => (
                      <tr
                        key={d.id}
                        className="transition-colors hover:bg-surface-muted"
                      >
                        <td className="px-6 py-3.5 text-sm font-medium text-ink">
                          {formatPeriode(d.triwulan, d.periode_tahun)}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-ink-muted">
                          {d.atasan.nama_pegawai}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                            Belum Dievaluasi
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/pegawai/reviu/new?dialog=${d.id}`}
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                          >
                            Isi Evaluasi →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
