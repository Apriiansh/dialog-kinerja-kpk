import { EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { StatusDialog } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { DeleteDialogButton } from "@/components/delete-dialog-button";

export interface DialogRow {
  id: number;
  periode_tahun: number;
  status: StatusDialog;
  is_valid_pegawai: boolean;
  is_valid_atasan: boolean;
  pegawai: {
    nama_pegawai: string;
    nama_jabatan: string | null;
    unit_kerja: string | null;
  };
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
                  {dialog.periode_tahun}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={dialog.status} />
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs font-semibold ${
                      lengkap ? "text-secondary" : "text-amber-800"
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
                        <DeleteDialogButton dialogId={dialog.id} />
                      </>
                    ) : (
                      <Link
                        href={`/atasan/dialog/${dialog.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-surface-muted px-3 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-soft"
                      >
                        <EyeIcon size={12} weight="bold" />
                        Detail
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
