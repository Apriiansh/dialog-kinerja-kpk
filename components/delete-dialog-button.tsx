"use client";

import { Trash } from "@phosphor-icons/react";
import { deleteDialog } from "@/app/(app)/actions";

export function DeleteDialogButton({ dialogId }: { dialogId: number }) {
  return (
    <form
      action={deleteDialog.bind(null, dialogId)}
      onSubmit={(e) => {
        if (!confirm("Hapus dialog draft ini? Tindakan tidak dapat dibatalkan.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="Hapus dialog"
        className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-error transition-colors hover:bg-error-container"
      >
        <Trash size={14} weight="bold" />
      </button>
    </form>
  );
}
