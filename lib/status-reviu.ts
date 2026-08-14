import type {
  StatusReviu,
  StatusTindakLanjut,
} from "@/generated/prisma/enums";

export type StatusReviuTone =
  | "draft"
  | "waiting-atasan"
  | "validation"
  | "done";

export interface StatusReviuConfig {
  label: string;
  tone: StatusReviuTone;
}

export const STATUS_REVIU_CONFIG: Record<StatusReviu, StatusReviuConfig> = {
  draft_pegawai: { label: "Draft", tone: "draft" },
  menunggu_atasan: { label: "Menunggu Atasan", tone: "waiting-atasan" },
  menunggu_validasi: { label: "Menunggu Validasi", tone: "validation" },
  selesai: { label: "Selesai", tone: "done" },
};

export const STATUS_TINDAK_LANJUT_LABEL: Record<
  StatusTindakLanjut,
  string
> = {
  TERCAPAI: "Tercapai",
  TIDAK_TERCAPAI: "Tidak Tercapai",
};
