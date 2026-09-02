"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon, XIcon } from "@phosphor-icons/react";
import { validateDialog } from "@/lib/actions/pegawai";
import { Button } from "@/components/ui/button";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function ValidationPanel({
  dialogId,
  roleLabel = "Pegawai",
}: {
  dialogId: string;
  roleLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [setuju, setSetuju] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    if (pending || !setuju) return;
    setPending(true);

    const result = await validateDialog(dialogId, {
      setuju,
    });

    if (result?.error) {
      showError(result.error);
      setPending(false);
      return;
    }

    showSuccess("Dialog kinerja berhasil divalidasi");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
            <SealCheckIcon size={22} weight="bold" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-ink">
              Validasi Dialog Kinerja ({roleLabel})
            </h3>
            <p className="text-xs text-ink-muted">
              Dialog telah ditinjau dan siap divalidasi secara resmi.
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="default"
          onClick={() => setOpen(true)}
          className="shrink-0"
        >
          <SealCheckIcon size={16} weight="bold" />
          Validasi Dialog
        </Button>
      </div>

      {/* Alert Modal Validasi */}
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
              disabled={pending}
              className="absolute right-4 top-4 rounded-md p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <XIcon size={18} weight="bold" />
            </button>

            <h3 className="text-lg font-bold text-ink">
              Konfirmasi Validasi Dialog ({roleLabel})
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">
              Pastikan Anda telah meninjau seluruh aspek dan rincian dialog kinerja ini sebelum memberikan validasi resmi.
            </p>

            <div className="mt-5 rounded-lg border border-outline bg-surface-muted/40 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-ink font-medium">
                <input
                  type="checkbox"
                  checked={setuju}
                  onChange={(e) => setSetuju(e.target.checked)}
                  disabled={pending}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-strong accent-[#0e7490]"
                />
                <span>
                  Saya telah membaca dan menyetujui seluruh isi dialog kinerja ini.
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending || !setuju}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                ) : null}
                {pending ? "Memproses…" : "Ya, Validasi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
