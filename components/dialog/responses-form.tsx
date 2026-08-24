"use client";

import {
  ChartBarIcon,
  CheckIcon,
  CloudArrowUpIcon,
  CloudCheckIcon,
  GaugeIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
  TrendUpIcon,
  UserFocusIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { autosaveResponses, submitEvaluasi } from "@/lib/actions/atasan";
import { buildDialogSections } from "@/lib/constants/dialog-sections";
import type { AspekPegawaiRow } from "@/lib/utils/dialog-display";
import { error, success } from "@/components/ui/toast";
import { AspekPegawaiInput } from "@/components/pegawai/aspek-input";
import { useDialogLive } from "@/lib/hooks/use-dialog-live";

const SECTION_ICONS = [ChartBarIcon, GaugeIcon, UserFocusIcon, TrendUpIcon] as const;

type SaveState = "idle" | "saving" | "saved";

export function DialogResponsesForm({
  dialogId,
  canEdit,
  canSubmit = true,
  liveEnabled = false,
  aspek,
}: {
  dialogId: number;
  canEdit: boolean;
  canSubmit?: boolean;
  liveEnabled?: boolean;
  aspek: AspekPegawaiRow[];
}) {
  const router = useRouter();
  const { sections, initialValues } = buildDialogSections(aspek);
  const aspekById = new Map(aspek.map((a) => [a.id, a]));
  const [liveAspek, setLiveAspek] = useState(aspek);
  const { transport } = useDialogLive({
    dialogId,
    enabled: liveEnabled,
    onState: (state) => setLiveAspek(state.aspek),
  });
  const liveAspekById = new Map(liveAspek.map((a) => [a.id, a]));
  const [values, setValues] = useState(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [setuju, setSetuju] = useState(false);
  const [pending, setPending] = useState(false);
  const valuesRef = useRef(values);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const persist = useCallback(
    async (next: Record<string, string>) => {
      if (!canEdit) return;
      setSaveState("saving");
      await autosaveResponses(dialogId, next);
      setSaveState("saved");
      setSavedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    },
    [canEdit, dialogId],
  );

  useEffect(() => {
    const onBeforeUnload = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void persist(valuesRef.current);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persist]);

  const handleChange = (id: string, value: string) => {
    const next = { ...valuesRef.current, [id]: value };
    valuesRef.current = next;
    setValues(next);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(next), 800);
  };

  const handleSaveNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist(valuesRef.current);
    success("Tanggung jawab atasan berhasil disimpan");
    router.refresh();
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirm = async () => {
    if (!canEdit || !canSubmit || pending) return;
    if (timer.current) clearTimeout(timer.current);
    await persist(valuesRef.current);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (pending || !setuju) return;
    setPending(true);

    const result = await submitEvaluasi(dialogId, {
      setuju,
      ttdDataUrl: null,
    });

    if (result?.error) {
      error(result.error);
      setPending(false);
      return;
    }

    success("Evaluasi berhasil dikirim ke pegawai");
    setShowConfirmModal(false);
    router.refresh();
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
        Perubahan tersimpan otomatis
      </span>
    );

  return (
    <div className="flex flex-col gap-10 pb-24">
      <section aria-label="Form dialog kinerja" className="flex flex-col gap-6">
        {sections.map(({ no, title, desc, fields }, index) => {
          const Icon = SECTION_ICONS[index];
          return (
            <div key={no} className="rounded-lg border border-outline bg-surface">
              <div className="flex items-start gap-3 border-b border-outline px-6 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                  <Icon size={18} weight="bold" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-semibold text-ink">
                    {no}. {title}
                  </h2>
                  <p className="text-xs leading-4 text-ink-muted">{desc}</p>
                </div>
              </div>
              <div className="flex flex-col gap-6 px-6 py-5">
                {fields.map(({ id, label }) => {
                  const aspekRow = liveAspekById.get(id) ?? aspekById.get(id);
                  return (
                    <div key={id} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`aspek_${id}`}
                          className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
                        >
                          {label}
                        </label>
                        <textarea
                          id={`aspek_${id}`}
                          name={`aspek_${id}`}
                          value={values[id] ?? ""}
                          onChange={(e) => handleChange(String(id), e.target.value)}
                          readOnly={!canEdit}
                          rows={4}
                          placeholder="Tulis tanggung jawab atasan…"
                          className="resize-y rounded-md border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus read-only:bg-surface-muted/60 read-only:focus:border-outline read-only:focus:shadow-none"
                        />
                      </div>
                      <div className="rounded-md border border-outline bg-surface-muted/40 px-4 py-3.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                          Isian Pegawai
                        </span>
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

      {/* Bottom Sticky Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-outline bg-surface/90 backdrop-blur lg:pl-60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {liveEnabled ? (
              <span
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-medium ${
                  transport === "live" ? "text-emerald-600" : "text-ink-muted"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    transport === "live"
                      ? "bg-emerald-500"
                      : transport === "polling"
                        ? "bg-amber-500"
                        : "bg-outline-strong"
                  }`}
                />
                {transport === "live"
                  ? "Waktu nyata aktif"
                  : transport === "polling"
                    ? "Sinkron berkala"
                    : "Menyambungkan…"}
              </span>
            ) : null}
            {saveMeta}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveNow}
              disabled={!canEdit || pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-outline-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckIcon size={16} weight="bold" />
              Simpan
            </button>
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={!canEdit || !canSubmit || pending}
              title={
                !canSubmit && liveEnabled
                  ? "Bisa dikirim setelah pegawai menekan Kirim ke Atasan"
                  : undefined
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperPlaneTiltIcon size={16} weight="bold" />
              Simpan &amp; Kirim Evaluasi
            </button>
          </div>
        </div>
      </div>

      {/* Alert Modal Validasi / Konfirmasi */}
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
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-ink font-medium">
                <input
                  type="checkbox"
                  checked={setuju}
                  onChange={(e) => setSetuju(e.target.checked)}
                  disabled={pending}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-strong accent-[#0e7490]"
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
                className="inline-flex h-9 items-center justify-center rounded-lg border border-outline px-4 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={pending || !setuju}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                ) : null}
                {pending ? "Mengirim…" : "Kirim Evaluasi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
