import type { JenisAspek } from "@/generated/prisma/enums";

export interface AspekPegawaiItem {
  dialog_evaluasi: string | null;
  kompetensi_dikembangkan: string | null;
  metode_pengembangan_lainnya: string | null;
  waktu_pelaksanaan: Date | null;
  metode: { nama_metode: string } | null;
}

export interface AspekPegawaiRow {
  id: number;
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string | null;
  tanggung_jawab_atasan: string | null;
  item: AspekPegawaiItem[];
}

export function dialogEvaluasiLabel(jenis: JenisAspek): string {
  if (jenis === "KARIR_PENDEK" || jenis === "KARIR_MENENGAH") {
    return "Tujuan Karir";
  }
  switch (jenis) {
    case "SKP":
      return "Evaluasi Kinerja";
    case "GAP_ASESMEN":
      return "Evaluasi Gap Asesmen";
    case "PERILAKU":
      return "Evaluasi Perilaku";
    default:
      return "Tujuan / Evaluasi";
  }
}

export function metodeLabel(item: AspekPegawaiItem): string | null {
  if (item.metode_pengembangan_lainnya?.trim()) {
    return item.metode_pengembangan_lainnya;
  }
  return item.metode?.nama_metode ?? null;
}

export function formatWaktuPelaksanaan(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function isEmptyItem(item: AspekPegawaiItem): boolean {
  return (
    !item.dialog_evaluasi?.trim() &&
    !item.kompetensi_dikembangkan?.trim() &&
    !metodeLabel(item) &&
    !item.waktu_pelaksanaan
  );
}
