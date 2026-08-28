"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
  CloudArrowUpIcon,
  CloudCheckIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  saveDialogForm,
  type AspekInput,
} from "@/lib/actions/pegawai";
import { ASPEK_DESC, ASPEK_LABEL, ASPEK_ORDER } from "@/lib/constants/aspek";
import { formatPeriode } from "@/lib/constants/triwulan";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { isDialogExpired } from "@/lib/utils/dialog-deadline";
import { AutoResizeTextarea } from "@/components/dialog/auto-resize-textarea";
import {
  useDialogLive,
  formatClock,
} from "@/lib/hooks/use-dialog-live";
import type {
  JenisAspek,
  Triwulan,
} from "@/generated/prisma/enums";

interface MetodeOption {
  id: number;
  nama_metode: string;
}

interface ItemDraft {
  id?: number;
  dialog_evaluasi: string;
  kompetensi_dikembangkan: string;
  id_metode_pengembangan: string;
  metode_pengembangan_lainnya: string;
  waktu_pelaksanaan: string;
}

interface AspekDraft {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string;
  tanggung_jawab_atasan?: string;
  items: ItemDraft[];
}

interface ExistingAspek {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string | null;
  tanggung_jawab_atasan?: string | null;
  item: {
    id: number;
    dialog_evaluasi: string | null;
    kompetensi_dikembangkan: string | null;
    id_metode_pengembangan: number | null;
    metode_pengembangan_lainnya: string | null;
    waktu_pelaksanaan: Date | null;
  }[];
}

interface FormGroup {
  label: string;
  jenis: JenisAspek;
}

interface FormSection {
  letter: string;
  title: string;
  desc: string;
  groups: FormGroup[];
}

const FORM_SECTIONS: FormSection[] = [
  {
    letter: "A",
    title: ASPEK_LABEL.SKP,
    desc: ASPEK_DESC.SKP,
    groups: [{ label: ASPEK_LABEL.SKP, jenis: "SKP" }],
  },
  {
    letter: "B",
    title: ASPEK_LABEL.GAP_ASESMEN,
    desc: ASPEK_DESC.GAP_ASESMEN,
    groups: [{ label: ASPEK_LABEL.GAP_ASESMEN, jenis: "GAP_ASESMEN" }],
  },
  {
    letter: "C",
    title: ASPEK_LABEL.PERILAKU,
    desc: ASPEK_DESC.PERILAKU,
    groups: [{ label: ASPEK_LABEL.PERILAKU, jenis: "PERILAKU" }],
  },
  {
    letter: "D",
    title: "Aspirasi Karir",
    desc: "Aspirasi pengembangan karir dalam jangka pendek dan menengah.",
    groups: [
      { label: "1. Jangka Pendek (1-2 Tahun)", jenis: "KARIR_PENDEK" },
      { label: "2. Jangka Menengah (3-5 Tahun)", jenis: "KARIR_MENENGAH" },
    ],
  },
];

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus";
const TEXTAREA_CLASSES =
  "w-full rounded-md border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

function emptyItem(): ItemDraft {
  return {
    dialog_evaluasi: "",
    kompetensi_dikembangkan: "",
    id_metode_pengembangan: "",
    metode_pengembangan_lainnya: "",
    waktu_pelaksanaan: "",
  };
}

function buildAspekPayload(source: AspekDraft[]): AspekInput[] {
  return source.map((d) => ({
    jenis_aspek: d.jenis_aspek,
    tanggung_jawab_pegawai: d.tanggung_jawab_pegawai,
    tanggung_jawab_atasan: d.tanggung_jawab_atasan,
    items: d.items.map((item) => ({
      id: item.id,
      dialog_evaluasi: item.dialog_evaluasi,
      kompetensi_dikembangkan: item.kompetensi_dikembangkan,
      id_metode_pengembangan: item.id_metode_pengembangan
        ? Number(item.id_metode_pengembangan)
        : null,
      metode_pengembangan_lainnya: item.metode_pengembangan_lainnya,
      waktu_pelaksanaan: item.waktu_pelaksanaan,
    })),
  }));
}

function toDateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dialogEvaluasiLabel(jenis: JenisAspek): string {
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

const ASPEK_SECTION_LABEL: Record<JenisAspek, string> = {
  SKP: "Bagian A (SKP)",
  GAP_ASESMEN: "Bagian B (Gap Asesmen)",
  PERILAKU: "Bagian C (Perilaku)",
  KARIR_PENDEK: "Bagian D.1 (Karir Jangka Pendek)",
  KARIR_MENENGAH: "Bagian D.2 (Karir Jangka Menengah)",
};

function isItemEmpty(item: ItemDraft): boolean {
  return (
    !item.dialog_evaluasi.trim() &&
    !item.kompetensi_dikembangkan.trim() &&
    !item.id_metode_pengembangan &&
    !item.metode_pengembangan_lainnya.trim() &&
    !item.waktu_pelaksanaan.trim()
  );
}

function isItemComplete(
  item: ItemDraft,
  isLainnya: (id: string) => boolean,
): boolean {
  if (
    !item.dialog_evaluasi.trim() ||
    !item.kompetensi_dikembangkan.trim() ||
    !item.id_metode_pengembangan ||
    !item.waktu_pelaksanaan.trim()
  ) {
    return false;
  }
  if (
    isLainnya(item.id_metode_pengembangan) &&
    !item.metode_pengembangan_lainnya.trim()
  ) {
    return false;
  }
  return true;
}

function validateSubmit(
  drafts: AspekDraft[],
  isLainnya: (id: string) => boolean,
  isLanjutan: boolean,
): string | null {
  const problems: string[] = [];
  for (const draft of drafts) {
    const label = ASPEK_SECTION_LABEL[draft.jenis_aspek];
    const nonEmptyItems = draft.items.filter((item) => !isItemEmpty(item));
    if (nonEmptyItems.length === 0) {
      if (isLanjutan) {
        // if (!draft.tanggung_jawab_pegawai.trim()) {
        //   problems.push(`${label} tanggung jawab pegawai wajib diisi`);
        // }
        continue;
      }
      problems.push(`${label} belum memiliki rincian`);
      continue;
    }
    if (nonEmptyItems.some((item) => !isItemComplete(item, isLainnya))) {
      problems.push(`${label} terdapat rincian yang belum lengkap`);
    }
    if (!draft.tanggung_jawab_pegawai.trim()) {
      problems.push(`${label} tanggung jawab pegawai wajib diisi`);
    }
  }
  return problems.length > 0 ? problems.join("; ") : null;
}

function SaveStateMeta({
  saveState,
  savedAt,
}: {
  saveState: "idle" | "saving" | "saved" | "error";
  savedAt: string;
}) {
  if (saveState === "saving") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-muted">
        <SpinnerGapIcon size={14} weight="bold" className="animate-spin" />
        Menyimpan…
      </span>
    );
  }
  if (saveState === "error") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary-strong">
        <WarningCircleIcon size={14} weight="fill" />
        Gagal menyimpan — coba lagi
      </span>
    );
  }
  if (saveState === "saved") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-secondary">
        <CloudCheckIcon size={14} weight="fill" />
        Tersimpan otomatis · {savedAt}
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center text-xs font-medium text-ink-muted">
      <CloudArrowUpIcon size={14} weight="bold" />
    </span>
  );
}

export function DialogForm({
  dialogId,
  periodeTahun,
  triwulan,
  deskripsiKinerja,
  deskripsiPegawai,
  atasanNama,
  aspek,
  isLanjutan = false,
  metodeList,
  jadwalDialog,
  isJadwalArrived,
}: {
  dialogId: number;
  periodeTahun: number;
  triwulan: Triwulan;
  deskripsiKinerja: string | null;
  deskripsiPegawai?: string | null;
  atasanNama: string;
  aspek: ExistingAspek[];
  isLanjutan?: boolean;
  metodeList: MetodeOption[];
  jadwalDialog?: Date | null;
  isJadwalArrived?: boolean;
}) {
  const [drafts, setDrafts] = useState<AspekDraft[]>(() =>
    ASPEK_ORDER.map((jenis) => {
      const existing = aspek.find((a) => a.jenis_aspek === jenis);
      return {
        jenis_aspek: jenis,
        tanggung_jawab_pegawai: existing?.tanggung_jawab_pegawai ?? "",
        tanggung_jawab_atasan: existing?.tanggung_jawab_atasan ?? "",
        items: (existing?.item ?? []).map((item) => ({
          id: item.id,
          dialog_evaluasi: item.dialog_evaluasi ?? "",
          kompetensi_dikembangkan: item.kompetensi_dikembangkan ?? "",
          id_metode_pengembangan: item.id_metode_pengembangan
            ? String(item.id_metode_pengembangan)
            : "",
          metode_pengembangan_lainnya: item.metode_pengembangan_lainnya ?? "",
          waktu_pelaksanaan: toDateInputValue(item.waktu_pelaksanaan),
        })),
      };
    }),
  );
  const [deskripsiPegawaiText, setDeskripsiPegawaiText] = useState(
    deskripsiPegawai ?? "",
  );
  const [liveDeskripsiAtasan, setLiveDeskripsiAtasan] = useState(
    deskripsiKinerja ?? "",
  );
  const [pending, setPending] = useState<"draft" | "submit" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [savedAt, setSavedAt] = useState("");
  const draftsRef = useRef(drafts);
  const deskripsiPegawaiRef = useRef(deskripsiPegawaiText);
  const savedJsonRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const { partnerTyping, isFieldLocked, sendTyping } = useDialogLive({
    dialogId,
    onState: (state) => {
      if (state.deskripsi_kinerja !== undefined) {
        setLiveDeskripsiAtasan(state.deskripsi_kinerja ?? "");
      }
      if (state.aspek) {
        setDrafts((prev) =>
          prev.map((d) => {
            const liveRow = state.aspek.find((a) => a.jenis_aspek === d.jenis_aspek);
            if (!liveRow) return d;
            return {
              ...d,
              tanggung_jawab_atasan:
                liveRow.tanggung_jawab_atasan ?? d.tanggung_jawab_atasan ?? "",
            };
          }),
        );
      }
    },
  });

  const notifyTyping = useCallback(
    (fieldId?: string) => {
      const key = fieldId ?? "__general__";
      sendTyping(true, fieldId, { role: "pegawai" });
      if (typingStopTimers.current[key]) {
        clearTimeout(typingStopTimers.current[key]);
      }
      typingStopTimers.current[key] = setTimeout(() => {
        sendTyping(false, fieldId, { role: "pegawai" });
        delete typingStopTimers.current[key];
      }, 1_500);
    },
    [sendTyping],
  );

  useEffect(() => {
    draftsRef.current = drafts;
    deskripsiPegawaiRef.current = deskripsiPegawaiText;
  }, [drafts, deskripsiPegawaiText]);

  const enqueueTask = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task, task);
    return queueRef.current;
  }, []);

  const runPersist = useCallback(async () => {
    if (savedJsonRef.current === null) return;
    const json = JSON.stringify({
      drafts: draftsRef.current,
      deskripsi: deskripsiPegawaiRef.current,
    });
    if (json === savedJsonRef.current) return;
    setSaveState("saving");
    try {
      const result = await saveDialogForm(
        dialogId,
        "draft",
        buildAspekPayload(draftsRef.current),
        deskripsiPegawaiRef.current,
      );
      if (result?.error) {
        showError(result.error);
        setSaveState("error");
        return;
      }
      savedJsonRef.current = json;
      setSaveState("saved");
      setSavedAt(formatClock());
    } catch {
      showError("Gagal menyimpan otomatis. Periksa koneksi lalu lanjutkan mengetik.");
      setSaveState("error");
    }
  }, [dialogId]);

  const flushPersist = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await enqueueTask(runPersist);
  }, [enqueueTask, runPersist]);

  useEffect(() => {
    if (pending !== null) return;
    const currentPayload = {
      drafts,
      deskripsi: deskripsiPegawaiText,
    };
    if (savedJsonRef.current === null) {
      savedJsonRef.current = JSON.stringify(currentPayload);
      return;
    }
    const json = JSON.stringify(currentPayload);
    if (json === savedJsonRef.current) return;
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void enqueueTask(runPersist);
    }, 800);
  }, [drafts, deskripsiPegawaiText, pending, enqueueTask, runPersist]);

  useEffect(() => {
    const onBeforeUnload = () => {
      void flushPersist();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
      for (const t of Object.values(typingStopTimers.current)) {
        clearTimeout(t);
      }
      typingStopTimers.current = {};
    };
  }, [flushPersist]);

  const isLainnya = useMemo(() => {
    const names = new Map(metodeList.map((m) => [m.id, m.nama_metode]));
    return (id: string) => {
      const name = names.get(Number(id));
      return name ? name.toLowerCase().includes("lainnya") : false;
    };
  }, [metodeList]);

  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showConfirm]);

  function updateAspek(jenis: JenisAspek, patch: Partial<AspekDraft>) {
    notifyTyping();
    setDrafts((prev) =>
      prev.map((d) => (d.jenis_aspek === jenis ? { ...d, ...patch } : d)),
    );
  }

  function updateItem(
    jenis: JenisAspek,
    index: number,
    patch: Partial<ItemDraft>,
  ) {
    notifyTyping();
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.jenis_aspek !== jenis) return d;
        const nextItems = [...d.items];
        nextItems[index] = { ...nextItems[index], ...patch };
        return { ...d, items: nextItems };
      }),
    );
  }

  function addItem(jenis: JenisAspek) {
    updateAspek(jenis, {
      items: [
        ...drafts.find((d) => d.jenis_aspek === jenis)!.items,
        emptyItem(),
      ],
    });
  }

  function removeItem(jenis: JenisAspek, index: number) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.jenis_aspek === jenis
          ? { ...d, items: d.items.filter((_, i) => i !== index) }
          : d,
      ),
    );
  }

  async function handleSubmit(mode: "draft" | "submit") {
    setPending(mode);

    const result = await saveDialogForm(
      dialogId,
      mode,
      buildAspekPayload(draftsRef.current),
      deskripsiPegawaiRef.current,
    );

    if (result?.error) {
      showError(result.error);
      setPending(null);
      return;
    }

    savedJsonRef.current = JSON.stringify(draftsRef.current);

    if (mode === "draft") {
      setPending(null);
      showSuccess("Draft dialog berhasil disimpan");
    }
  }

  async function handleSubmitClick() {
    await flushPersist();

    // Check H+7 expiry (7 days after jadwal_dialog)
    if (isDialogExpired(jadwalDialog)) {
      showError("Waktu pengisian dialog telah berakhir (maksimal 7 hari setelah jadwal dialog).");
      return;
    }

    const validationError = validateSubmit(
      draftsRef.current,
      isLainnya,
      isLanjutan,
    );
    if (validationError) {
      showError(validationError);
      return;
    }
    setShowConfirm(true);
  }

  return (
    <div className="flex flex-col gap-8 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/pegawai/dialog/${dialogId}`}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            Kembali ke Detail Dialog
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
              Isi Dialog Kinerja
            </h1>
            <span className="rounded-md border border-outline bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              {formatPeriode(triwulan, periodeTahun)}
            </span>
          </div>
          {jadwalDialog && (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-md border border-outline bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                Jadwal: {new Date(jadwalDialog).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
              {!isJadwalArrived && (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Belum waktunya mengisi (mulai {new Date(jadwalDialog).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })})
                </span>
              )}
            </div>
          )}
          <p className="text-sm leading-5 text-ink-muted">
            Atasan: <span className="font-medium text-ink">{atasanNama}</span> · Lengkapi empat aspek evaluasi di bawah ini.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg border border-outline bg-surface px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="deskripsi-pegawai-input" className={LABEL_CLASSES}>
              {liveDeskripsiAtasan?.trim() ? "Deskripsi Kinerja (versi Pegawai)" : "Deskripsi Kinerja (Pegawai)"}
            </label>
            {isFieldLocked("deskripsi_pegawai") ? (
              <span className="text-xs font-medium text-primary animate-pulse">
                Sedang diedit oleh Atasan...
              </span>
            ) : partnerTyping?.isTyping &&
              !partnerTyping.fieldId ? (
              <span className="text-xs font-medium text-primary animate-pulse">
                Atasan sedang mengetik...
              </span>
            ) : null}
          </div>
          <AutoResizeTextarea
            id="deskripsi-pegawai-input"
            value={deskripsiPegawaiText}
            rows={3}
            disabled={isFieldLocked("deskripsi_pegawai")}
            onChange={(e) => {
              setDeskripsiPegawaiText(e.target.value);
              notifyTyping("deskripsi_pegawai");
            }}
            onFocus={() => notifyTyping("deskripsi_pegawai")}
            placeholder="Tuliskan gambaran/deskripsi kinerja versi Anda (opsional)..."
            className={`${TEXTAREA_CLASSES} ${
              isFieldLocked("deskripsi_pegawai")
                ? "bg-surface-muted/60 cursor-not-allowed opacity-80"
                : ""
            }`}
          />
        </div>

        {liveDeskripsiAtasan?.trim() ? (
          <div className="rounded-lg border border-outline bg-surface px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className={LABEL_CLASSES}>
                {deskripsiPegawaiText.trim() ? "Deskripsi Kinerja (versi Atasan)" : "Deskripsi Kinerja (Atasan)"}
              </span>
              {isFieldLocked("deskripsi_atasan") ? (
                <span className="text-xs font-medium text-primary animate-pulse">
                  Sedang diedit oleh Atasan...
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-ink">
              {liveDeskripsiAtasan}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {FORM_SECTIONS.map(({ letter, title, desc, groups }) => (
          <section
            key={letter}
            aria-labelledby={`aspek-${letter}`}
            className="rounded-lg border border-outline bg-surface"
          >
            <div className="flex flex-col gap-0.5 border-b border-outline px-5 py-3.5">
              <h2
                id={`aspek-${letter}`}
                className="text-sm font-semibold text-ink"
              >
                {letter}. {title}
              </h2>
              <p className="text-xs leading-4 text-ink-muted">{desc}</p>
            </div>

            <div className="flex flex-col gap-6 px-5 py-4">
              {groups.map(({ label, jenis }) => {
                const draft = drafts.find((d) => d.jenis_aspek === jenis)!;

                return (
                  <div key={jenis} className="flex flex-col gap-5">
                    {groups.length > 1 ? (
                      <h3 className="text-sm font-semibold text-ink">
                        {label}
                      </h3>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => addItem(jenis)}
                      disabled={pending !== null}
                      className="inline-flex w-fit items-center gap-1.5 rounded-md border border-outline px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <PlusIcon size={14} weight="bold" />
                      Tambah Rincian
                    </button>

                    {draft.items.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {draft.items.map((item, itemIndex) => (
                          <fieldset
                            key={itemIndex}
                            className="flex flex-col gap-3 rounded-md border border-outline bg-surface-muted/40 px-4 py-3.5"
                          >
                            <legend className="px-1 text-xs font-semibold text-ink-muted">
                              <span>Rincian #{itemIndex + 1}</span>
                              {isLanjutan && item.id !== undefined ? (
                                <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Dari evaluasi sebelumnya
                                </span>
                              ) : null}
                            </legend>

                            <div className="flex flex-col gap-1.5">
                              <label
                                htmlFor={`${jenis}-${itemIndex}-tujuan`}
                                className={LABEL_CLASSES}
                              >
                                {dialogEvaluasiLabel(jenis)}
                              </label>
                              <input
                                id={`${jenis}-${itemIndex}-tujuan`}
                                type="text"
                                value={item.dialog_evaluasi}
                                onChange={(e) =>
                                  updateItem(jenis, itemIndex, {
                                    dialog_evaluasi: e.target.value,
                                  })
                                }
                                placeholder="Tujuan evaluasi atau aspirasi"
                                className={INPUT_CLASSES}
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label
                                htmlFor={`${jenis}-${itemIndex}-kompetensi`}
                                className={LABEL_CLASSES}
                              >
                                Kompetensi yang Dikembangkan
                              </label>
                              <input
                                id={`${jenis}-${itemIndex}-kompetensi`}
                                type="text"
                                value={item.kompetensi_dikembangkan}
                                onChange={(e) =>
                                  updateItem(jenis, itemIndex, {
                                    kompetensi_dikembangkan: e.target.value,
                                  })
                                }
                                placeholder="Nama kompetensi"
                                className={INPUT_CLASSES}
                              />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="flex flex-col gap-1.5">
                                <label
                                  htmlFor={`${jenis}-${itemIndex}-metode`}
                                  className={LABEL_CLASSES}
                                >
                                  Metode Pengembangan
                                </label>
                                <select
                                  id={`${jenis}-${itemIndex}-metode`}
                                  value={item.id_metode_pengembangan}
                                  onChange={(e) =>
                                    updateItem(jenis, itemIndex, {
                                      id_metode_pengembangan: e.target.value,
                                    })
                                  }
                                  className={INPUT_CLASSES}
                                >
                                  <option value="">— Pilih Metode —</option>
                                  {metodeList.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.nama_metode}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {isLainnya(item.id_metode_pengembangan) ? (
                                <div className="flex flex-col gap-1.5">
                                  <label
                                    htmlFor={`${jenis}-${itemIndex}-metode-lain`}
                                    className={LABEL_CLASSES}
                                  >
                                    Sebutkan Metode Lainnya
                                  </label>
                                  <input
                                    id={`${jenis}-${itemIndex}-metode-lain`}
                                    type="text"
                                    value={item.metode_pengembangan_lainnya}
                                    onChange={(e) =>
                                      updateItem(jenis, itemIndex, {
                                        metode_pengembangan_lainnya:
                                          e.target.value,
                                      })
                                    }
                                    placeholder="Nama metode lainnya"
                                    className={INPUT_CLASSES}
                                  />
                                </div>
                              ) : null}

                              <div className="flex flex-col gap-1.5">
                                <label
                                  htmlFor={`${jenis}-${itemIndex}-waktu`}
                                  className={LABEL_CLASSES}
                                >
                                  Waktu Pelaksanaan
                                </label>
                                <input
                                  id={`${jenis}-${itemIndex}-waktu`}
                                  type="date"
                                  value={item.waktu_pelaksanaan}
                                  onChange={(e) =>
                                    updateItem(jenis, itemIndex, {
                                      waktu_pelaksanaan: e.target.value,
                                    })
                                  }
                                  className={INPUT_CLASSES}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(jenis, itemIndex)}
                              disabled={pending !== null || (isLanjutan && item.id !== undefined)}
                              className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-error transition-colors hover:bg-error-container disabled:opacity-50"
                            >
                              <TrashIcon size={14} weight="bold" />
                              Hapus Rincian
                            </button>
                          </fieldset>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`${jenis}-tj-pegawai`}
                            className={LABEL_CLASSES}
                          >
                            Tanggung Jawab Pegawai
                          </label>
                          {isFieldLocked(`tanggung_jawab_pegawai_${jenis}`) ? (
                            <span className="text-xs font-medium text-primary animate-pulse">
                              Sedang diedit oleh Atasan...
                            </span>
                          ) : null}
                        </div>
                        <AutoResizeTextarea
                          id={`${jenis}-tj-pegawai`}
                          rows={3}
                          value={draft.tanggung_jawab_pegawai}
                          disabled={isFieldLocked(`tanggung_jawab_pegawai_${jenis}`)}
                          onChange={(e) => {
                            updateAspek(jenis, {
                              tanggung_jawab_pegawai: e.target.value,
                            });
                            notifyTyping(`tanggung_jawab_pegawai_${jenis}`);
                          }}
                          onFocus={() => notifyTyping(`tanggung_jawab_pegawai_${jenis}`)}
                          placeholder="Langkah atau komitmen yang akan Anda lakukan"
                          className={`${TEXTAREA_CLASSES} ${
                            isFieldLocked(`tanggung_jawab_pegawai_${jenis}`)
                              ? "bg-surface-muted/60 cursor-not-allowed opacity-80"
                              : ""
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`${jenis}-tj-atasan`}
                            className={LABEL_CLASSES}
                          >
                            Tanggung Jawab Atasan
                          </label>
                          {isFieldLocked(`tanggung_jawab_atasan_${jenis}`) ? (
                            <span className="text-xs font-medium text-primary animate-pulse">
                              Sedang diedit oleh Atasan...
                            </span>
                          ) : null}
                        </div>
                        <AutoResizeTextarea
                          id={`${jenis}-tj-atasan`}
                          rows={3}
                          value={draft.tanggung_jawab_atasan ?? ""}
                          disabled={isFieldLocked(`tanggung_jawab_atasan_${jenis}`)}
                          onChange={(e) => {
                            updateAspek(jenis, {
                              tanggung_jawab_atasan: e.target.value,
                            });
                            notifyTyping(`tanggung_jawab_atasan_${jenis}`);
                          }}
                          onFocus={() => notifyTyping(`tanggung_jawab_atasan_${jenis}`)}
                          placeholder="Tuliskan usulan atau komitmen atasan untuk mendukung aspek ini..."
                          className={`${TEXTAREA_CLASSES} ${
                            isFieldLocked(`tanggung_jawab_atasan_${jenis}`)
                              ? "bg-surface-muted/60 cursor-not-allowed opacity-80"
                              : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto overflow-hidden rounded-xl border border-outline bg-surface/95 shadow-ambient backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="order-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:order-1">
            <SaveStateMeta saveState={saveState} savedAt={savedAt} />
            {partnerTyping?.isTyping && !partnerTyping.fieldId ? (
              <span className="text-xs font-medium text-primary animate-pulse">
                Atasan sedang mengetik...
              </span>
            ) : null}
          </div>
          <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={pending !== null}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-outline bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === "draft" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-muted/40 border-t-ink-muted" />
              ) : (
                <FloppyDiskIcon size={16} weight="bold" />
              )}
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={pending !== null}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === "submit" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
              ) : (
                <>
                  Kirim ke Atasan
                  <ArrowRightIcon size={16} weight="bold" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi kirim dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="flex w-full max-w-md flex-col rounded-lg bg-surface shadow-ambient"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-outline px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold text-ink">
                  Kirim Dialog Kinerja?
                </h2>
                <p className="text-xs leading-4 text-ink-muted">
                  Anda akan mengirim dialog ini ke atasan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <XIcon size={16} weight="bold" />
              </button>
            </div>

            <div className="flex flex-col gap-5 px-6 py-5">
              <p className="text-sm leading-5 text-ink">
                Apakah Anda yakin ingin mengirim dialog kinerja ini ke atasan?
                Setelah dikirim, isian tidak dapat diubah lagi.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-outline-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    handleSubmit("submit");
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                >
                  <PaperPlaneTiltIcon size={16} weight="bold" />
                  Ya, Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
