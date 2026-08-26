"use client";

import { MagnifyingGlassIcon, PlusIcon, XIcon, CheckCircleIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startDialog } from "@/lib/actions/atasan";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { formatPeriode, triwulanLabel, getAvailableYears } from "@/lib/constants/triwulan";

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
  
  // Hanya fokus ke TW1 dan TW3 (TW2 dan TW4 di-hide)
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [triwulan, setTriwulan] = useState<"TW1" | "TW3">("TW1");

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

  async function handleStartDialog(pegawaiId: number) {
    setCreatingId(pegawaiId);
    // Tanggal untuk TW1 = 15 Januari, TW3 = 15 Juli
    const dateStr = triwulan === "TW1" ? `${tahun}-01-15` : `${tahun}-07-15`;
    const result = await startDialog(pegawaiId, dateStr);
    setCreatingId(null);

    if (result?.error) {
      showError(result.error);
      return;
    }
    showSuccess(`Dialog kinerja ${triwulan} Tahun ${tahun} berhasil dibuat`);
    setOpen(false);
    router.push(`/atasan/dialog/${result.dialogId}/edit`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
      >
        <PlusIcon size={16} weight="bold" />
        Mulai Dialog
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pilih pegawai"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl bg-surface shadow-2xl border border-outline overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline px-6 py-4 bg-surface">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-bold text-ink">
                  Mulai Dialog Kinerja Pegawai
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  Siklus evaluasi & monitoring 6-bulanan (TW1 Perencanaan & Evaluasi, TW3 Monitoring Progres).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink cursor-pointer"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            {/* Target Period Selector (TW1 & TW3 Only) */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline px-6 py-3.5 bg-surface-muted/50">
              <div className="flex flex-wrap items-center gap-4">
                {/* Tahun */}
                <div className="flex items-center gap-2">
                  <label htmlFor="select-tahun" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Tahun:
                  </label>
                  <select
                    id="select-tahun"
                    value={tahun}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    className="h-9 rounded-lg border border-outline bg-surface px-3 text-xs font-bold text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                  >
                    {getAvailableYears(3, 3).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Triwulan Segmented Toggle (Only TW1 and TW3) */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Triwulan:
                  </label>
                  <div className="inline-flex rounded-lg border border-outline bg-surface p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setTriwulan("TW1")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        triwulan === "TW1"
                          ? "bg-primary text-white shadow-xs"
                          : "text-ink-muted hover:text-ink hover:bg-surface-muted"
                      }`}
                    >
                      Triwulan I (Perencanaan & Evaluasi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTriwulan("TW3")}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        triwulan === "TW3"
                          ? "bg-primary text-white shadow-xs"
                          : "text-ink-muted hover:text-ink hover:bg-surface-muted"
                      }`}
                    >
                      Triwulan III (Monitoring Progres)
                    </button>
                  </div>
                </div>
              </div>

              {/* Status helper text */}
              <div className="text-right">
                <span className="text-[11px] text-ink-muted font-medium">
                  Target: <strong className="text-primary">{triwulan === "TW1" ? "TW1 (Perencanaan)" : "TW3 (Monitoring)"} {tahun}</strong>
                </span>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col gap-3 border-b border-outline px-6 py-3.5 sm:flex-row bg-surface">
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
                  placeholder="Cari nama pegawai atau NPP..."
                  className="h-9 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
                />
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-9 rounded-lg border border-outline bg-surface px-3 text-xs text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus sm:w-48"
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
                className="h-9 rounded-lg border border-outline bg-surface px-3 text-xs text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus sm:w-48"
              >
                <option value="">Semua Jabatan</option>
                {jabatans.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Table List */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-ink-muted">
                    Tidak ada pegawai yang cocok dengan kriteria pencarian.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 border-b border-outline bg-surface z-10">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <th className="px-6 py-3">Pegawai</th>
                      <th className="px-6 py-3">NPP / Unit Kerja</th>
                      <th className="px-6 py-3">Status Periode {tahun}</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {filtered.map((p) => {
                      const dialogsThisYear = (p.dialogAsPegawai ?? []).filter(
                        (d) => d.periode_tahun === tahun,
                      );
                      const dialogTW1 = dialogsThisYear.find((d) => d.triwulan === "TW1");
                      const dialogTW3 = dialogsThisYear.find((d) => d.triwulan === "TW3");

                      let isActionDisabled = false;
                      let statusBadge = null;
                      let buttonLabel = "Mulai Dialog";
                      let disableReason = "";

                      if (triwulan === "TW1") {
                        if (dialogTW1) {
                          isActionDisabled = true;
                          disableReason = "TW1 sudah pernah dibuat";
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-500 border border-slate-300 dark:border-slate-700">
                              <CheckCircleIcon size={14} weight="fill" className="text-slate-400" />
                              TW1 {tahun} Sudah Ada
                            </span>
                          );
                          buttonLabel = "TW1 Sudah Dibuat";
                        } else {
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                              Belum Ada Perencanaan TW1
                            </span>
                          );
                          buttonLabel = "Mulai Perencanaan (TW1)";
                        }
                      } else {
                        // triwulan === "TW3"
                        if (dialogTW3) {
                          isActionDisabled = true;
                          disableReason = "TW3 sudah pernah dibuat";
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-500 border border-slate-300 dark:border-slate-700">
                              <CheckCircleIcon size={14} weight="fill" className="text-slate-400" />
                              TW3 {tahun} Sudah Ada
                            </span>
                          );
                          buttonLabel = "TW3 Sudah Dibuat";
                        } else if (!dialogTW1) {
                          isActionDisabled = true;
                          disableReason = "TW1 belum dibuat";
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                              <ProhibitIcon size={14} weight="bold" />
                              Belum Ada TW1
                            </span>
                          );
                          buttonLabel = "Buat TW1 Dulu";
                        } else if (dialogTW1.status !== "selesai" || !dialogTW1.reviu?.[0] || dialogTW1.reviu[0].status !== "selesai") {
                          isActionDisabled = true;
                          disableReason = "TW1 belum selesai dievaluasi";
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                              TW1 Belum Selesai
                            </span>
                          );
                          buttonLabel = "TW1 Belum Selesai";
                        } else {
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              Siap Monitoring (TW3)
                            </span>
                          );
                          buttonLabel = "Mulai Monitoring (TW3)";
                        }
                      }

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${
                            isActionDisabled
                              ? "bg-slate-50/50 dark:bg-slate-900/30 opacity-75"
                              : "hover:bg-surface-muted"
                          }`}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-sm font-medium ${isActionDisabled ? "text-ink-muted" : "text-ink"}`}>
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
                              disabled={isActionDisabled || creatingId !== null}
                              title={disableReason || `Mulai dialog kinerja ${triwulanLabel(triwulan)}`}
                              className={`inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-xs font-semibold transition-all ${
                                isActionDisabled
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed"
                                  : "bg-primary text-on-primary hover:bg-primary-strong cursor-pointer shadow-xs"
                              }`}
                            >
                              {creatingId === p.id ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              ) : (
                                buttonLabel
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
