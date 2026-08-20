"use client";

import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startDialog } from "@/lib/actions/atasan";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { formatPeriode, getTriwulanFromDate, triwulanLabel } from "@/lib/constants/triwulan";

export interface PegawaiOption {
  id: number;
  npp: string;
  nama_pegawai: string;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  dialogAsPegawai?: {
    id: number;
    periode_tahun: number;
    triwulan: import("@/generated/prisma/enums").Triwulan;
    status: string;
    reviu: { id: number; status: string }[];
  }[];
}

export function NewDialogButton({ pegawai }: { pegawai: PegawaiOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [creatingId, setCreatingId] = useState<number | null>(null);
  const [tanggalPeriode, setTanggalPeriode] = useState(
    new Date().toISOString().split("T")[0],
  );

  const units = useMemo(
    () =>
      [
        ...new Set(
          pegawai.map((p) => p.unit_kerja).filter((u): u is string => !!u),
        ),
      ].sort(),
    [pegawai],
  );
  const jabatans = useMemo(
    () =>
      [
        ...new Set(
          pegawai.map((p) => p.nama_jabatan).filter((j): j is string => !!j),
        ),
      ].sort(),
    [pegawai],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pegawai.filter(
      (p) =>
        (!q ||
          p.nama_pegawai.toLowerCase().includes(q) ||
          p.npp.includes(q)) &&
        (!unit || p.unit_kerja === unit) &&
        (!jabatan || p.nama_jabatan === jabatan),
    );
  }, [pegawai, query, unit, jabatan]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const triwulanPreview = getTriwulanFromDate(new Date(tanggalPeriode));

  async function handleStartDialog(pegawaiId: number) {
    setCreatingId(pegawaiId);
    const result = await startDialog(pegawaiId, tanggalPeriode);
    setCreatingId(null);

    if (result?.error) {
      showError(result.error);
      return;
    }
    showSuccess("Dialog kinerja baru berhasil dibuat");
    setOpen(false);
    router.push(`/atasan/dialog/${result.dialogId}/edit`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong"
      >
        <PlusIcon size={16} weight="bold" />
        Mulai Dialog
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pilih pegawai"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-lg bg-surface shadow-ambient"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold text-ink">
                  Mulai Dialog Kinerja Pegawai
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  Pilih pegawai untuk memulai dialog kinerja baru atau membuat dialog kinerja lanjutan.
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

            <div className="flex flex-col gap-3 border-b border-outline px-6 py-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="tanggal-periode"
                  className="whitespace-nowrap text-xs font-semibold text-ink-muted"
                >
                  Tanggal Periode:
                </label>
                <input
                  id="tanggal-periode"
                  type="date"
                  value={tanggalPeriode}
                  onChange={(e) => setTanggalPeriode(e.target.value)}
                  className="h-10 rounded-md border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                />
                <span className="whitespace-nowrap rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-strong">
                  {triwulanLabel(triwulanPreview)} {new Date(tanggalPeriode).getFullYear()}
                </span>
              </div>
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
                  placeholder="Cari nama atau NPP"
                  className="h-10 w-full rounded-md border border-outline bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
                />
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10 rounded-md border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus sm:w-52"
              >
                <option value="">Semua Unit Kerja</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <select
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                className="h-10 rounded-md border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus sm:w-52"
              >
                <option value="">Semua Jabatan</option>
                {jabatans.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-ink-muted">
                    Tidak ada pegawai yang cocok.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 border-b border-outline bg-surface">
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                      <th className="px-6 py-3">Pegawai</th>
                      <th className="px-6 py-3">NPP / Unit Kerja</th>
                      <th className="px-6 py-3">Status Riwayat Dialog</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {filtered.map((p) => {
                      const lastDialog = p.dialogAsPegawai?.[0];
                      const lastReviu = lastDialog?.reviu?.[0];

                      let statusBadge = (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                          Dialog Pertama (Baru)
                        </span>
                      );
                      let canStart = true;
                      let startLabel = "Mulai Dialog";
                      let disabledReason = "";

                      if (lastDialog) {
                        if (lastDialog.status !== "selesai") {
                          canStart = false;
                          disabledReason = "Dialog periode sebelumnya belum selesai divalidasi";
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                              Masih Berjalan ({formatPeriode(lastDialog.triwulan, lastDialog.periode_tahun)})
                            </span>
                          );
                        } else if (!lastReviu || lastReviu.status !== "selesai") {
                          canStart = false;
                          disabledReason = "Evaluasi dialog sebelumnya belum selesai";
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                              Menunggu Evaluasi ({formatPeriode(lastDialog.triwulan, lastDialog.periode_tahun)})
                            </span>
                          );
                        } else {
                          canStart = true;
                          startLabel = "Buat Lanjutan";
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              Lanjutan dari {formatPeriode(lastDialog.triwulan, lastDialog.periode_tahun)}
                            </span>
                          );
                        }
                      }

                      return (
                        <tr
                          key={p.id}
                          className="transition-colors hover:bg-surface-muted"
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-ink">
                                {p.nama_pegawai}
                              </span>
                              <span className="text-xs text-ink-muted">
                                {p.nama_jabatan ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col gap-0.5 text-xs text-ink-muted">
                              <span>NPP: {p.npp}</span>
                              <span>{p.unit_kerja ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            {statusBadge}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleStartDialog(p.id)}
                              disabled={creatingId !== null || !canStart}
                              title={disabledReason || undefined}
                              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {creatingId === p.id ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              ) : (
                                startLabel
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
