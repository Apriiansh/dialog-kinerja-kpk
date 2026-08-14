"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { deleteReviu } from "@/lib/actions/reviu";

export function DeleteReviuButton({ reviuId }: { reviuId: number }) {
  return (
    <form
      action={deleteReviu.bind(null, reviuId)}
      onSubmit={(e) => {
        if (!confirm("Hapus reviu draft ini? Tindakan tidak dapat dibatalkan.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="Hapus reviu"
        className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-error transition-colors hover:bg-error-container"
      >
        <TrashIcon size={14} weight="bold" />
      </button>
    </form>
  );
}
