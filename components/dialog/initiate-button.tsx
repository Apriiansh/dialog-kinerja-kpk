"use client";

import { CalendarIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { initiateDialog } from "@/lib/actions/pegawai";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { formatPeriode, getTriwulanFromDate } from "@/lib/constants/triwulan";

export function InitiateDialogButton() {
  const [open, setOpen] = useState(false);
  const [jadwalDate, setJadwalDate] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default to today or tomorrow
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setJadwalDate(`${yyyy}-${mm}-${dd}`);
  }, []);

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
    });
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    showSuccess("Pengajuan dialog berhasil dikirim ke atasan.");
    setOpen(false);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
      >
        <PlusIcon size={16} weight="bold" />
        Ajukan Dialog Kinerja
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ajukan Dialog Kinerja"
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
                  Ajukan Jadwal Dialog Kinerja
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  Pilih tanggal pelaksanaan dialog. Periode & Triwulan akan ditentukan secara otomatis.
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
                  placeholder="Tuliskan konteks atau topik utama yang ingin didiskusikan..."
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
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
