import { EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { StatusDialog, Triwulan } from "@/generated/prisma/enums";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeleteDialogButton } from "@/components/dialog/delete-button";
import { formatPeriode } from "@/lib/constants/triwulan";
import { CapaianBadge } from "@/components/shared/capaian-badge";

export interface DialogRow {
  id: number;
  periode_tahun: number;
  triwulan: Triwulan;
  status: StatusDialog;
  is_valid_pegawai: boolean;
  is_valid_atasan: boolean;
  id_dialog_induk: number | null;
  dialog_induk: { periode_tahun: number; triwulan: Triwulan } | null;
  dialog_lanjutan: { id: number }[];
  pegawai: {
    nama_pegawai: string;
    nama_jabatan: string | null;
    unit_kerja: string | null;
  };
  sequence_number?: number;
  reviu?: { status: string; is_tercapai: boolean; is_tidak_tercapai: boolean }[];
  aspek?: {
    tanggung_jawab_pegawai: string | null;
    item: { id: number; is_tercapai: boolean | null }[];
  }[];
}

export function DialogList({ dialogs }: { dialogs: DialogRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline bg-surface">
      <table className="w-full text-left">
        <thead className="border-b border-outline">
          <tr className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <th className="px-6 py-3">Pegawai</th>
            <th className="px-6 py-3">Periode</th>
            <th className="px-6 py-3">Status Pros</th>
            <th className="px-6 py-3">Progres Capaian</th>
            <th className="px-6 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline">
          {dialogs.map((dialog) => {
            const lengkap = dialog.is_valid_pegawai && dialog.is_valid_atasan;
            const draft = dialog.status === "draft_atasan";
            const perluEvaluasi = dialog.status === "menunggu_atasan";
            const hasLanjutan = dialog.dialog_lanjutan.length > 0;
            const filledCount = dialog.aspek
              ? dialog.aspek.filter(
                  (a) =>
                    (a.tanggung_jawab_pegawai?.trim() ?? "") !== "" ||
                    a.item.length > 0,
                ).length
              : 5;
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
                      {formatPeriode(dialog.triwulan, dialog.periode_tahun)}
                    </span>
                    {dialog.dialog_induk ? (
                      <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Lanjutan dari {formatPeriode(dialog.dialog_induk.triwulan, dialog.dialog_induk.periode_tahun)}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={dialog.status} />
                </td>
                <td className="px-6 py-4">
                  <CapaianBadge
                    statusDialog={dialog.status}
                    filledAspekCount={filledCount}
                    reviu={dialog.reviu?.at(-1)}
                    items={dialog.aspek?.flatMap((a) => a.item) ?? []}
                  />
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
                          {dialog.id_dialog_induk ? "Isi Dialog Lanjutan" : "Isi Dialog"}
                        </Link>
                        {dialog.status === "selesai" && hasLanjutan ? (
                          <span className="text-[11px] font-semibold text-ink-muted">
                            Lanjutan sudah dibuat
                          </span>
                        ) : null}
                        <DeleteDialogButton dialogId={dialog.id} />
                      </>
                    ) : (
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
