"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon } from "@phosphor-icons/react";
import { validateDialog } from "@/lib/actions/pegawai";
import { Button } from "@/components/ui/button";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function ValidationPanel({
  dialogId,
  roleLabel = "Pegawai",
}: {
  dialogId: number;
  roleLabel?: string;
}) {
  const router = useRouter();
  const [setuju, setSetuju] = useState(false);
  const [pending, setPending] = useState(false);

  const canSubmit = setuju && !pending;

  async function handleSubmit() {
    setPending(true);

    const result = await validateDialog(dialogId, {
      setuju,
      ttdDataUrl: null,
    });

    if (result?.error) {
      showError(result.error);
      setPending(false);
      return;
    }

    showSuccess("Dialog berhasil divalidasi");
    router.refresh();
  }

  return (
    <section
      aria-labelledby="validasi-heading"
      className="rounded-lg border border-outline bg-surface"
    >
      <div className="border-b border-outline px-5 py-3.5">
        <h2 id="validasi-heading" className="text-sm font-semibold text-ink">
          Validasi ({roleLabel})
        </h2>
        <p className="mt-0.5 text-xs leading-4 text-ink-muted">
          Tinjau kembali isi dialog di atas, lalu beri persetujuan Anda.
        </p>
      </div>

      <div className="flex flex-col gap-5 px-5 py-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-ink">
          <input
            type="checkbox"
            checked={setuju}
            onChange={(e) => setSetuju(e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-strong accent-[#1e3a8a]"
          />
          <span>
            Saya telah membaca dan menyetujui seluruh isi dialog kinerja ini.
          </span>
        </label>

        <div className="flex justify-end">
          <Button
            type="button"
            size="default"
            loading={pending}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <SealCheckIcon size={16} weight="bold" />
            Validasi
          </Button>
        </div>
      </div>
    </section>
  );
}