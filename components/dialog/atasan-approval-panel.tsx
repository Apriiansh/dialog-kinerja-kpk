"use client";

import { CheckIcon, XIcon, MailboxIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { approveDialog, rejectDialog } from "@/lib/actions/atasan";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { getOutlookLink } from "@/lib/utils/outlook";

export function AtasanApprovalPanel({
  dialogId,
  jadwalDialog,
  deskripsiPegawai,
  initialDeskripsiAtasan,
}: {
  dialogId: number;
  jadwalDialog?: Date | null;
  deskripsiPegawai?: string | null;
  initialDeskripsiAtasan?: string | null;
}) {
  const [openReject, setOpenReject] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [deskripsiAtasan, setDeskripsiAtasan] = useState(initialDeskripsiAtasan ?? "");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const res = await approveDialog(dialogId, deskripsiAtasan);
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    showSuccess("Pengajuan dialog disetujui. Pegawai dapat melengkapi isian aspek.");
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!alasanTolak.trim()) {
      showError("Alasan pengembalian wajib diisi.");
      return;
    }
    setLoading(true);
    const res = await rejectDialog(dialogId, alasanTolak);
    setLoading(false);

    if (res?.error) {
      showError(res.error);
      return;
    }
    showSuccess("Pengajuan dialog dikembalikan ke pegawai untuk revisi.");
    setOpenReject(false);
  }

  const formattedDate = jadwalDialog
    ? new Date(jadwalDialog).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Belum ditentukan";

  const outlookHref = jadwalDialog ? getOutlookLink({
    title: `Dialog Kinerja - ${deskripsiPegawai?.slice(0, 50) || "Pegawai"}`,
    start: jadwalDialog,
    end: new Date(new Date(jadwalDialog).getTime() + 60 * 60 * 1000),
    body: [
      `Jadwal Dialog Kinerja`,
      `Tanggal: ${formattedDate}`,
      deskripsiPegawai ? `Catatan Pegawai ${deskripsiPegawai}` : "",
      deskripsiAtasan ? `Catatan Atasan ${deskripsiAtasan}` : "",
      `---`,
      `Link ${typeof window !== "undefined" ? window.location.href : ""}`
      ].filter(Boolean).join("\n\n"),
  }): null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-ink">
          Persetujuan Pengajuan Jadwal Dialog Kinerja
        </h3>
        <p className="text-xs text-ink-muted">
          Pegawai mengajukan jadwal pelaksanaan dialog kinerja. Pilih untuk menyetujui atau mengembalikan dengan catatan revisi.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-outline bg-surface-muted/50 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Jadwal Pelaksanaan Pegawai:
          </span>
          <span className="text-sm font-semibold text-primary">{formattedDate}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            {deskripsiAtasan.trim() ? "Deskripsi Kinerja (versi Pegawai):" : "Deskripsi Kinerja (Pegawai):"}
          </span>
          <span className="text-xs font-medium text-ink">
            {deskripsiPegawai || "—"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <label
          htmlFor="deskripsi-atasan-input"
          className="text-xs font-bold uppercase tracking-wider text-ink-muted"
        >
          {deskripsiPegawai?.trim() ? "Deskripsi Kinerja (versi Atasan - Opsional)" : "Deskripsi Kinerja (Atasan - Opsional)"}
        </label>
        <textarea
          id="deskripsi-atasan-input"
          rows={2}
          value={deskripsiAtasan}
          onChange={(e) => setDeskripsiAtasan(e.target.value)}
          placeholder="Tuliskan arahan/deskripsi kinerja dari Anda untuk pegawai ini (opsional)..."
          className="w-full rounded-lg border border-outline bg-surface p-3 text-xs text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setOpenReject(true)}
          disabled={loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-4 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 cursor-pointer disabled:opacity-50"
        >
          <XIcon size={15} weight="bold" />
          Kembalikan (Minta Revisi)
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <CheckIcon size={15} weight="bold" />
          )}
          Setujui Pengajuan
        </button>
        {outlookHref && (
          <a
            href={outlookHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-blue-500 px-4 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-surface cursor-pointer"
          >
            <MailboxIcon size={15} weight="bold" />
            Tambah ke Outlook
          </a>
        )}
      </div>

      {/* Reject Modal */}
      {openReject ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
          onClick={() => setOpenReject(false)}
        >
          <div
            className="flex w-full max-w-md flex-col rounded-xl bg-surface shadow-2xl border border-outline overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline px-6 py-4">
              <h3 className="text-base font-bold text-ink">Kembalikan Pengajuan Dialog</h3>
              <button
                type="button"
                onClick={() => setOpenReject(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted cursor-pointer"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleReject} className="flex flex-col gap-4 p-6">
              <p className="text-xs text-ink-muted leading-5">
                Berikan catatan atau pertimbangan mengapa jadwal/pengajuan perlu direvisi oleh pegawai.
              </p>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="alasan-tolak"
                  className="text-xs font-bold uppercase tracking-wider text-ink-muted"
                >
                  Catatan Revisi *
                </label>
                <textarea
                  id="alasan-tolak"
                  rows={3}
                  required
                  value={alasanTolak}
                  onChange={(e) => setAlasanTolak(e.target.value)}
                  placeholder="Contoh: Tanggal tersebut bentrok dengan agenda divisi, mohon geser ke hari Jumat..."
                  className="w-full rounded-lg border border-outline bg-surface p-3 text-xs text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-outline pt-4">
                <button
                  type="button"
                  onClick={() => setOpenReject(false)}
                  className="h-9 rounded-md border border-outline px-4 text-xs font-semibold text-ink hover:bg-surface-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  Kirim Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
