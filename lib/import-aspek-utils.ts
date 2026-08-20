import type { JenisAspek, Triwulan } from "@/generated/prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type JenisAspekImport = "SKP" | "GAP_ASESMEN" | "PERILAKU";

export interface AspekColumnDefinition {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
}

export interface AspekImportRowInput {
  npp?: string | number;
  nip?: string | number;
  nama?: string;
  [key: string]: unknown;
}

export interface AspekNormalizedRow {
  rowIndex: number;
  npp: string;
  nip?: string;
  narasi: string;
  metadata?: Record<string, unknown>;
  isValid: boolean;
  errorMessage?: string;
}

export interface AspekImportPreviewRow {
  rowIndex: number;
  npp: string;
  nip?: string;
  namaExcel?: string;
  namaDb?: string;
  userId?: number;
  narasi: string;
  status: "valid" | "npp_not_found" | "error";
  errorMessage?: string;
}

export interface AspekImportResult {
  success: number;
  skipped: number;
  errors: { rowIndex: number; npp: string; message: string }[];
}

/* ------------------------------------------------------------------ */
/*  Column Aliases Configuration                                      */
/* ------------------------------------------------------------------ */

export const COLUMN_DEFINITIONS_SKP: AspekColumnDefinition[] = [
  {
    key: "npp",
    label: "NPP / NIP",
    required: true,
    aliases: ["npp", "no pegawai", "nomor pegawai", "id pegawai", "nip", "nomor induk pegawai", "nrk"],
  },
  {
    key: "sasaran",
    label: "Sasaran Kinerja / KPI",
    required: true,
    aliases: ["sasaran", "sasaran kinerja", "kpi", "uraian", "indikator kinerja", "target kinerja", "rencana kerja", "kegiatan"],
  },
  {
    key: "target",
    label: "Target",
    aliases: ["target", "rencana target", "target tahunan", "satuan target"],
  },
  {
    key: "realisasi",
    label: "Realisasi / Capaian",
    aliases: ["realisasi", "capaian", "hasil", "aktual"],
  },
  {
    key: "persen",
    label: "% Capaian",
    aliases: ["%", "% capaian", "persen", "persentase", "capaian (%)", "persentase capaian"],
  },
  {
    key: "nama",
    label: "Nama Pegawai (Opsional)",
    aliases: ["nama", "nama pegawai", "nama lengkap"],
  },
];

export const COLUMN_DEFINITIONS_GAP: AspekColumnDefinition[] = [
  {
    key: "npp",
    label: "NPP / NIP",
    required: true,
    aliases: ["npp", "no pegawai", "nomor pegawai", "id pegawai", "nip", "nomor induk pegawai"],
  },
  {
    key: "kompetensi",
    label: "Kompetensi",
    required: true,
    aliases: ["kompetensi", "nama kompetensi", "gap kompetensi", "aspek kompetensi", "kemampuan"],
  },
  {
    key: "level_saat_ini",
    label: "Level Saat Ini",
    aliases: ["level saat ini", "level riil", "level aktual", "level sekarang", "saat ini"],
  },
  {
    key: "level_target",
    label: "Level Target",
    aliases: ["level target", "target level", "standar kompetensi", "target"],
  },
  {
    key: "gap",
    label: "Gap",
    aliases: ["gap", "selisih", "nilai gap", "kesenjangan"],
  },
  {
    key: "catatan",
    label: "Catatan / Rekomendasi",
    aliases: ["catatan", "keterangan", "rekomendasi", "deskripsi", "uraian"],
  },
  {
    key: "nama",
    label: "Nama Pegawai (Opsional)",
    aliases: ["nama", "nama pegawai", "nama lengkap"],
  },
];

export const COLUMN_DEFINITIONS_PERILAKU: AspekColumnDefinition[] = [
  {
    key: "npp",
    label: "NPP / NIP",
    required: true,
    aliases: ["npp", "no pegawai", "nomor pegawai", "id pegawai", "nip", "nomor induk pegawai"],
  },
  {
    key: "dimensi",
    label: "Dimensi / Aspek Perilaku",
    required: true,
    aliases: ["dimensi", "aspek", "perilaku", "indikator perilaku", "aspek perilaku", "komponen"],
  },
  {
    key: "nilai",
    label: "Nilai / Kategori",
    required: true,
    aliases: ["nilai", "predikat", "skor", "kategori", "hasil evaluasi", "nilai akhir", "kategori nilai"],
  },
  {
    key: "catatan",
    label: "Catatan Khusus",
    aliases: ["catatan", "catatan atasan", "keterangan", "rekomendasi", "feedback", "masukan"],
  },
  {
    key: "nama",
    label: "Nama Pegawai (Opsional)",
    aliases: ["nama", "nama pegawai", "nama lengkap"],
  },
];

export function getDefinitionsForJenis(jenis: JenisAspekImport): AspekColumnDefinition[] {
  switch (jenis) {
    case "SKP":
      return COLUMN_DEFINITIONS_SKP;
    case "GAP_ASESMEN":
      return COLUMN_DEFINITIONS_GAP;
    case "PERILAKU":
      return COLUMN_DEFINITIONS_PERILAKU;
  }
}

/* ------------------------------------------------------------------ */
/*  Fuzzy Column Matcher                                              */
/* ------------------------------------------------------------------ */

export function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchAspekColumn(
  header: string,
  definitions: AspekColumnDefinition[],
): string | null {
  const norm = normalizeHeader(header);
  let bestKey: string | null = null;
  let bestScore = 0;

  for (const def of definitions) {
    for (const alias of def.aliases) {
      const normAlias = normalizeHeader(alias);
      if (norm === normAlias) return def.key;
      if (norm.includes(normAlias) || normAlias.includes(norm)) {
        const score = Math.min(norm.length, normAlias.length);
        if (score > bestScore) {
          bestScore = score;
          bestKey = def.key;
        }
      }
    }
  }

  return bestKey;
}

/* ------------------------------------------------------------------ */
/*  Narrative Builder                                                 */
/* ------------------------------------------------------------------ */

export const PREDIKAT_PERILAKU_MAP: Record<string, { label: string; persen: string }> = {
  "sangat baik": { label: "Sangat Baik", persen: "150%" },
  "baik": { label: "Baik", persen: "100%" },
  "butuh perbaikan": { label: "Butuh Perbaikan", persen: "75%" },
  "kurang": { label: "Kurang", persen: "50%" },
  "sangat kurang": { label: "Sangat Kurang", persen: "25%" },
};

export function buildNarasi(
  jenis: JenisAspekImport,
  row: Record<string, unknown>,
): { narasi: string; metadata: Record<string, unknown>; shouldInclude: boolean } {
  const metadata: Record<string, unknown> = {};

  if (jenis === "SKP") {
    const sasaran = String(row.sasaran ?? "").trim();
    const target = row.target ? String(row.target).trim() : null;
    const realisasi = row.realisasi ? String(row.realisasi).trim() : null;
    const persenRaw = row.persen !== undefined && row.persen !== null && String(row.persen).trim() !== "" ? String(row.persen).replace("%", "").trim() : null;
    const persenNum = persenRaw ? parseFloat(persenRaw) : null;

    metadata.sasaran = sasaran;
    if (target) metadata.target = target;
    if (realisasi) metadata.realisasi = realisasi;
    if (persenNum !== null) metadata.persen = persenNum;

    // Filter rule: if persen is provided, only include if < 100% (target not fully achieved). If not provided, include all.
    const shouldInclude = persenNum === null || isNaN(persenNum) || persenNum < 100;

    let narasi = sasaran;
    const details: string[] = [];
    if (target) details.push(`Target: ${target}`);
    if (realisasi) details.push(`Realisasi: ${realisasi}`);
    if (persenNum !== null && !isNaN(persenNum)) details.push(`(${persenNum}%)`);

    if (details.length > 0) {
      narasi += ` — ${details.join(", ")}`;
    }

    return { narasi, metadata, shouldInclude };
  }

  if (jenis === "GAP_ASESMEN") {
    const kompetensi = String(row.kompetensi ?? "").trim();
    const levelSaatIni = row.level_saat_ini ? String(row.level_saat_ini).trim() : null;
    const levelTarget = row.level_target ? String(row.level_target).trim() : null;
    const gap = row.gap ? String(row.gap).trim() : null;
    const catatan = row.catatan ? String(row.catatan).trim() : null;

    metadata.kompetensi = kompetensi;
    if (levelSaatIni) metadata.level_saat_ini = levelSaatIni;
    if (levelTarget) metadata.level_target = levelTarget;
    if (gap) metadata.gap = gap;
    if (catatan) metadata.catatan = catatan;

    let narasi = kompetensi;
    if (levelSaatIni && levelTarget) {
      narasi += `: Level ${levelSaatIni} → Target ${levelTarget}`;
    } else if (levelTarget) {
      narasi += `: Target Level ${levelTarget}`;
    }
    if (gap) {
      narasi += ` (Gap: ${gap})`;
    }
    if (catatan) {
      narasi += `. Catatan: ${catatan}`;
    }

    return { narasi, metadata, shouldInclude: true };
  }

  // PERILAKU
  const dimensi = String(row.dimensi ?? "").trim();
  const rawNilai = row.nilai ? String(row.nilai).trim() : "";
  const catatan = row.catatan ? String(row.catatan).trim() : null;

  const normalizedNilaiKey = rawNilai.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const matchedPredikat = PREDIKAT_PERILAKU_MAP[normalizedNilaiKey];

  const predikatLabel = matchedPredikat ? matchedPredikat.label : rawNilai;
  const persenKonversi = matchedPredikat ? matchedPredikat.persen : null;

  metadata.dimensi = dimensi;
  metadata.nilai = predikatLabel;
  if (persenKonversi) metadata.persentase_konversi = persenKonversi;
  if (catatan) metadata.catatan = catatan;

  let narasi = dimensi;
  if (predikatLabel) {
    narasi += `: ${predikatLabel}`;
    if (persenKonversi && !predikatLabel.includes("%")) {
      narasi += ` (Konversi: ${persenKonversi})`;
    }
  }
  if (catatan) narasi += ` — Catatan: ${catatan}`;

  return { narasi, metadata, shouldInclude: true };
}
