"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react";
import { deleteMetode } from "@/lib/actions/admin-metode";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export function AdminMetodeDeleteButton({
  id,
  nama,
  digunakan,
}: {
  id: number;
  nama: string;
  digunakan?: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);

    const warning =
      digunakan && digunakan > 0
        ? ` ${nama} saat ini dipakai pada ${digunakan} item dialog kinerja. Item dialog tetap tersimpan, hanya hubungan ke metode ini yang dihapus.`
        : "";
    if (
      !confirm(`Hapus permanen ${nama}?${warning} Tindakan ini tidak dapat dibatalkan.`)
    ) {
      setPending(false);
      return;
    }

    const result = await deleteMetode(id);
    setPending(false);

    if (result?.error) {
      showError(result.error);
      return;
    }
    showSuccess("Metode pengembangan berhasil dihapus");
    router.refresh();
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