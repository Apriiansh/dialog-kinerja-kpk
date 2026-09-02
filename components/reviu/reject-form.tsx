"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon, XIcon } from "@phosphor-icons/react";
import { rejectReviu } from "@/lib/actions/reviu";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function ReviuRejectForm({ reviuId }: { reviuId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [pending, setPending] = useState(false);

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!alasanTolak.trim()) {
      showError("Catatan revisi wajib diisi.");
      return;
    }
    setPending(true);

    const result = await rejectReviu(reviuId, alasanTolak);

    if (result?.error) {
      showError(result.error);
      setPending(false);
      return;
    }

    showSuccess("Reviu dikembalikan ke pegawai untuk revisi.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
      >
        <ArrowsClockwiseIcon size={16} weight="bold" />
        Tolak (Revisi)
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-outline bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="absolute right-4 top-4 rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <XIcon size={18} weight="bold" />
            </button>

            <h3 className="text-lg font-bold text-ink">
              Kembalikan Reviu untuk Revisi
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">
              Berikan catatan perbaikan kepada pegawai. Reviu akan dikembalikan
              agar isian diperbaiki lalu dikirim ulang.
            </p>

            <form onSubmit={handleReject} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="alasan-tolak-reviu"
                  className="text-xs font-bold uppercase tracking-wider text-ink-muted"
                >
                  Catatan Revisi *
                </label>
                <textarea
                  id="alasan-tolak-reviu"
                  rows={4}
                  required
                  value={alasanTolak}
                  onChange={(e) => setAlasanTolak(e.target.value)}
                  placeholder="Contoh: Penjelasan pencapaian perlu dilengkapi dengan data pendukung…"
                  className="w-full rounded-lg border border-outline bg-surface p-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending || !alasanTolak.trim()}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {pending ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                  ) : null}
                  {pending ? "Mengembalikan…" : "Kirim Catatan Revisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}