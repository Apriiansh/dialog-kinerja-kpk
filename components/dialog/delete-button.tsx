"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react";
import { deleteDialog } from "@/lib/actions/atasan";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function DeleteDialogButton({ dialogId }: { dialogId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Hapus dialog draft ini? Tindakan tidak dapat dibatalkan.")) {
      return;
    }

    setPending(true);
    const result = await deleteDialog(dialogId);
    setPending(false);

    if (result?.error) {
      showError(result.error);
      return;
    }
    showSuccess("Dialog berhasil dihapus");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Hapus dialog"
      className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-error transition-colors hover:bg-error-container disabled:opacity-50"
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      ) : (
        <TrashIcon size={14} weight="bold" />
      )}
    </button>
  );
}
