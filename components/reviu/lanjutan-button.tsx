"use client";

import { useState } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { createDialogLanjutan } from "@/lib/actions/lanjutan";
import { error as showError } from "@/components/ui/toast";

export function EvaluasiLanjutanButton({ reviuId }: { reviuId: number }) {
  const [pending, setPending] = useState(false);

  async function handleCreate() {
    if (
      !confirm(
        "Buat Dialog Kinerja lanjutan dari reviu ini? Item yang belum tercapai akan otomatis disalin ke dialog baru.",
      )
    ) {
      return;
    }

    setPending(true);
    const result = await createDialogLanjutan(reviuId);
    setPending(false);

    if (result?.error) {
      showError(result.error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted disabled:opacity-60"
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      ) : (
        <ArrowCounterClockwiseIcon size={15} weight="bold" />
      )}
      Evaluasi Lanjutan
    </button>
  );
}
