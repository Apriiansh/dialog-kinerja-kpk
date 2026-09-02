"use client";

import { CalendarIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { error as showError, success as showSuccess, warning as showWarning } from "@/components/ui/toast";
import { formatPeriode, getTriwulanFromDate } from "@/lib/constants/triwulan";
import { dateInputFromDaysFromNow } from "@/lib/utils";
import { AutoResizeTextarea } from "@/components/dialog/auto-resize-textarea";

export interface JadwalDialogModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  successMessage: string;
  dateInputId: string;
  deskripsiInputId: string;
  deskripsiLabel?: string;
  deskripsiPlaceholder?: string;
  initialJadwal?: string;
  initialDeskripsi?: string;
  children?: React.ReactNode;
  onSubmit: (
    jadwalDate: string,
    deskripsi: string,
  ) => Promise<{ error?: string } | null | undefined>;
}

export function JadwalDialogModal({ open, ...props }: JadwalDialogModalProps) {
  if (!open) return null;
  return <JadwalDialogForm {...props} />;
}

function JadwalDialogForm({
  onClose,
  title,
  submitLabel,
  successMessage,
  dateInputId,
  deskripsiInputId,
  deskripsiLabel = "Catatan / Konteks Pengajuan (Opsional)",
  deskripsiPlaceholder,
  initialJadwal,
  initialDeskripsi,
  children,
  onSubmit,
}: Omit<JadwalDialogModalProps, "open">) {
  const minDateStr = dateInputFromDaysFromNow(2);

  const [jadwalDate, setJadwalDate] = useState(() =>
    initialJadwal && initialJadwal >= minDateStr ? initialJadwal : minDateStr,
  );
  const [deskripsi, setDeskripsi] = useState(() => initialDeskripsi ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const autoPeriode = useMemo(() => {
    if (!jadwalDate) return null;
    const parts = jadwalDate.split("-");
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(d.getTime())) return null;
    const tw = getTriwulanFromDate(d);
    return { tw, label: formatPeriode(tw, d.getFullYear()) };
  }, [jadwalDate]);

  const isBelowMin = Boolean(jadwalDate) && jadwalDate < minDateStr;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jadwalDate) {
      showError("Pilih tanggal jadwal dialog.");
      return;
    }
    if (jadwalDate < minDateStr) {
      showWarning("Jadwal dialog paling cepat 2 (dua) hari setelah hari ini.");
      return;
    }
    setLoading(true);
    const res = await onSubmit(jadwalDate, deskripsi);
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    showSuccess(successMessage);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-xl bg-surface shadow-2xl border border-outline overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline px-6 py-4 bg-surface">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink cursor-pointer"
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {children}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={dateInputId}
              className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5"
            >
              <CalendarIcon size={14} weight="bold" />
              Tanggal Pelaksanaan Dialog *
            </label>
            <input
              id={dateInputId}
              type="date"
              required
              value={jadwalDate}
              onChange={(e) => {
                const next = e.target.value;
                if (next && next < minDateStr) {
                  showWarning(
                    "Jadwal paling cepat 2 (dua) hari setelah hari ini.",
                  );
                }
                setJadwalDate(next);
              }}
              className="h-10 w-full rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
            />
            {isBelowMin ? (
              <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                <WarningIcon size={14} weight="bold" className="mt-0.5 shrink-0 text-amber-500" />
                Tanggal ini sebelum batas minimum. Jadwal dialog paling cepat 2 (dua) hari dari hari ini.
              </p>
            ) : null}
          </div>

          {autoPeriode ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary font-medium">
              Periode Terdeteksi: <strong className="font-bold">{autoPeriode.label}</strong>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={deskripsiInputId}
              className="text-xs font-bold uppercase tracking-wider text-ink-muted"
            >
              {deskripsiLabel}
            </label>
            <AutoResizeTextarea
              id={deskripsiInputId}
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder={deskripsiPlaceholder}
              className="w-full rounded-lg border border-outline bg-surface p-3 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-outline pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}