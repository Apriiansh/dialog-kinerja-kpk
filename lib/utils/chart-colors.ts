import type { Role, StatusDialog } from "@/generated/prisma/enums";

export const DIALOG_STATUS_CHART: Record<
  StatusDialog,
  { label: string; short: string; color: string }
> = {
  draft: { label: "Draft", short: "Draft", color: "#475569" },
  menunggu_pegawai: {
    label: "Menunggu Pegawai",
    short: "M. Pegawai",
    color: "#b45309",
  },
  menunggu_atasan: {
    label: "Menunggu Atasan",
    short: "M. Atasan",
    color: "#1d4ed8",
  },
  menunggu_validasi: {
    label: "Menunggu Validasi",
    short: "M. Validasi",
    color: "#4338ca",
  },
  selesai: { label: "Selesai", short: "Selesai", color: "#15803d" },
};

export const ROLE_CHART: Record<Role, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "#4338ca" },
  ATASAN: { label: "Atasan", color: "#1d4ed8" },
  PEGAWAI: { label: "Pegawai", color: "#15803d" },
};