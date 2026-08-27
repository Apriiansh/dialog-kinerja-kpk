import type { StatusDialog } from "@/generated/prisma/enums";

export type StatusTone =
  | "draft"
  | "waiting-pegawai"
  | "waiting-atasan"
  | "validation"
  | "done";

export interface StatusConfig {
  label: string;
  tone: StatusTone;
}

export const STATUS_CONFIG: Record<StatusDialog, StatusConfig> = {
  draft: { label: "Draft / Menunggu Persetujuan Atasan", tone: "draft" },
  menunggu_pegawai: { label: "Menunggu Pegawai", tone: "waiting-pegawai" },
  menunggu_atasan: { label: "Menunggu Atasan", tone: "waiting-atasan" },
  menunggu_validasi: { label: "Menunggu Validasi", tone: "validation" },
  selesai: { label: "Selesai", tone: "done" },
};