"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon } from "@phosphor-icons/react";
import { submitReviuAtasan, validateReviu } from "@/lib/actions/reviu";
import { Button } from "@/components/ui/button";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { SignaturePadField } from "@/components/signature-pad";

export function ReviuSignForm({
  reviuId,
  role = "pegawai",
}: {
  reviuId: number;
  role?: "atasan" | "pegawai";
}) {
  const router = useRouter();
  const [setuju, setSetuju] = useState(false);
  const [ttdDataUrl, setTtdDataUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = setuju && ttdDataUrl !== null && !pending;
  const label = role === "atasan" ? "Atasan" : "Pegawai";

  async function handleSubmit() {
    setPending(true);

    const input = { setuju, ttdDataUrl };
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
        ? "Reviu berhasil ditandatangani, menunggu validasi pegawai"
        : "Reviu berhasil divalidasi dan selesai",
    );
    router.refresh();
  }

  return (
    <section
      aria-labelledby="reviu-sign-heading"
      className="rounded-lg border border-outline bg-surface"
    >
      <div className="border-b border-outline px-5 py-3.5">
        <h2
          id="reviu-sign-heading"
          className="text-sm font-semibold text-ink"
        >
          Reviu &amp; Tanda Tangan ({label})
        </h2>
        <p className="mt-0.5 text-xs leading-4 text-ink-muted">
          Tinjau kembali isi reviu di atas, lalu beri persetujuan dan tanda
          tangan Anda.
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
            Saya telah membaca dan menyetujui seluruh isi reviu ini.
          </span>
        </label>

        <SignaturePadField
          onChange={setTtdDataUrl}
          disabled={pending}
          label={`Tanda Tangan ${label}`}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            size="default"
            loading={pending}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <SealCheckIcon size={16} weight="bold" />
            {role === "atasan"
              ? "Reviu & Tanda Tangani"
              : "Validasi & Tanda Tangani"}
          </Button>
        </div>
      </div>
    </section>
  );
}
