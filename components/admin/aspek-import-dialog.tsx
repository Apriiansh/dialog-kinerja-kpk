"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FileArrowDownIcon,
  FileArrowUpIcon,
  FunnelIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import type { Triwulan } from "@/generated/prisma/client";
import { getAvailableYears } from "@/lib/constants/triwulan";
import {
  type JenisAspekImport,
  type AspekImportRowInput,
  type AspekImportPreviewRow,
  type AspekImportResult,
  getDefinitionsForJenis,
  matchAspekColumn,
} from "@/lib/import-aspek-utils";
import {
  importAspekPreview,
  importAspekExecute,
} from "@/lib/actions/import-aspek";

/* ------------------------------------------------------------------ */
/*  Helpers & Config                                                  */
/* ------------------------------------------------------------------ */

const MAX_ROWS = 5000;
const ACCEPT = ".xlsx,.csv";

const ASPEK_OPTIONS: { value: JenisAspekImport; label: string; sublabel: string }[] = [
  {
    value: "SKP",
    label: "Aspek A — Sasaran Kinerja Pegawai (SKP)",
    sublabel: "Target KPI yang capaiannya di bawah 100%",
  },
  {
    value: "GAP_ASESMEN",
    label: "Aspek B — Evaluasi Gap Asesmen",
    sublabel: "Hasil asesmen kompetensi dan kesenjangan",
  },
  {
    value: "PERILAKU",
    label: "Aspek C — Evaluasi Perilaku",
    sublabel: "Predikat kinerja: Sangat Baik (150%), Baik (100%), Butuh Perbaikan (75%), Kurang (50%), Sangat Kurang (25%)",
  },
];

const TRIWULAN_OPTIONS: { value: Triwulan; label: string }[] = [
  { value: "TW1", label: "Triwulan I (Perencanaan & Evaluasi)" },
  { value: "TW3", label: "Triwulan III (Monitoring Progres)" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AspekImportDialog({
  initialJenis = "SKP",
}: {
  initialJenis?: JenisAspekImport;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");

  const [jenis, setJenis] = useState<JenisAspekImport>(initialJenis);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [triwulan, setTriwulan] = useState<Triwulan>("TW1");

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapped, setMapped] = useState<Record<string, string | null>>({});
  const [rawRows, setRawRows] = useState<AspekImportRowInput[]>([]);
  const [previewRows, setPreviewRows] = useState<AspekImportPreviewRow[]>([]);
  const [result, setResult] = useState<AspekImportResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setMapped({});
    setRawRows([]);
    setPreviewRows([]);
    setResult(null);
    setLoading(false);
    setPreviewLoading(false);
    setError(null);
    setQuery("");
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setError(null);
      setLoading(true);
      try {
        const XLSX: typeof import("xlsx") = await import("xlsx");
        const data = await f.arrayBuffer();
        const wb = XLSX.read(data, { type: "array", cellDates: true, raw: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          blankrows: false,
        });

        if (json.length === 0) {
          setError("File kosong atau tidak memiliki baris data.");
          setLoading(false);
          return;
        }
        if (json.length > MAX_ROWS) {
          setError(`File terlalu besar. Maksimal ${MAX_ROWS.toLocaleString("id-ID")} baris.`);
          setLoading(false);
          return;
        }

        const rawHeaders = Object.keys(json[0]);
        const definitions = getDefinitionsForJenis(jenis);
        const colMap: Record<string, string | null> = {};
        for (const h of rawHeaders) {
          colMap[h] = matchAspekColumn(h, definitions);
        }
        setHeaders(rawHeaders);
        setMapped(colMap);

        const rows: AspekImportRowInput[] = json.map((obj) => {
          const row: AspekImportRowInput = {};
          for (const h of rawHeaders) {
            const key = colMap[h];
            if (key) {
              row[key] = obj[h];
            }
          }
          return row;
        });
        setRawRows(rows);
      } catch {
        setError("Gagal membaca file. Pastikan format file valid (.xlsx atau .csv).");
      } finally {
        setLoading(false);
      }
    },
    [jenis],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handlePreview = useCallback(async () => {
    if (rawRows.length === 0) return;
    setPreviewLoading(true);
    setError(null);
    try {
      const rows = await importAspekPreview(rawRows, jenis, tahun, triwulan);
      setPreviewRows(rows);
      setStep("preview");
    } catch {
      setError("Gagal memvalidasi data pratinjau. Silakan coba lagi.");
    } finally {
      setPreviewLoading(false);
    }
  }, [rawRows, jenis, tahun, triwulan]);

  const handleExecute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await importAspekExecute(rawRows, jenis, tahun, triwulan);
      setResult(res);
      setStep("result");
      if (res.success > 0) {
        showSuccess("Impor berhasil", `${res.success} narasi aspek berhasil disimpan ke data staging.`);
      }
      if (res.errors.length > 0) {
        showError(`${res.errors.length} baris dilewati / bermasalah. Lihat ringkasan.`);
      }
    } catch {
      const msg = "Gagal menjalankan proses impor. Silakan coba lagi.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [rawRows, jenis, tahun, triwulan]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const XLSX: typeof import("xlsx") = await import("xlsx");
      let sampleData: Record<string, string>[] = [];
      const filename = `Template_Import_${jenis}.xlsx`;

      if (jenis === "SKP") {
        sampleData = [
          {
            "NPP": "2000001",
            "Nama Pegawai": "Siti Rahayu",
            "Sasaran Kinerja": "Penyelesaian 5 Laporan Administrasi",
            "Target": "5 Laporan",
            "Realisasi": "3 Laporan",
            "% Capaian": "60%",
          },
          {
            "NPP": "2000002",
            "Nama Pegawai": "Ahmad Fauzi",
            "Sasaran Kinerja": "Sosialisasi SOP Kearsipan Internal",
            "Target": "3 Sesi",
            "Realisasi": "1 Sesi",
            "% Capaian": "33%",
          },
        ];
      } else if (jenis === "GAP_ASESMEN") {
        sampleData = [
          {
            "NPP": "2000001",
            "Nama Pegawai": "Siti Rahayu",
            "Kompetensi": "Kepemimpinan Tim",
            "Level Saat Ini": "3",
            "Level Target": "5",
            "Gap": "2",
            "Catatan": "Perlu pelatihan manajerial lanjutan",
          },
          {
            "NPP": "2000002",
            "Nama Pegawai": "Ahmad Fauzi",
            "Kompetensi": "Komunikasi Publik",
            "Level Saat Ini": "2",
            "Level Target": "4",
            "Gap": "2",
            "Catatan": "Diusulkan mengikuti workshop presentasi",
          },
        ];
      } else {
        sampleData = [
          {
            "NPP": "2000001",
            "Nama Pegawai": "Siti Rahayu",
            "Dimensi Perilaku": "Integritas & Kedisiplinan",
            "Nilai": "Sangat Baik",
            "Catatan": "Selalu hadir tepat waktu dan mematuhi etika lembaga",
          },
          {
            "NPP": "2000002",
            "Nama Pegawai": "Ahmad Fauzi",
            "Dimensi Perilaku": "Inovasi & Inisiatif",
            "Nilai": "Butuh Perbaikan",
            "Catatan": "Perlu meningkatkan inisiatif dalam perbaikan proses kerja",
          },
        ];
      }

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, jenis);
      XLSX.writeFile(wb, filename);
    } catch {
      showError("Gagal mengunduh template file.");
    }
  }, [jenis]);

  const filteredPreview = useMemo(() => {
    if (!query.trim()) return previewRows;
    const q = query.toLowerCase();
    return previewRows.filter(
      (r) =>
        r.npp.toLowerCase().includes(q) ||
        (r.namaDb ?? "").toLowerCase().includes(q) ||
        (r.namaExcel ?? "").toLowerCase().includes(q) ||
        r.narasi.toLowerCase().includes(q),
    );
  }, [previewRows, query]);

  const stats = useMemo(() => {
    const s = { valid: 0, nppNotFound: 0, error: 0, total: previewRows.length };
    for (const r of previewRows) {
      if (r.status === "valid") s.valid++;
      else if (r.status === "npp_not_found") s.nppNotFound++;
      else s.error++;
    }
    return s;
  }, [previewRows]);

  const mappedCount = Object.values(mapped).filter(Boolean).length;
  const unmappedHeaders = headers.filter((h) => !mapped[h]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
      >
        <FileArrowUpIcon size={16} weight="bold" />
        Impor Data Evaluasi
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Impor data evaluasi"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={handleClose}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-xl bg-surface shadow-ambient"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-bold text-ink">
                  Impor Batch Data Evaluasi (Aspek A – C)
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  {step === "upload" && "Pilih jenis aspek, periode target, dan unggah file Excel/CSV data pegawai."}
                  {step === "preview" &&
                    `Pratinjau ${previewRows.length.toLocaleString("id-ID")} baris data untuk ${jenis} (${triwulan} ${tahun}).`}
                  {step === "result" && "Ringkasan hasil penyimpanan data staging evaluasi."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink cursor-pointer"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="border-b border-outline px-6 py-3">
              <Progress
                value={step === "upload" ? 33 : step === "preview" ? 66 : 100}
                className="w-full"
              >
                <ProgressLabel>
                  {step === "upload" && "1. Konfigurasi & Unggah File"}
                  {step === "preview" && "2. Verifikasi Pratinjau"}
                  {step === "result" && "3. Selesai"}
                </ProgressLabel>
                <ProgressValue />
              </Progress>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {error && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <WarningIcon size={16} className="mt-0.5 shrink-0" weight="fill" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step: Upload */}
              {step === "upload" && (
                <div className="flex flex-col gap-6">
                  {/* Parameter Selection */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Jenis Aspek Selector */}
                    <div className="sm:col-span-3 flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                        1. Pilih Aspek yang Akan Diimpor
                      </label>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {ASPEK_OPTIONS.map((opt) => {
                          const isSelected = jenis === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setJenis(opt.value);
                                if (file) {
                                  handleFile(file);
                                }
                              }}
                              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                                  : "border-outline bg-surface hover:border-outline-strong hover:bg-surface-muted/50"
                              }`}
                            >
                              <span className="text-xs font-bold text-ink">
                                {opt.label}
                              </span>
                              <span className="text-[11px] leading-tight text-ink-muted">
                                {opt.sublabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tahun Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink">
                        2. Periode Tahun
                      </label>
                      <select
                        value={tahun}
                        onChange={(e) => setTahun(Number(e.target.value))}
                        className="h-10 rounded-lg border border-outline bg-surface px-3 text-xs font-medium text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                      >
                        {getAvailableYears(3, 3).map((t) => (
                          <option key={t} value={t}>
                            Tahun {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Triwulan Selector */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-ink">
                        3. Siklus Triwulan
                      </label>
                      <select
                        value={triwulan}
                        onChange={(e) => setTriwulan(e.target.value as Triwulan)}
                        className="h-10 rounded-lg border border-outline bg-surface px-3 text-xs font-medium text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
                      >
                        {TRIWULAN_OPTIONS.map((tw) => (
                          <option key={tw.value} value={tw.value}>
                            {tw.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                        4. Berkas Excel / CSV
                      </label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <FileArrowDownIcon size={14} weight="bold" />
                        Unduh Format Contoh (.xlsx)
                      </button>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-outline bg-surface-muted/30 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FileArrowUpIcon size={24} weight="bold" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {file ? file.name : "Seret & lepas berkas Excel / CSV di sini"}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {file
                            ? `${formatBytes(file.size)} — klik untuk mengganti berkas`
                            : "atau klik untuk memilih berkas dari perangkat Anda"}
                        </p>
                      </div>
                      <p className="text-[11px] text-ink-muted/70">
                        Format didukung: .xlsx, .csv — Maksimal {MAX_ROWS.toLocaleString("id-ID")} baris
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </div>

                  {file && !loading && !previewLoading && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handlePreview}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
                      >
                        Periksa & Lihat Pratinjau
                        <ArrowRightIcon size={14} weight="bold" />
                      </button>
                    </div>
                  )}

                  {previewLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-muted">
                      <Spinner className="size-4" />
                      Memverifikasi data NPP dengan database pegawai...
                    </div>
                  )}

                  {loading && !previewLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink-muted">
                      <Spinner className="size-4" />
                      Membaca berkas...
                    </div>
                  )}
                </div>
              )}

              {/* Step: Preview */}
              {step === "preview" && (
                <div className="flex flex-col gap-5">
                  {/* Column mapping summary */}
                  <div className="rounded-lg border border-outline bg-surface-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-ink">
                        Pemetaan Kolom Otomatis ({mappedCount}/{headers.length} terdeteksi)
                      </p>
                      <span className="text-xs font-mono font-semibold text-primary">
                        {jenis} · {triwulan} {tahun}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {headers.map((h) => {
                        const key = mapped[h];
                        return (
                          <span
                            key={h}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                              key
                                ? "bg-primary/10 text-primary ring-primary/20"
                                : "bg-surface-muted text-ink-muted ring-outline"
                            }`}
                          >
                            {h}
                            {key ? (
                              <span className="text-[10px] font-semibold opacity-80">
                                → {key}
                              </span>
                            ) : (
                              <span className="text-[10px] opacity-50">
                                (diabaikan)
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {unmappedHeaders.length > 0 && (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
                        <InfoIcon size={12} weight="fill" />
                        {unmappedHeaders.length} kolom tidak digunakan dalam pengisian aspek ini dan akan dilewati.
                      </p>
                    )}
                  </div>

                  {/* Stats + Search Filter */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircleIcon size={14} weight="fill" />
                        {stats.valid} Siap Diimpor
                      </span>
                      {stats.nppNotFound > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          <WarningIcon size={14} weight="fill" />
                          {stats.nppNotFound} NPP Tidak Terdaftar
                        </span>
                      )}
                      {stats.error > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                          {stats.error} Dilewati / Error
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <MagnifyingGlassIcon
                        size={14}
                        weight="bold"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                      />
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari NPP / nama / narasi..."
                        className="h-8 w-full rounded-md border border-outline bg-surface pl-8 pr-3 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus sm:w-60"
                      />
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-hidden rounded-lg border border-outline">
                    <div className="max-h-[42vh] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-outline bg-surface-muted/90 backdrop-blur">
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                            <th className="px-3 py-2.5 text-center w-10">#</th>
                            <th className="px-3 py-2.5 w-28">NPP</th>
                            <th className="px-3 py-2.5 w-44">Nama Pegawai</th>
                            <th className="px-3 py-2.5">Narasi yang Akan Masuk ke Dialog</th>
                            <th className="px-3 py-2.5 text-right w-28">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline">
                          {filteredPreview.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                                Tidak ada data yang cocok dengan pencarian.
                              </td>
                            </tr>
                          ) : (
                            filteredPreview.map((r) => (
                              <tr key={r.rowIndex} className="hover:bg-surface-muted/40">
                                <td className="px-3 py-2 text-center text-ink-muted">
                                  {r.rowIndex + 1}
                                </td>
                                <td className="px-3 py-2 font-mono font-semibold text-ink">
                                  {r.npp}
                                </td>
                                <td className="px-3 py-2 text-ink">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-ink">
                                      {r.namaDb ?? r.namaExcel ?? "—"}
                                    </span>
                                    {r.namaDb && r.namaExcel && r.namaDb !== r.namaExcel && (
                                      <span className="text-[10px] text-ink-muted truncate">
                                        File: {r.namaExcel}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-ink leading-relaxed">
                                  {r.narasi}
                                  {r.errorMessage && r.status !== "valid" && (
                                    <p className="mt-0.5 text-[10px] font-medium text-amber-600">
                                      {r.errorMessage}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {r.status === "valid" && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                      Valid
                                    </span>
                                  )}
                                  {r.status === "npp_not_found" && (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                      NPP Kosong
                                    </span>
                                  )}
                                  {r.status === "error" && (
                                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                                      Dilewati
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Result */}
              {step === "result" && result && (
                <div className="flex flex-col items-center gap-6 py-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                    <CheckCircleIcon size={32} weight="fill" />
                  </span>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-ink">
                      Impor Data Staging Berhasil
                    </h3>
                    <p className="text-xs text-ink-muted max-w-md">
                      Data narasi {jenis} untuk periode {triwulan} {tahun} telah berhasil disimpan ke antrean staging. Saat atasan membuat dialog kinerja, data ini akan otomatis mengisi kolom evaluasi pegawai bersangkutan.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm ring-1 ring-inset ring-emerald-600/20">
                      <CheckCircleIcon size={18} className="text-emerald-600" weight="fill" />
                      <span className="font-bold text-emerald-700">
                        {result.success} item tersimpan
                      </span>
                    </div>

                    {result.skipped > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2.5 text-sm ring-1 ring-inset ring-outline">
                        <FunnelIcon size={18} className="text-ink-muted" weight="bold" />
                        <span className="font-semibold text-ink-muted">
                          {result.skipped} baris dilewati
                        </span>
                      </div>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="w-full max-w-lg rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-left">
                      <p className="mb-2 text-xs font-bold text-amber-800">
                        Catatan Baris yang Dilewati ({result.errors.length}):
                      </p>
                      <ul className="max-h-36 space-y-1 overflow-y-auto text-xs text-amber-700">
                        {result.errors.map((e, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="font-mono font-semibold">#{e.rowIndex + 1} (NPP {e.npp}):</span>
                            <span>{e.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-outline px-6 py-4">
              {step === "preview" ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep("upload");
                    setPreviewRows([]);
                  }}
                  disabled={loading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeftIcon size={12} weight="bold" />
                  Kembali
                </button>
              ) : (
                <div />
              )}

              {step === "preview" && (
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={loading || stats.valid === 0}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Spinner className="size-3" />
                      Menyimpan ke Staging...
                    </>
                  ) : (
                    `Simpan ${stats.valid} Baris Valid ke Sistem`
                  )}
                </button>
              )}

              {step === "result" && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
