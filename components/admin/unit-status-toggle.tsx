"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUnitStatus } from "@/lib/actions/admin-unit";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function AdminUnitStatusToggle({
  id,
  nama,
  isActive,
  disabled: locked,
}: {
  id: number;
  nama: string;
  isActive: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;

    const next = !isActive;
    if (isActive) {
      const ok = confirm(
        `Nonaktifkan ${nama}? Unit ini tidak akan bisa ditautkan ke pengguna sampai diaktifkan kembali.`,
      );
      if (!ok) return;
    }

    setPending(true);

    try {
      const result = await setUnitStatus(id, next);
      if (result?.error) {
        showError(result.error);
        return;
      }
      showSuccess(
        next ? "Unit berhasil diaktifkan" : "Unit berhasil dinonaktifkan",
      );
      router.refresh();
    } catch (err) {
      console.error(err);
      showError("Terjadi kesalahan saat mengubah status. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-disabled={pending}
        onClick={handleToggle}
        disabled={pending || locked}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors duration-200 focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive ? "bg-status-green" : "bg-ink-muted/30"
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isActive ? "translate-x-5.5" : "translate-x-0.5"
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
  );
}
