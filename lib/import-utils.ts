import { formatDurasiKeHariIni } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type ImportAction = "create" | "update" | "skip";

export interface ImportRowInput {
  npp?: string;
  nip?: string;
  nama_pegawai?: string;
  nama_jabatan?: string;
  unit_kerja?: string;
  tanggal_bergabung?: string;
  masa_kerja_unit_terakhir?: string;
  default_role?: string;
  atasan_npp?: string;
  [key: string]: unknown;
}

export interface NormalizedRow {
  npp: string;
  nip: string;
  nama_pegawai: string;
  nama_jabatan: string;
  unit_kerja: string;
  tanggal_bergabung: string;
  masa_kerja_unit_terakhir: string;
  default_role: "ADMIN" | "ATASAN" | "PEGAWAI";
  atasan_npp: string;
}

export interface ImportPreviewRow {
  rowIndex: number;
  npp: string;
  nip: string;
  nama_pegawai: string;
  nama_jabatan: string;
  unit_kerja: string;
  tanggal_bergabung: string;
  masa_kerja_unit_terakhir: string;
  default_role: "ADMIN" | "ATASAN" | "PEGAWAI";
  atasan_npp: string;
  status: "new" | "existing" | "error";
  existingUserId: number | null;
  errorMessage: string | null;
  suggestedAction: ImportAction;
}

export interface ImportRowAction {
  rowIndex: number;
  action: ImportAction;
}

export interface ImportError {
  rowIndex: number;
  npp: string;
  nama_pegawai: string;
  message: string;
}

export interface ImportResult {
  success: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

/* ------------------------------------------------------------------ */
/*  Cell conversion helpers                                           */
/* ------------------------------------------------------------------ */

export function cellToText(cell: unknown): string {
  if (cell == null) return "";
  if (cell instanceof Date) {
    const y = cell.getFullYear();
    const m = String(cell.getMonth() + 1).padStart(2, "0");
    const d = String(cell.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(cell).trim();
}

export function cellToDigits(cell: unknown): string {
  return cellToText(cell).replace(/\D/g, "");
}

export function cellToDateInput(cell: unknown): string {
  const text = cellToText(cell);
  if (!text) return "";

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (isoMatch) return isoMatch[0];

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
  }

  const dmyMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(text);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }

  if (/^\d{8}$/.test(text)) {
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  }

  return "";
}

const VALID_ROLES = ["ADMIN", "ATASAN", "PEGAWAI"] as const;

export function cellToRole(cell: unknown): "ADMIN" | "ATASAN" | "PEGAWAI" {
  const text = cellToText(cell).toUpperCase();
  if (VALID_ROLES.includes(text as (typeof VALID_ROLES)[number])) {
    return text as "ADMIN" | "ATASAN" | "PEGAWAI";
  }
  return "PEGAWAI";
}

function normalizeMasaKerja(cell: unknown): string {
  const text = cellToText(cell);
  if (!text) return "";
  if (/\d+\s*[Tt]ahun/.test(text)) return text;

  const dateInput = cellToDateInput(cell);
  if (dateInput) {
    const d = new Date(dateInput);
    if (!Number.isNaN(d.getTime())) {
      const result = formatDurasiKeHariIni(d);
      return result || text;
    }
  }
  return text;
}

/* ------------------------------------------------------------------ */
/*  Column aliases for fuzzy header matching (used by client too)     */
/* ------------------------------------------------------------------ */

export const COLUMN_ALIASES: Record<string, string[]> = {
  npp: ["npp", "nomor pegawai", "no pegawai", "no peg"],
  nip: ["nip", "nomor induk pegawai", "no induk"],
  nama_pegawai: [
    "nama",
    "nama pegawai",
    "nama lengkap",
    "nama_lengkap",
    "name",
  ],
  nama_jabatan: ["jabatan", "nama jabatan", "posisi", "nama_jabatan"],
  unit_kerja: [
    "unit kerja",
    "unit",
    "dept",
    "departemen",
    "unit_kerja",
    "satuan kerja",
    "satker",
  ],
  tanggal_bergabung: [
    "tanggal bergabung",
    "tgl bergabung",
    "tanggal_masuk",
    "tanggal masuk",
    "join date",
    "startdate",
  ],
  masa_kerja_unit_terakhir: [
    "masa kerja",
    "masa_kerja",
    "masa kerja unit",
    "masa kerja unit terakhir",
    "mk",
  ],
  default_role: ["role", "peran", "default_role", "tipe", "type"],
  atasan_npp: [
    "atasan",
    "atasan npp",
    "atasan_npp",
    "supervisor npp",
    "manager npp",
    "no atasan",
  ],
};

/* ------------------------------------------------------------------ */
/*  Shared normalizer                                                 */
/* ------------------------------------------------------------------ */

export function normalizeRow(raw: ImportRowInput): NormalizedRow {
  return {
    npp: cellToDigits(raw.npp),
    nip: cellToDigits(raw.nip),
    nama_pegawai: cellToText(raw.nama_pegawai),
    nama_jabatan: cellToText(raw.nama_jabatan),
    unit_kerja: cellToText(raw.unit_kerja),
    tanggal_bergabung: cellToDateInput(raw.tanggal_bergabung),
    masa_kerja_unit_terakhir: normalizeMasaKerja(raw.masa_kerja_unit_terakhir),
    default_role: cellToRole(raw.default_role),
    atasan_npp: cellToDigits(raw.atasan_npp),
  };
}

/* ------------------------------------------------------------------ */
/*  Validate a single row                                             */
/* ------------------------------------------------------------------ */

export function validateRow(
  row: NormalizedRow,
  atasanMap: Map<string, number>,
): string | null {
  if (!row.npp || !/^\d{7}$/.test(row.npp)) {
    return "NPP wajib 7 digit angka.";
  }
  if (!row.nama_pegawai) {
    return "Nama pegawai wajib diisi.";
  }
  if (!VALID_ROLES.includes(row.default_role as (typeof VALID_ROLES)[number])) {
    return `Peran tidak valid: "${row.default_role}". Gunakan ADMIN, ATASAN, atau PEGAWAI.`;
  }
  if (row.nip && !/^\d{0,18}$/.test(row.nip)) {
    return "NIP maksimal 18 digit angka.";
  }
  if (row.atasan_npp && !atasanMap.has(row.atasan_npp)) {
    return `Atasan dengan NPP "${row.atasan_npp}" tidak ditemukan.`;
  }
  if (row.default_role === "ADMIN" && row.atasan_npp) {
    return "Pengguna admin tidak memiliki atasan.";
  }
  return null;
}
