import { EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { StatusDialog } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeleteDialogButton } from "@/components/dialog/delete-button";
import { UnduhBuktiLink } from "@/components/shared/unduh-bukti-link";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";

export interface DialogRow {
  id: number;
  periode_tahun: number;
  status: StatusDialog;
  is_valid_pegawai: boolean;
  is_valid_atasan: boolean;
  id_dialog_induk: number | null;
  dialog_induk: { periode_tahun: number } | null;
  dialog_lanjutan: { id: number }[];
  pegawai: {
    nama_pegawai: string;
    nama_jabatan: string | null;
    unit_kerja: string | null;
  };
  sequence_number?: number;
}

export function DialogList({ dialogs }: { dialogs: DialogRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline bg-surface">
      <table className="w-full text-left">
        <thead className="border-b border-outline">
          <tr className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
            <th className="px-6 py-3">Pegawai</th>
            <th className="px-6 py-3">Periode</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Validasi</th>
            <th className="px-6 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline">
          {dialogs.map((dialog) => {
            const lengkap = dialog.is_valid_pegawai && dialog.is_valid_atasan;
            const draft = dialog.status === "draft_atasan";
            const perluEvaluasi = dialog.status === "menunggu_atasan";
            const hasLanjutan = dialog.dialog_lanjutan.length > 0;
            return (
              <tr
                key={dialog.id}
                className="transition-colors hover:bg-surface-muted"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-ink">
                      {dialog.pegawai.nama_pegawai}
                    </span>
                    <span className="text-xs leading-4 text-ink-muted">
                      {dialog.pegawai.nama_jabatan ?? "—"}
                      {dialog.pegawai.unit_kerja
                        ? ` · ${dialog.pegawai.unit_kerja}`
                        : ""}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-ink">
                  <div className="flex flex-col gap-1">
                    <span>
                      {dialog.sequence_number ? `Dialog Ke-${dialog.sequence_number} ` : ""}
                      (Tahun {dialog.periode_tahun})
                    </span>
                    {dialog.dialog_induk ? (
                      <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Lanjutan dari {dialog.dialog_induk.periode_tahun}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={dialog.status} />
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-semibold ${lengkap ? "text-secondary" : "text-amber-800"
                      }`}
                  >
                    {lengkap ? "Lengkap" : "Belum lengkap"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {draft ? (
                      <>
                        <Link
                          href={`/atasan/dialog/${dialog.id}/edit`}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-faint"
                        >
                          <PencilSimpleIcon size={12} weight="bold" />
                          Edit
                        </Link>
                        {dialog.status === "selesai" && hasLanjutan ? (
                          <span className="text-[11px] font-semibold text-ink-muted">
                            Lanjutan sudah dibuat
                          </span>
                        ) : null}
                        <DeleteDialogButton dialogId={dialog.id} />
                      </>
                    ) : (
                      <>
                        {dialog.status === "selesai" ? (
                          <>
                            <UnduhBuktiLink
                              path="/atasan/dialog"
                              dialogId={dialog.id}
                            />
                            <UnduhWordLink
                              href={`/api/unduh/dialog/${dialog.id}/docx`}
                            />
                          </>
                        ) : null}
                        <Link
                          href={`/atasan/dialog/${dialog.id}`}
                          className={`inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-semibold transition-colors ${
                            perluEvaluasi
                              ? "bg-primary text-on-primary hover:bg-primary-strong"
                              : "bg-surface-muted text-primary-strong hover:bg-primary-soft"
                          }`}
                        >
                          <EyeIcon size={12} weight="bold" />
                          {perluEvaluasi ? "Evaluasi" : "Detail"}
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
