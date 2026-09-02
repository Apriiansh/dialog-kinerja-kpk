"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { initiateDialog } from "@/lib/actions/pegawai";
import { JadwalDialogModal } from "@/components/dialog/jadwal-dialog-modal";

export interface EligibleParentInfo {
  id: string;
  periodeLabel: string;
  unachievedCount: number;
}

export interface InitiateDialogButtonProps {
  eligibleParent?: EligibleParentInfo;
  parentDialogId?: string;
  parentPeriodeLabel?: string;
  unachievedCount?: number;
  label?: string;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function InitiateDialogButton({
  eligibleParent,
  parentDialogId,
  parentPeriodeLabel,
  unachievedCount,
  label,
  variant = "primary",
  size = "md",
  className = "",
}: InitiateDialogButtonProps = {}) {
  const parentId = eligibleParent?.id ?? parentDialogId;
  const parentLabel = eligibleParent?.periodeLabel ?? parentPeriodeLabel;
  const unachieved = eligibleParent?.unachievedCount ?? unachievedCount ?? 0;
  const isLanjutan = Boolean(parentId);

  const defaultLabel = "Ajukan Dialog Kinerja";
  const displayLabel = label || defaultLabel;

  const [open, setOpen] = useState(false);

  const buttonClasses =
    variant === "primary"
      ? size === "sm"
        ? "inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
        : "inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
      : size === "sm"
        ? "inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted cursor-pointer"
        : "inline-flex h-10 items-center gap-2 rounded-md border border-outline bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted cursor-pointer";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonClasses} ${className}`}
      >
        <PlusIcon size={size === "sm" ? 14 : 16} weight="bold" />
        {displayLabel}
      </button>

      <JadwalDialogModal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajukan Jadwal Dialog Kinerja"
        submitLabel={isLanjutan ? "Ajukan Evaluasi" : "Kirim Pengajuan"}
        successMessage={
          isLanjutan
            ? "Pengajuan dialog lanjutan berhasil dikirim ke atasan."
            : "Pengajuan dialog berhasil dikirim ke atasan."
        }
        dateInputId="jadwal-date"
        deskripsiInputId="deskripsi-pegawai"
        deskripsiPlaceholder={
          isLanjutan
            ? "Tuliskan fokus capaian atau kendala yang ingin didiskusikan pada periode lanjutan ini..."
            : "Tuliskan konteks atau topik utama yang ingin didiskusikan..."
        }
        onSubmit={async (jadwalDate, deskripsi) =>
          initiateDialog({
            jadwal_dialog: jadwalDate,
            deskripsi_pegawai: deskripsi,
            id_dialog_induk: parentId,
          })
        }
      >
        {isLanjutan && parentLabel ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <span>Dialog Kinerja Lanjutan</span>
              <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                Lanjutan dari {parentLabel}
              </span>
            </div>
            <p className="leading-5 text-amber-800">
              Pengajuan ini terhubung dengan periode sebelumnya. Sebanyak{" "}
              <strong className="font-bold text-amber-950 underline decoration-amber-400">
                {unachieved} butir kegiatan yang belum tercapai
              </strong>{" "}
              serta komitmen tanggung jawab akan otomatis disalin ke dialog kinerja baru ini.
            </p>
          </div>
        ) : null}
      </JadwalDialogModal>
    </>
  );
}