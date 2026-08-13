"use client";

import { useState } from "react";
import { WarningIcon } from "@phosphor-icons/react";
import {
  aktifkanPegawai,
  nonaktifkanPegawai,
  type PegawaiStatusState,
} from "@/lib/actions/pegawai-admin";

export function PegawaiStatusToggle({
  id,
  nama,
  isActive,
}: {
  id: number;
  nama: string;
  isActive: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleToggle() {
    if (pending) return;

    if (isActive) {
      const ok = confirm(
        `Nonaktifkan ${nama}? Pegawai ini tidak dapat login sampai diaktifkan kembali.`,
      );
      if (!ok) return;
    }

    setPending(true);
    setError(undefined);

    try {
      const result: PegawaiStatusState = isActive
        ? await nonaktifkanPegawai(id)
        : await aktifkanPegawai(id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat mengubah status. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          aria-disabled={pending}
          onClick={handleToggle}
          disabled={pending}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors duration-200 focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 ${
            isActive ? "bg-status-green" : "bg-ink-muted/30"
          }`}
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isActive ? "translate-x-[22px]" : "translate-x-[2px]"
            }`}
          />
        </button>
        <span
          className={`text-[11px] font-bold ${
            isActive ? "text-status-green" : "text-error"
          }`}
        >
          {isActive ? "AKTIF" : "NONAKTIF"}
        </span>
      </div>
      {error ? (
        <span className="flex items-center gap-1 text-xs font-medium text-error">
          <WarningIcon size={13} weight="fill" />
          {error}
        </span>
      ) : null}
    </div>
  );
}