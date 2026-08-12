"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon, WarningIcon } from "@phosphor-icons/react";
import { validateDialog } from "@/app/(app)/dialog/[id]/actions";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { SignaturePadField } from "@/components/signature-pad";

export function ValidationPanel({
  dialogId,
  roleLabel = "Pegawai",
}: {
  dialogId: number;
  roleLabel?: string;
}) {
  const router = useRouter();
  const [setuju, setSetuju] = useState(false);
  const [ttdDataUrl, setTtdDataUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit = setuju && ttdDataUrl !== null && !pending;

  async function handleSubmit() {
    setError(undefined);
    setPending(true);

    const result = await validateDialog(dialogId, {
      setuju,
      ttdDataUrl,
    });

    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <section
      aria-labelledby="validasi-heading"
      className="rounded-lg border border-outline bg-surface"
    >
      <div className="border-b border-outline px-5 py-3.5">
        <h2 id="validasi-heading" className="text-sm font-semibold text-ink">
          Validasi &amp; Tanda Tangan ({roleLabel})
        </h2>
        <p className="mt-0.5 text-xs leading-4 text-ink-muted">
          Tinjau kembali isi dialog di atas, lalu beri persetujuan dan tanda
          tangan Anda.
        </p>
      </div>

      <div className="flex flex-col gap-5 px-5 py-4">
        {error ? (
          <Banner tone="error" icon={<WarningIcon size={18} weight="fill" />}>
            {error}
          </Banner>
        ) : null}

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

        <SignaturePadField
          onChange={setTtdDataUrl}
          disabled={pending}
          label="Tanda Tangan Pegawai"
        />

        <div className="flex justify-end">
          <Button
            type="button"
            size="md"
            loading={pending}
            disabled={!canSubmit}
            onClick={handleSubmit}
            leadingIcon={<SealCheckIcon size={16} weight="bold" />}
          >
            Validasi &amp; Tanda Tangani
          </Button>
        </div>
      </div>
    </section>
  );
}