"use client";

import { PencilSimpleLineIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { updateDraftDialog, deleteDraftDialog } from "@/lib/actions/pegawai";
import { error as showError } from "@/components/ui/toast";
import { dateInputFromDaysFromNow } from "@/lib/utils";
import { JadwalDialogModal } from "@/components/dialog/jadwal-dialog-modal";

export function PegawaiDraftActions({
  dialogId,
  currentJadwal,
  currentDeskripsi,
}: {
  dialogId: string;
  currentJadwal: string; // YYYY-MM-DD
  currentDeskripsi?: string;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await deleteDraftDialog(dialogId);
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    setOpenDelete(false);
  }

  const minDateStr = dateInputFromDaysFromNow(2);
  const initialJadwal =
    currentJadwal && currentJadwal >= minDateStr ? currentJadwal : minDateStr;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setOpenEdit(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted cursor-pointer"
      >
        <PencilSimpleLineIcon size={15} weight="bold" />
        Edit Pengajuan
      </button>

      <button
        type="button"
        onClick={() => setOpenDelete(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 cursor-pointer"
      >
        <TrashIcon size={15} weight="bold" />
        Hapus Draft
      </button>

      <JadwalDialogModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Pengajuan Dialog"
        submitLabel="Simpan Perubahan"
        successMessage="Pengajuan dialog berhasil diperbarui."
        dateInputId="edit-jadwal-date"
        deskripsiInputId="edit-deskripsi"
        deskripsiLabel="Catatan / Konteks Pengajuan"
        initialJadwal={initialJadwal}
        initialDeskripsi={currentDeskripsi ?? ""}
        onSubmit={async (jadwalDate, deskripsi) =>
          updateDraftDialog(dialogId, {
            jadwal_dialog: jadwalDate,
            deskripsi_pegawai: deskripsi,
          })
        }
      />

      {openDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setOpenDelete(false)}
        >
          <div
            className="flex w-full max-w-md flex-col rounded-xl bg-surface p-6 shadow-2xl border border-outline"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-ink">Hapus Draft Pengajuan Dialog?</h3>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Apakah Anda yakin ingin menghapus draft pengajuan dialog ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenDelete(false)}
                className="h-9 rounded-md border border-outline px-4 text-xs font-semibold text-ink hover:bg-surface-muted cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
                Ya, Hapus Draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
