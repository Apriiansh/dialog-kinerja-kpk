"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react";
import { deleteUnit } from "@/lib/actions/admin-unit";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function AdminUnitDeleteButton({
  id,
  nama,
  userCount = 0,
  childCount = 0,
}: {
  id: number;
  nama: string;
  userCount?: number;
  childCount?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const blocked = userCount > 0 || childCount > 0;

  async function handleDelete() {
    setPending(true);
    if (
      !confirm(`Hapus permanen ${nama}? Tindakan ini tidak dapat dibatalkan.`)
    ) {
      setPending(false);
      return;
    }

    const result = await deleteUnit(id);
    setPending(false);

    if (result?.error) {
      showError(result.error);
      return;
    }
    showSuccess("Unit berhasil dihapus");
    router.refresh();
  }

  if (blocked) {
    return (
      <button
        type="button"
        title="Unit masih memiliki sub-unit atau pengguna"
        disabled
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline/60 px-3 text-xs font-semibold text-ink-muted/40 disabled:opacity-50"
      >
        <TrashIcon size={14} weight="bold" />
        Hapus
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-error/30 px-3 text-xs font-semibold text-error transition-colors hover:bg-error-container disabled:opacity-50"
    >
      {pending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
      ) : (
        <>
          <TrashIcon size={14} weight="bold" />
          Hapus
        </>
      )}
    </button>
  );
}
