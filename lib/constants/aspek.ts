import type { JenisAspek } from "@/generated/prisma/enums";

export const ASPEK_ORDER: JenisAspek[] = [
  "SKP",
  "GAP_ASESMEN",
  "PERILAKU",
  "KARIR_PENDEK",
  "KARIR_MENENGAH",
];

export const TOTAL_ASPEK = 4;

export const ASPEK_LABEL: Record<JenisAspek, string> = {
  SKP: "Evaluasi Kinerja (SKP)",
  GAP_ASESMEN: "Evaluasi Gap Asesmen",
  PERILAKU: "Evaluasi Perilaku",
  KARIR_PENDEK: "Aspirasi Karir Jangka Pendek (1–2 Tahun)",
  KARIR_MENENGAH: "Aspirasi Karir Jangka Menengah (3–5 Tahun)",
};

export const ASPEK_DESC: Record<JenisAspek, string> = {
  SKP: "Tujuan atau capaian kinerja yang ingin diraih pada periode berjalan.",
  GAP_ASESMEN:
    "Kesenjangan kompetensi hasil asesmen yang akan ditutup pada periode ini.",
  PERILAKU: "Perilaku kerja atau nilai kerja yang perlu ditingkatkan.",
  KARIR_PENDEK: "Aspirasi pengembangan karir dalam jangka pendek (1–2 tahun).",
  KARIR_MENENGAH:
    "Aspirasi pengembangan karir dalam jangka menengah (3–5 tahun).",
};