"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon, XIcon } from "@phosphor-icons/react";
import { submitReviuAtasan, validateReviu } from "@/lib/actions/reviu";
import { ReviuRejectForm } from "@/components/reviu/reject-form";
import { Button } from "@/components/ui/button";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function ReviuSignForm({
  reviuId,
  role = "pegawai",
}: {
  reviuId: string;
  role?: "atasan" | "pegawai";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [setuju, setSetuju] = useState(false);
  const [pending, setPending] = useState(false);

  const label = role === "atasan" ? "Atasan" : "Pegawai";

  async function handleSubmit() {
    if (pending || !setuju) return;
    setPending(true);

    const input = { setuju };
    const result =
      role === "atasan"
        ? await submitReviuAtasan(reviuId, input)
        : await validateReviu(reviuId, input);

    if (result?.error) {
      showError(result.error);
      setPending(false);
      return;
    }

    showSuccess(
      role === "atasan"
        ? "Reviu berhasil disetujui, menunggu validasi pegawai"
        : "Reviu berhasil divalidasi dan selesai",
    );
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
              {role === "atasan" ? "Persetujuan Hasil Evaluasi" : "Validasi Hasil Evaluasi"} ({label})
            </h3>
            <p className="text-xs text-ink-muted">
              {role === "atasan"
                ? "Tinjau evaluasi tindak lanjut dan berikan persetujuan atasan."
                : "Tinjau evaluasi tindak lanjut dan berikan validasi akhir pegawai."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {role === "atasan" ? <ReviuRejectForm reviuId={reviuId} /> : null}
          <Button
            type="button"
            size="default"
            onClick={() => setOpen(true)}
            className="shrink-0"
          >
            <SealCheckIcon size={16} weight="bold" />
            {role === "atasan" ? "Setujui Reviu" : "Validasi Reviu"}
          </Button>
        </div>
      </div>

      {/* Alert Modal Validasi Reviu */}
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
              Konfirmasi {role === "atasan" ? "Persetujuan" : "Validasi"} Reviu ({label})
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">
              Pastikan Anda telah memeriksa seluruh hasil evaluasi dan tindak lanjut ini sebelum memberikan {role === "atasan" ? "persetujuan" : "validasi resmi"}.
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
                  Saya telah membaca dan menyetujui seluruh isi reviu ini.
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
                {pending
                  ? "Memproses…"
                  : role === "atasan"
                  ? "Ya, Setujui"
                  : "Ya, Validasi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
