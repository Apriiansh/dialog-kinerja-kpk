import type { StatusReviu } from "@/generated/prisma/enums";

export type StatusReviuTone =
  | "draft"
  | "waiting-atasan"
  | "validation"
  | "revision"
  | "done";

export interface StatusReviuConfig {
  label: string;
  tone: StatusReviuTone;
}

export const STATUS_REVIU_CONFIG: Record<StatusReviu, StatusReviuConfig> = {
  draft_pegawai: { label: "Draft", tone: "draft" },
  menunggu_atasan: { label: "Menunggu Atasan", tone: "waiting-atasan" },
  menunggu_validasi: { label: "Menunggu Validasi", tone: "validation" },
  revisi_capaian: { label: "Revisi Capaian", tone: "revision" },
  selesai: { label: "Selesai", tone: "done" },
};

export function tindakLanjutLabel(
  is_tercapai: boolean,
  is_tidak_tercapai: boolean,
): string {
  if (is_tercapai && is_tidak_tercapai) {
    return "Tercapai Sebagian";
  }
  if (is_tercapai) {
    return "Tercapai Semua";
  }
  if (is_tidak_tercapai) {
    return "Tidak Tercapai";
  }
  return "Belum Ditentukan";
}
