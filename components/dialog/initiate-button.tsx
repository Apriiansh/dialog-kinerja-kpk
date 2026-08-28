"use client";

import { CalendarIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { initiateDialog } from "@/lib/actions/pegawai";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { formatPeriode, getTriwulanFromDate } from "@/lib/constants/triwulan";

export interface EligibleParentInfo {
  id: number;
  periodeLabel: string;
  unachievedCount: number;
}

export interface InitiateDialogButtonProps {
  eligibleParent?: EligibleParentInfo;
  parentDialogId?: number;
  parentPeriodeLabel?: string;
  unachievedCount?: number;
  label?: string;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function InitiateDialogButton({
  eligibleParent,
  parentDialogId,
  parentPeriodeLabel,
  unachievedCount,
  label,
  variant = "primary",
  size = "md",
  className = "",
}: InitiateDialogButtonProps = {}) {
  const parentId = eligibleParent?.id ?? parentDialogId;
  const parentLabel = eligibleParent?.periodeLabel ?? parentPeriodeLabel;
  const unachieved = eligibleParent?.unachievedCount ?? unachievedCount ?? 0;
  const isLanjutan = Boolean(parentId);

  const defaultLabel = "Ajukan Dialog Kinerja";
  const displayLabel = label || defaultLabel;

  const [open, setOpen] = useState(false);
  const [jadwalDate, setJadwalDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [deskripsi, setDeskripsi] = useState("");
  const [loading, setLoading] = useState(false);

  const autoPeriode = useMemo(() => {
    if (!jadwalDate) return null;
    const parts = jadwalDate.split("-");
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const tw = getTriwulanFromDate(d);
    return { year, tw, label: formatPeriode(tw, year) };
  }, [jadwalDate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jadwalDate) {
      showError("Pilih tanggal jadwal dialog.");
      return;
    }
    setLoading(true);
    const res = await initiateDialog({
      jadwal_dialog: jadwalDate,
      deskripsi_pegawai: deskripsi,
      id_dialog_induk: parentId,
    });
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    showSuccess(
      isLanjutan
        ? "Pengajuan dialog lanjutan berhasil dikirim ke atasan."
        : "Pengajuan dialog berhasil dikirim ke atasan.",
    );
    setOpen(false);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const buttonClasses =
    variant === "primary"
      ? size === "sm"
        ? "inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
        : "inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
      : size === "sm"
        ? "inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted cursor-pointer"
        : "inline-flex h-10 items-center gap-2 rounded-md border border-outline bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted cursor-pointer";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClasses} ${className}`}
      >
        <PlusIcon size={size === "sm" ? 14 : 16} weight="bold" />
        {displayLabel}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={displayLabel}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col rounded-xl bg-surface shadow-2xl border border-outline overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline px-6 py-4 bg-surface">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-bold text-ink">
                  {isLanjutan
                    ? "Ajukan Jadwal Dialog Kinerja Lanjutan"
                    : "Ajukan Jadwal Dialog Kinerja"}
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  {isLanjutan
                    ? "Pilih tanggal pelaksanaan dialog lanjutan. Butir target yang belum tercapai otomatis diteruskan."
                    : "Pilih tanggal pelaksanaan dialog. Periode & Triwulan akan ditentukan secara otomatis."}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
              {isLanjutan && parentLabel ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                    <span>Dialog Kinerja Lanjutan</span>
                    <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                      Lanjutan dari {parentLabel}
                    </span>
                  </div>
                  <p className="leading-5 text-amber-800">
                    Pengajuan ini terhubung dengan periode sebelumnya. Sebanyak{" "}
                    <strong className="font-bold text-amber-950 underline decoration-amber-400">
                      {unachieved} butir kegiatan yang belum tercapai
                    </strong>{" "}
                    serta komitmen tanggung jawab akan otomatis disalin ke dialog kinerja baru ini.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="jadwal-date"
                  className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5"
                >
                  <CalendarIcon size={14} weight="bold" />
                  Tanggal Pelaksanaan Dialog *
                </label>
                <input
                  id="jadwal-date"
                  type="date"
                  min={todayStr}
                  required
                  value={jadwalDate}
                  onChange={(e) => setJadwalDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                />
              </div>

              {autoPeriode ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary font-medium">
                  Periode Terdeteksi: <strong className="font-bold">{autoPeriode.label}</strong>
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="deskripsi-pegawai"
                  className="text-xs font-bold uppercase tracking-wider text-ink-muted"
                >
                  Catatan / Konteks Pengajuan (Opsional)
                </label>
                <textarea
                  id="deskripsi-pegawai"
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder={
                    isLanjutan
                      ? "Tuliskan fokus capaian atau kendala yang ingin didiskusikan pada periode lanjutan ini..."
                      : "Tuliskan konteks atau topik utama yang ingin didiskusikan..."
                  }
                  className="w-full rounded-lg border border-outline bg-surface p-3 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 border-t border-outline pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 rounded-md border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  {isLanjutan ? "Ajukan Dialog Lanjutan" : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
