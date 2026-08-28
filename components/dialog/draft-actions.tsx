"use client";

import { CalendarIcon, PencilSimpleLineIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { updateDraftDialog, deleteDraftDialog } from "@/lib/actions/pegawai";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { dateInputFromDaysFromNow } from "@/lib/utils";
import { AutoResizeTextarea } from "@/components/dialog/auto-resize-textarea";

export function PegawaiDraftActions({
  dialogId,
  currentJadwal,
  currentDeskripsi,
}: {
  dialogId: number;
  currentJadwal: string; // YYYY-MM-DD
  currentDeskripsi?: string;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [jadwalDate, setJadwalDate] = useState(currentJadwal);
  const [deskripsi, setDeskripsi] = useState(currentDeskripsi ?? "");
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const minDateStr = dateInputFromDaysFromNow(2);
    if (!jadwalDate) {
      showError("Pilih tanggal jadwal dialog.");
      return;
    }
    if (jadwalDate < minDateStr) {
      showError("Jadwal dialog paling cepat 2 (dua) hari setelah hari ini.");
      return;
    }
    setLoading(true);
    const res = await updateDraftDialog(dialogId, {
      jadwal_dialog: jadwalDate,
      deskripsi_pegawai: deskripsi,
    });
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    showSuccess("Pengajuan dialog berhasil diperbarui.");
    setOpenEdit(false);
  }

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (currentJadwal < minDateStr) setJadwalDate(minDateStr);
          setOpenEdit(true);
        }}
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

      {/* Edit Modal */}
      {openEdit ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setOpenEdit(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col rounded-xl bg-surface shadow-2xl border border-outline overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline px-6 py-4">
              <h2 className="text-base font-bold text-ink">Edit Pengajuan Dialog</h2>
              <button
                type="button"
                onClick={() => setOpenEdit(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted cursor-pointer"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-jadwal-date" className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <CalendarIcon size={14} weight="bold" />
                  Tanggal Pelaksanaan Dialog *
                </label>
                <input
                  id="edit-jadwal-date"
                  type="date"
                  min={minDateStr}
                  required
                  value={jadwalDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next && next < minDateStr) {
                      showError(
                        "Jadwal dialog paling cepat 2 (dua) hari setelah hari ini.",
                      );
                      return;
                    }
                    setJadwalDate(next);
                  }}
                  className="h-10 w-full rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-deskripsi" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Catatan / Konteks Pengajuan
                </label>
                <AutoResizeTextarea
                  id="edit-deskripsi"
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full rounded-lg border border-outline bg-surface p-3 text-xs text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 border-t border-outline pt-4">
                <button
                  type="button"
                  onClick={() => setOpenEdit(false)}
                  className="h-9 rounded-md border border-outline px-4 text-xs font-semibold text-ink hover:bg-surface-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-on-primary hover:bg-primary-strong cursor-pointer disabled:opacity-50"
                >
                  {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
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
