"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  CloudCheckIcon,
  FloppyDiskIcon,
  GaugeIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
  TrendUpIcon,
  UserFocusIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  autosaveResponses,
  rejectDialog,
  saveDeskripsiKinerja,
  submitEvaluasi,
} from "@/lib/actions/atasan";
import { buildDialogSections } from "@/lib/constants/dialog-sections";
import type { AspekPegawaiRow } from "@/lib/utils/dialog-display";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { AspekPegawaiInput } from "@/components/pegawai/aspek-input";
import { useDialogLive } from "@/lib/hooks/use-dialog-live";
import { AutoResizeTextarea } from "@/components/dialog/auto-resize-textarea";
import type { StatusDialog, Triwulan } from "@/generated/prisma/enums";

const SECTION_ICONS = [ChartBarIcon, GaugeIcon, UserFocusIcon, TrendUpIcon] as const;

type SaveState = "idle" | "saving" | "saved";

export function AtasanEditForm({
  dialogId,
  status,
  initialDeskripsiKinerja,
  initialTahun = 2026,
  initialTriwulan = "TW3",
  aspek,
  deskripsiPegawai = "",
}: {
  dialogId: string;
  status: StatusDialog;
  initialDeskripsiKinerja: string;
  initialTahun?: number;
  initialTriwulan?: Triwulan;
  aspek: AspekPegawaiRow[];
  deskripsiPegawai?: string;
}) {
  const router = useRouter();

  // Deskripsi & Periode State
  const [deskripsi, setDeskripsi] = useState(initialDeskripsiKinerja);
  const [liveDeskripsiPegawai, setLiveDeskripsiPegawai] = useState(deskripsiPegawai);
  const [tahun, setTahun] = useState<number>(initialTahun);
  const [triwulan, setTriwulan] = useState<Triwulan>(initialTriwulan);

  // Aspect Responses State
  const [liveAspek, setLiveAspek] = useState(aspek);
  const { sections, initialValues } = buildDialogSections(aspek);
  const aspekById = new Map(liveAspek.map((a) => [a.id, a]));
  const [responses, setResponses] = useState(initialValues);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [setuju, setSetuju] = useState(false);
  const [pending, setPending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [rejectPending, setRejectPending] = useState(false);

  const deskripsiRef = useRef(deskripsi);
  const tahunRef = useRef(tahun);
  const triwulanRef = useRef(triwulan);
  const responsesRef = useRef(responses);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopTimers = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const { partnerTyping, isFieldLocked, sendTyping } = useDialogLive({
    dialogId,
    enabled: true,
    onState: (state) => {
      if (state.deskripsi_pegawai !== undefined) {
        setLiveDeskripsiPegawai(state.deskripsi_pegawai ?? "");
      }
      if (state.aspek) {
        setLiveAspek(state.aspek as unknown as AspekPegawaiRow[]);
        setResponses((prev) => {
          const next = { ...prev };
          for (const a of state.aspek) {
            if (a.tanggung_jawab_atasan !== undefined) {
              next[a.id] = a.tanggung_jawab_atasan ?? "";
            }
          }
          return next;
        });
      }
    },
  });

  const notifyTyping = useCallback(
    (fieldId?: string) => {
      const key = fieldId ?? "__general__";
      sendTyping(true, fieldId, { role: "atasan" });
      if (typingStopTimers.current[key]) {
        clearTimeout(typingStopTimers.current[key]);
      }
      typingStopTimers.current[key] = setTimeout(() => {
        sendTyping(false, fieldId, { role: "atasan" });
        delete typingStopTimers.current[key];
      }, 1_500);
    },
    [sendTyping],
  );

  useEffect(() => {
    deskripsiRef.current = deskripsi;
    tahunRef.current = tahun;
    triwulanRef.current = triwulan;
    responsesRef.current = responses;
  }, [deskripsi, tahun, triwulan, responses]);

  const persist = useCallback(async () => {
    setSaveState("saving");
    try {
      await Promise.all([
        saveDeskripsiKinerja(
          dialogId,
          deskripsiRef.current,
          tahunRef.current,
          triwulanRef.current,
        ),
        autosaveResponses(dialogId, responsesRef.current),
      ]);
      setSaveState("saved");
      setSavedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch {
      setSaveState("idle");
    }
  }, [dialogId]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void persist();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      for (const t of Object.values(typingStopTimers.current)) {
        clearTimeout(t);
      }
      typingStopTimers.current = {};
    };
  }, [persist]);

  const handleDeskripsiChange = (next: string) => {
    setDeskripsi(next);
    setSaveState("idle");
    notifyTyping("deskripsi_atasan");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 800);
  };

  const handleTahunChange = (nextTahun: number) => {
    setTahun(nextTahun);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 800);
  };

  const handleTriwulanChange = (nextTW: Triwulan) => {
    setTriwulan(nextTW);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 800);
  };

  const handleResponseChange = (id: string, value: string, fieldId?: string) => {
    const next = { ...responsesRef.current, [id]: value };
    responsesRef.current = next;
    setResponses(next);
    setSaveState("idle");
    notifyTyping(fieldId ?? `aspek_${id}`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 800);
  };

  const handleSaveNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist();
    showSuccess("Perubahan dialog kinerja berhasil disimpan");
    router.refresh();
  };

  const handleOpenConfirm = async () => {
    if (pending) return;
    if (timer.current) clearTimeout(timer.current);
    await persist();
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (pending || !setuju) return;
    setPending(true);

    const result = await submitEvaluasi(dialogId, {
      setuju,
    });

    if (result?.error) {
      showError(result.error);
      setPending(false);
      return;
    }

    showSuccess("Evaluasi berhasil dikirim ke pegawai");
    setShowConfirmModal(false);
    router.refresh();
    router.push(`/atasan/dialog/${dialogId}`);
  };

  const handleOpenReject = async () => {
    if (pending) return;
    if (timer.current) clearTimeout(timer.current);
    await persist();
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (rejectPending || !alasanTolak.trim()) {
      showError("Alasan revisi wajib diisi.");
      return;
    }
    setRejectPending(true);

    const result = await rejectDialog(dialogId, alasanTolak);

    if (result?.error) {
      showError(result.error);
      setRejectPending(false);
      return;
    }

    showSuccess("Dialog dikembalikan ke pegawai untuk revisi.");
    setShowRejectModal(false);
    router.refresh();
    router.push(`/atasan/dialog/${dialogId}`);
  };

  const saveMeta =
    saveState === "saving" ? (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-muted">
        <SpinnerGapIcon size={14} weight="bold" className="animate-spin" />
        Menyimpan…
      </span>
    ) : saveState === "saved" ? (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-secondary">
        <CloudCheckIcon size={14} weight="fill" />
        Tersimpan otomatis · {savedAt}
      </span>
    ) : (
      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-muted">
        <CloudArrowUpIcon size={14} weight="bold" />

      </span>
    );

  const canSubmitEvaluasi = status === "menunggu_atasan";

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Pengaturan Periode & Deskripsi Kinerja */}
      <section aria-label="Pengaturan dialog" className="flex flex-col gap-6">
        <div className="rounded-xl border border-outline bg-surface p-6 shadow-xs">
          <h2 className="text-base font-semibold text-ink">
            Periode Dialog Kinerja
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Sesuaikan tahun dan triwulan dialog kinerja ini jika diperlukan.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="periode_tahun"
                className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
              >
                Tahun Periode
              </label>
              <select
                id="periode_tahun"
                value={tahun}
                onChange={(e) => handleTahunChange(Number(e.target.value))}
                className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="triwulan"
                className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
              >
                Triwulan
              </label>
              <select
                id="triwulan"
                value={triwulan}
                onChange={(e) => handleTriwulanChange(e.target.value as Triwulan)}
                className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
              >
                <option value="TW1">Triwulan I</option>
                <option value="TW2">Triwulan II</option>
                <option value="TW3">Triwulan III</option>
                <option value="TW4">Triwulan IV</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-outline bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-0.5 border-b border-outline pb-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink">
                {liveDeskripsiPegawai?.trim()
                  ? "Deskripsi Kinerja (versi Atasan)"
                  : "Deskripsi Kinerja (Atasan)"}
              </h2>
              {isFieldLocked("deskripsi_atasan") ? (
                <span className="text-xs font-medium text-primary animate-pulse">
                  Sedang diedit oleh Pegawai...
                </span>
              ) : partnerTyping?.isTyping && !partnerTyping.fieldId ? (
                <span className="text-xs font-medium text-primary animate-pulse">
                  Pegawai sedang mengetik...
                </span>
              ) : null}
            </div>
            <p className="text-xs leading-4 text-ink-muted">
              Tuliskan arahan, situasi, atau deskripsi kinerja dari Atasan.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <AutoResizeTextarea
              id="deskripsi_kinerja"
              name="deskripsi_kinerja"
              value={deskripsi}
              disabled={isFieldLocked("deskripsi_atasan")}
              onChange={(e) => handleDeskripsiChange(e.target.value)}
              onFocus={() => notifyTyping("deskripsi_atasan")}
              rows={4}
              placeholder="Contoh: Target capaian kinerja triwulan ini memerlukan perhatian pada kualitas dokumen teknis…"
              className={`w-full rounded-lg border border-outline bg-surface p-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus ${
                isFieldLocked("deskripsi_atasan")
                  ? "bg-surface-muted/60 cursor-not-allowed opacity-80"
                  : ""
              }`}
            />
          </div>

          {liveDeskripsiPegawai?.trim() ? (
            <div className="mt-4 rounded-md border border-outline bg-surface-muted/40 px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  {deskripsi.trim()
                    ? "Deskripsi Kinerja (versi Pegawai) — Baca Saja"
                    : "Deskripsi Kinerja (Pegawai) — Baca Saja"}
                </span>
                {isFieldLocked("deskripsi_pegawai") ? (
                  <span className="text-xs font-medium text-primary animate-pulse">
                    Sedang diedit oleh Pegawai...
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-ink">
                {liveDeskripsiPegawai}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Form Tanggung Jawab Atasan */}
      <section aria-label="Form tanggung jawab atasan" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-ink">
            Tanggung Jawab Atasan
          </h2>
          <p className="text-xs text-ink-muted">
            Isikan komitmen atau tanggung jawab Anda sebagai atasan untuk mendukung pengembangan pegawai pada tiap aspek.
          </p>
        </div>

        {sections.map(({ no, title, desc, fields }, index) => {
          const Icon = SECTION_ICONS[index];
          return (
            <div key={no} className="rounded-lg border border-outline bg-surface">
              <div className="flex items-start gap-3 border-b border-outline px-6 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                  <Icon size={18} weight="bold" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-base font-semibold text-ink">
                    {no}. {title}
                  </h3>
                  <p className="text-xs leading-4 text-ink-muted">{desc}</p>
                </div>
              </div>
              <div className="flex flex-col gap-6 px-6 py-5">
                {fields.map(({ id, label }) => {
                  const aspekRow = aspekById.get(id);
                  const fieldKey = aspekRow
                    ? `tanggung_jawab_atasan_${aspekRow.jenis_aspek}`
                    : `aspek_${id}`;
                  const isLocked =
                    isFieldLocked(fieldKey) || isFieldLocked(`aspek_${id}`);

                  return (
                    <div key={id} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`aspek_${id}`}
                            className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
                          >
                            Tanggung Jawab Atasan — {label}
                          </label>
                          {isLocked ? (
                            <span className="text-xs font-medium text-primary animate-pulse">
                              Sedang diedit oleh Pegawai...
                            </span>
                          ) : null}
                        </div>
                        <AutoResizeTextarea
                          id={`aspek_${id}`}
                          name={`aspek_${id}`}
                          value={responses[id] ?? ""}
                          disabled={isLocked}
                          onChange={(e) =>
                            handleResponseChange(
                              String(id),
                              e.target.value,
                              fieldKey,
                            )
                          }
                          onFocus={() => notifyTyping(fieldKey)}
                          rows={3}
                          placeholder="Tulis tanggung jawab atasan untuk mendukung aspek ini…"
                          className={`w-full rounded-md border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus ${
                            isLocked
                              ? "bg-surface-muted/60 cursor-not-allowed opacity-80"
                              : ""
                          }`}
                        />
                      </div>
                      <div className="rounded-md border border-outline bg-surface-muted/40 px-4 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                            Isian Pegawai (Pratinjau Baca-Saja)
                          </span>
                          {aspekRow &&
                          isFieldLocked(
                            `tanggung_jawab_pegawai_${aspekRow.jenis_aspek}`,
                          ) ? (
                            <span className="text-xs font-medium text-primary animate-pulse">
                              Sedang diedit oleh Pegawai...
                            </span>
                          ) : null}
                        </div>
                        {aspekRow ? <AspekPegawaiInput aspek={aspekRow} /> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 z-10 mt-auto overflow-hidden rounded-xl border border-outline bg-surface/95 shadow-ambient backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="order-2 flex items-center gap-4 sm:order-1">
            {saveMeta}
            {partnerTyping?.isTyping && !partnerTyping.fieldId ? (
              <span className="text-xs font-medium text-primary animate-pulse">
                Pegawai sedang mengetik...
              </span>
            ) : null}
          </div>
          <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2">
            <button
              type="button"
              onClick={handleSaveNow}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-outline bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted cursor-pointer"
            >
              <FloppyDiskIcon size={16} weight="bold" />
              Simpan
            </button>
            {canSubmitEvaluasi ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenReject}
                  disabled={pending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-5 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 cursor-pointer disabled:opacity-60"
                >
                  <XIcon size={16} weight="bold" />
                  Tolak (Revisi)
                </button>
                <button
                  type="button"
                  onClick={handleOpenConfirm}
                  disabled={pending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong cursor-pointer disabled:opacity-60"
                >
                  <PaperPlaneTiltIcon size={16} weight="bold" />
                  Setujui
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-xl border border-outline bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">
              Konfirmasi &amp; Kirim Evaluasi
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">
              Pastikan Anda telah memeriksa seluruh rincian dialog kinerja dan mengisi pembagian tanggung jawab atasan.
            </p>

            <div className="mt-5 rounded-lg border border-outline bg-surface-muted/40 p-4">
              <label className="flex cursor-pointer items-start gap-3 text-xs font-medium leading-5 text-ink">
                <input
                  type="checkbox"
                  checked={setuju}
                  onChange={(e) => setSetuju(e.target.checked)}
                  disabled={pending}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-strong accent-primary"
                />
                <span>
                  Saya telah membaca dan menyetujui seluruh isi dialog kinerja ini.
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={pending}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={pending || !setuju}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {pending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                ) : null}
                {pending ? "Mengirim…" : "Ya, Setujui"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Reject Modal */}
      {showRejectModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-xl border border-outline bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">
              Kembalikan Dialog untuk Revisi
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-ink-muted">
              Berikan catatan revisi kepada pegawai. Dialog akan dikembalikan
              agar isian diperbaiki lalu dikirim ulang.
            </p>

            <div className="mt-5 flex flex-col gap-1.5">
              <label
                htmlFor="alasan-tolak-evaluasi"
                className="text-xs font-bold uppercase tracking-wider text-ink-muted"
              >
                Catatan Revisi *
              </label>
              <textarea
                id="alasan-tolak-evaluasi"
                rows={4}
                required
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
                placeholder="Contoh: Uraian kompetensi pada aspek SKP perlu ditambahkan rincian target…"
                className="w-full rounded-lg border border-outline bg-surface p-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={rejectPending}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectPending || !alasanTolak.trim()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {rejectPending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                ) : null}
                {rejectPending ? "Mengembalikan…" : "Kirim Catatan Revisi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
