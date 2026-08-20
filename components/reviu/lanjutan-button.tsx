"use client";

import { useState } from "react";
import { ArrowSquareRightIcon, XIcon } from "@phosphor-icons/react";
import { createDialogLanjutan } from "@/lib/actions/lanjutan";
import { error as showError } from "@/components/ui/toast";
import type { Triwulan } from "@/generated/prisma/enums";

export function EvaluasiLanjutanButton({
  reviuId,
  defaultTahun = new Date().getFullYear(),
  defaultTriwulan = "TW3",
}: {
  reviuId: number;
  defaultTahun?: number;
  defaultTriwulan?: Triwulan;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [tahun, setTahun] = useState<number>(defaultTahun);
  const [triwulan, setTriwulan] = useState<Triwulan>(defaultTriwulan);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await createDialogLanjutan(reviuId, {
      periode_tahun: tahun,
      triwulan,
    });
    setPending(false);

    if (result?.error) {
      showError(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
      >
        <ArrowSquareRightIcon size={15} weight="bold" />
        Evaluasi Lanjutan
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-xl border border-outline bg-surface p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <XIcon size={18} weight="bold" />
            </button>

            <h3 className="text-lg font-bold text-ink">
              Buat Dialog Kinerja Lanjutan
            </h3>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              Pilih periode tahun dan triwulan untuk dialog kinerja lanjutan ini. Item evaluasi yang belum tercapai dari dialog sebelumnya akan otomatis disalin.
            </p>

            <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="modal_periode_tahun"
                  className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
                >
                  Tahun Periode
                </label>
                <select
                  id="modal_periode_tahun"
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="modal_triwulan"
                  className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
                >
                  Triwulan
                </label>
                <select
                  id="modal_triwulan"
                  value={triwulan}
                  onChange={(e) => setTriwulan(e.target.value as Triwulan)}
                  className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                >
                  <option value="TW1">Triwulan I</option>
                  <option value="TW2">Triwulan II</option>
                  <option value="TW3">Triwulan III</option>
                  <option value="TW4">Triwulan IV</option>
                </select>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:opacity-50"
                >
                  {pending ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                  ) : null}
                  {pending ? "Membuat…" : "Buat Dialog Lanjutan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
