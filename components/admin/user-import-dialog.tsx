"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FileArrowUpIcon,
  FunnelIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  importUsersPreview,
  importUsersExecute,
} from "@/lib/actions/import-users";
import {
  error as showError,
  success as showSuccess,
} from "@/components/ui/toast";
import {
  COLUMN_ALIASES,
  type ImportRowInput,
  type ImportPreviewRow,
  type ImportRowAction,
  type ImportAction,
  type ImportResult,
  type UnmatchedUnitPolicy,
} from "@/lib/import-utils";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const MAX_ROWS = 5000;
const ACCEPT = ".xlsx,.csv";
const LABELS: Record<ImportAction, string> = {
  create: "Buat Baru",
  update: "Perbarui",
  skip: "Lewati",
};
const BADGE_CLS: Record<string, string> = {
  new: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  existing: "bg-amber-50 text-amber-700 ring-amber-600/20",
  error: "bg-red-50 text-red-700 ring-red-600/20",
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchColumn(header: string): keyof typeof COLUMN_ALIASES | null {
  const norm = normalizeHeader(header);
  let bestKey: keyof typeof COLUMN_ALIASES | null = null;
  let bestScore = 0;
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeHeader(alias);
      if (norm === normAlias) return key as keyof typeof COLUMN_ALIASES;
      if (norm.includes(normAlias) || normAlias.includes(norm)) {
        const score = Math.min(norm.length, normAlias.length);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key as keyof typeof COLUMN_ALIASES;
        }
      }
    }
  }
  return bestKey;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function UserImportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapped, setMapped] = useState<
    Record<string, keyof typeof COLUMN_ALIASES | null>
  >({});
  const [rawRows, setRawRows] = useState<ImportRowInput[]>([]);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [actions, setActions] = useState<ImportRowAction[]>([]);
  const [unmatchedPolicy, setUnmatchedPolicy] =
    useState<UnmatchedUnitPolicy>("keep");
  const [result, setResult] = useState<ImportResult | null>(null);
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
    setActions([]);
    setResult(null);
    setLoading(false);
    setPreviewLoading(false);
    setError(null);
    setQuery("");
    setUnmatchedPolicy("keep");
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const handleFile = useCallback(async (f: File) => {
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
        setError("File kosong atau tidak memiliki data.");
        setLoading(false);
        return;
      }
      if (json.length > MAX_ROWS) {
        setError(
          `File terlalu besar. Maksimal ${MAX_ROWS.toLocaleString("id-ID")} baris.`,
        );
        setLoading(false);
        return;
      }

      const rawHeaders = Object.keys(json[0]);
      const colMap: Record<string, keyof typeof COLUMN_ALIASES | null> = {};
      for (const h of rawHeaders) {
        colMap[h] = matchColumn(h);
      }
      setHeaders(rawHeaders);
      setMapped(colMap);

      const rows: ImportRowInput[] = json.map((obj) => {
        const row: ImportRowInput = {};
        for (const h of rawHeaders) {
          const key = colMap[h];
          if (key) {
            (row as Record<string, unknown>)[key] = obj[h];
          }
        }
        return row;
      });
      setRawRows(rows);
    } catch {
      setError(
        "Gagal membaca file. Pastikan format file valid (.xlsx atau .csv).",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
      const rows = await importUsersPreview(rawRows);
      setPreviewRows(rows);
      setActions(
        rows.map((r) => ({ rowIndex: r.rowIndex, action: r.suggestedAction })),
      );
      setStep("preview");
    } catch {
      setError("Gagal memproses data. Silakan coba lagi.");
    } finally {
      setPreviewLoading(false);
    }
  }, [rawRows]);

  const handleToggleAction = useCallback(
    (rowIndex: number, action: ImportAction) => {
      setActions((prev) =>
        prev.map((a) => (a.rowIndex === rowIndex ? { ...a, action } : a)),
      );
    },
    [],
  );

  const handleExecute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await importUsersExecute(rawRows, actions, unmatchedPolicy);
      setResult(res);
      setStep("result");
      const total = res.success + res.updated;
      if (total > 0) {
        showSuccess("Impor berhasil", `${total} pengguna berhasil diproses.`);
      }
      if (res.errors.length > 0) {
        showError(
          `${res.errors.length} baris gagal diimpor. Lihat detail di bawah.`,
        );
      }
    } catch {
      const msg = "Gagal menjalankan impor. Silakan coba lagi.";
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [rawRows, actions, unmatchedPolicy]);

  const filteredPreview = useMemo(() => {
    if (!query.trim()) return previewRows;
    const q = query.toLowerCase();
    return previewRows.filter(
      (r) =>
        r.npp.includes(q) ||
        r.nama_pegawai.toLowerCase().includes(q) ||
        r.nama_jabatan.toLowerCase().includes(q),
    );
  }, [previewRows, query]);

  const stats = useMemo(() => {
    const s = {
      new: 0,
      existing: 0,
      error: 0,
      unmatched: 0,
      total: previewRows.length,
    };
    for (const r of previewRows) {
      if (r.status === "new") s.new++;
      else if (r.status === "existing") s.existing++;
      else s.error++;
      if (r.unit_kerja && !r.unitMatched) s.unmatched++;
    }
    return s;
  }, [previewRows]);

  const willImportCount = useMemo(() => {
    const rowByIndex = new Map(previewRows.map((r) => [r.rowIndex, r]));
    return actions.filter((a) => {
      if (a.action === "skip") return false;
      const row = rowByIndex.get(a.rowIndex);
      if (!row) return false;
      if (unmatchedPolicy === "skip" && row.unit_kerja && !row.unitMatched) {
        return false;
      }
      return true;
    }).length;
  }, [actions, previewRows, unmatchedPolicy]);

  const mappedCount = Object.values(mapped).filter(Boolean).length;
  const unmappedHeaders = headers.filter((h) => !mapped[h]);

  /* ---------- Trigger button ---------- */
  const trigger = (
    <button
      type="button"
      onClick={() => {
        reset();
        setOpen(true);
      }}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-outline bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
    >
      <FileArrowUpIcon size={16} weight="bold" />
      Import Pengguna
    </button>
  );

  /* ---------- Render ---------- */
  return (
    <>
      {trigger}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Import pengguna"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={handleClose}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-lg bg-surface shadow-ambient"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold text-ink">
                  Import Pengguna
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  {step === "upload" &&
                    "Unggah file Excel atau CSV untuk mengimpor data pengguna."}
                  {step === "preview" &&
                    `Pratinjau ${previewRows.length.toLocaleString("id-ID")} baris dari "${file?.name ?? ""}".`}
                  {step === "result" && "Hasil import pengguna."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
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
                  {step === "upload" && "1. Unggah"}
                  {step === "preview" && "2. Pratinjau"}
                  {step === "result" && "3. Hasil"}
                </ProgressLabel>
                <ProgressValue />
              </Progress>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {error ? (
                <div className="mb-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <WarningIcon
                    size={16}
                    className="mt-0.5 shrink-0"
                    weight="fill"
                  />
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Step: Upload */}
              {step === "upload" && (
                <div className="flex flex-col items-center gap-6">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full max-w-lg cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-outline bg-surface-muted/30 px-8 py-12 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileArrowUpIcon size={22} weight="bold" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {file ? file.name : "Seret & lepas file di sini"}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {file
                          ? `${formatBytes(file.size)} — klik untuk ganti`
                          : "atau klik untuk memilih file"}
                      </p>
                    </div>
                    <p className="text-[11px] text-ink-muted/70">
                      Format: .xlsx, .csv — Maks.{" "}
                      {MAX_ROWS.toLocaleString("id-ID")} baris
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
                  {file && !loading && !previewLoading && (
                    <button
                      type="button"
                      onClick={handlePreview}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                    >
                      Lanjutkan ke Pratinjau
                      <ArrowRightIcon size={14} weight="bold" />
                    </button>
                  )}
                  {previewLoading && (
                    <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
                      <Spinner className="size-4" />
                      Memuat pratinjau...
                    </span>
                  )}
                  {loading && !previewLoading && (
                    <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
                      <Spinner className="size-4" />
                      Membaca file...
                    </span>
                  )}
                </div>
              )}

              {/* Step: Preview */}
              {step === "preview" && (
                <div className="flex flex-col gap-5">
                  {/* Column mapping summary */}
                  <div className="rounded-md border border-outline bg-surface-muted/30 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold text-ink">
                      Pemetaan Kolom ({mappedCount}/{headers.length} terpetakan)
                    </p>
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
                              <span className="text-[10px] opacity-70">
                                → {key}
                              </span>
                            ) : (
                              <span className="text-[10px] opacity-50">
                                (tidak terpetakan)
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {unmappedHeaders.length > 0 && (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-600">
                        <InfoIcon size={12} weight="fill" />
                        {unmappedHeaders.length} kolom tidak terpetakan dan akan
                        diabaikan.
                      </p>
                    )}
                  </div>

                  {/* Unit kerja handling */}
                  <div className="rounded-md border border-outline bg-surface-muted/30 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold text-ink">
                      Unit Kerja
                      {stats.unmatched > 0 ? (
                        <span className="ml-1.5 font-normal text-amber-600">
                          · {stats.unmatched} baris unit tidak cocok dengan
                          struktur
                        </span>
                      ) : (
                        <span className="ml-1.5 font-normal text-emerald-600">
                          · semua unit cocok dengan struktur
                        </span>
                      )}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <InfoIcon
                          size={14}
                          weight="fill"
                          className="shrink-0"
                        />
                        <span>
                          Baris dengan unit di luar struktur organisasi:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <label
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                            unmatchedPolicy === "keep"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline bg-surface text-ink-muted hover:bg-surface-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="unmatched-unit-policy"
                            checked={unmatchedPolicy === "keep"}
                            onChange={() => setUnmatchedPolicy("keep")}
                            className="accent-(--color-primary)"
                          />
                          Tetap impor
                          <span className="font-normal opacity-70">
                            (unit dikosongkan dari struktur)
                          </span>
                        </label>
                        <label
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                            unmatchedPolicy === "skip"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-outline bg-surface text-ink-muted hover:bg-surface-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="unmatched-unit-policy"
                            checked={unmatchedPolicy === "skip"}
                            onChange={() => setUnmatchedPolicy("skip")}
                            className="accent-(--color-primary)"
                          />
                          Lewati baris
                          <span className="font-normal opacity-70">
                            ({stats.unmatched} baris)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Stats + Search */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {stats.new} Baru
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        {stats.existing} Ada
                      </span>
                      {stats.error > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                          {stats.error} Error
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
                        placeholder="Cari NPP / nama..."
                        className="h-8 w-full rounded-md border border-outline bg-surface pl-8 pr-3 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus sm:w-52"
                      />
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-hidden rounded-lg border border-outline">
                    <div className="max-h-[40vh] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 border-b border-outline bg-surface-muted/80 backdrop-blur">
                          <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                            <th className="px-3 py-2.5 text-center w-10">#</th>
                            <th className="px-3 py-2.5">NPP</th>
                            <th className="px-3 py-2.5">Nama</th>
                            <th className="px-3 py-2.5">Jabatan</th>
                            <th className="px-3 py-2.5">Unit</th>
                            <th className="px-3 py-2.5">Role</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5 text-right w-32">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline">
                          {filteredPreview.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-8 text-center text-ink-muted"
                              >
                                Tidak ada data yang cocok.
                              </td>
                            </tr>
                          ) : (
                            filteredPreview.map((r) => {
                              const currentAction =
                                actions.find((a) => a.rowIndex === r.rowIndex)
                                  ?.action ?? r.suggestedAction;
                              return (
                                <tr
                                  key={r.rowIndex}
                                  className="hover:bg-surface-muted/40"
                                >
                                  <td className="px-3 py-2 text-center text-ink-muted">
                                    {r.rowIndex + 1}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-ink">
                                    {r.npp}
                                  </td>
                                  <td className="px-3 py-2 text-ink">
                                    {r.nama_pegawai}
                                  </td>
                                  <td className="px-3 py-2 text-ink-muted">
                                    {r.nama_jabatan || "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {r.unit_kerja ? (
                                      <span
                                        title={r.unit_kerja}
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                                          r.unitMatched
                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                            : "bg-amber-50 text-amber-700 ring-amber-600/20"
                                        }`}
                                      >
                                        {r.unitMatched ? (
                                          <CheckCircleIcon
                                            size={10}
                                            weight="fill"
                                          />
                                        ) : (
                                          <WarningIcon
                                            size={10}
                                            weight="fill"
                                          />
                                        )}
                                        <span className="max-w-36 truncate">
                                          {r.unitMatched
                                            ? "Tercocok"
                                            : "Diluar struktur"}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-ink-muted/50">
                                        —
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-ink-muted">
                                    {r.default_role}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${BADGE_CLS[r.status]}`}
                                    >
                                      {r.status === "new" && "Baru"}
                                      {r.status === "existing" && "Ada"}
                                      {r.status === "error" && "Error"}
                                    </span>
                                    {r.errorMessage ? (
                                      <p className="mt-0.5 text-[10px] text-red-600">
                                        {r.errorMessage}
                                      </p>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {r.status === "error" ? (
                                      <span className="text-[10px] text-ink-muted">
                                        Lewati
                                      </span>
                                    ) : r.status === "new" ? (
                                      <span className="text-[10px] font-medium text-emerald-700">
                                        {LABELS.create}
                                      </span>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleAction(
                                              r.rowIndex,
                                              "update",
                                            )
                                          }
                                          className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                                            currentAction === "update"
                                              ? "bg-amber-100 text-amber-700"
                                              : "text-ink-muted hover:bg-surface-muted"
                                          }`}
                                        >
                                          {LABELS.update}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleAction(
                                              r.rowIndex,
                                              "skip",
                                            )
                                          }
                                          className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                                            currentAction === "skip"
                                              ? "bg-surface-muted text-ink-muted"
                                              : "text-ink-muted hover:bg-surface-muted"
                                          }`}
                                        >
                                          {LABELS.skip}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Result */}
              {step === "result" && result && (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <CheckCircleIcon size={28} weight="fill" />
                    </span>
                    <h3 className="text-base font-semibold text-ink">
                      Impor Selesai
                    </h3>
                    <p className="text-sm text-ink-muted">
                      {result.success + result.updated + result.skipped} baris
                      diproses.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {result.success > 0 && (
                      <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2.5 text-sm">
                        <span className="text-emerald-600">
                          <CheckCircleIcon size={16} weight="fill" />
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {result.success} dibuat
                        </span>
                      </div>
                    )}
                    {result.updated > 0 && (
                      <div className="flex items-center gap-2 rounded-md bg-amber-50 px-4 py-2.5 text-sm">
                        <span className="text-amber-600">
                          <CheckCircleIcon size={16} weight="fill" />
                        </span>
                        <span className="font-semibold text-amber-700">
                          {result.updated} diperbarui
                        </span>
                      </div>
                    )}
                    {result.skipped > 0 && (
                      <div className="flex items-center gap-2 rounded-md bg-surface-muted px-4 py-2.5 text-sm">
                        <span className="text-ink-muted">
                          <FunnelIcon size={16} weight="bold" />
                        </span>
                        <span className="font-semibold text-ink-muted">
                          {result.skipped} dilewati
                        </span>
                      </div>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="w-full max-w-lg rounded-md border border-red-200 bg-red-50 px-4 py-3">
                      <p className="mb-2 text-xs font-semibold text-red-700">
                        {result.errors.length} Error:
                      </p>
                      <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                        {result.errors.map((e, i) => (
                          <li key={i}>
                            Baris {e.rowIndex + 1} (NPP {e.npp}): {e.message}
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
                    setActions([]);
                  }}
                  disabled={loading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
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
                  disabled={loading}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Spinner className="size-3" />
                      Memproses...
                    </>
                  ) : (
                    `Impor ${willImportCount} Baris`
                  )}
                </button>
              )}

              {step === "result" && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
