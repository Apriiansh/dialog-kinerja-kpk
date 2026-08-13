"use client";

import { useState } from "react";
import { TrashIcon, WarningIcon } from "@phosphor-icons/react";
import {
  deleteAdminUser,
  type AdminUserStatusState,
} from "@/lib/actions/admin-users";

export function AdminUserDeleteButton({
  id,
  nama,
}: {
  id: number;
  nama: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleDelete() {
    setPending(true);
    setError(undefined);

    if (!confirm(`Hapus permanen ${nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      setPending(false);
      return;
    }

    const result: AdminUserStatusState = await deleteAdminUser(id);
    setPending(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-1">
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
      {error ? (
        <span className="flex items-center gap-1 text-xs font-medium text-error">
          <WarningIcon size={13} weight="fill" />
          {error}
        </span>
      ) : null}
    </div>
  );
}