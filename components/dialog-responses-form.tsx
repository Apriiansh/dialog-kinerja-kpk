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
import { buildDialogSections } from "@/lib/dialog-sections";
import type { AspekPegawaiRow } from "@/lib/dialog-display";
import { error, success } from "@/components/ui/toast";
import { SignaturePadField } from "@/components/signature-pad";
import { AspekPegawaiInput } from "@/components/aspek-pegawai-input";

const SECTION_ICONS = [ChartBarIcon, GaugeIcon, UserFocusIcon, TrendUpIcon] as const;

type SaveState = "idle" | "saving" | "saved";

export function DialogResponsesForm({
  dialogId,
  canEdit,
  aspek,
}: {
  dialogId: number;
  canEdit: boolean;
  aspek: AspekPegawaiRow[];
}) {
  const router = useRouter();
  const { sections, initialValues } = buildDialogSections(aspek);
  const aspekById = new Map(aspek.map((a) => [a.id, a]));
  const [values, setValues] = useState(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [setuju, setSetuju] = useState(false);
  const [ttdDataUrl, setTtdDataUrl] = useState<string | null>(null);
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

  const handleSubmit = async () => {
    if (pending) return;
    if (!setuju) {
      error("Centang persetujuan untuk melanjutkan.");
      return;
    }
    if (!ttdDataUrl) {
      error("Tanda tangan wajib diisi.");
      return;
    }

    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    await persist(valuesRef.current);

    const result = await submitEvaluasi(dialogId, {
      setuju,
      ttdDataUrl,
    });

    if (result?.error) {
      error(result.error);
      setPending(false);
      return;
    }

    success("Evaluasi berhasil dikirim ke pegawai");
    router.refresh();
  };

  const saveMeta =
    saveState === "saving" ? (
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <SpinnerGapIcon size={14} weight="bold" className="animate-spin" />
        Menyimpan…
      </span>
    ) : saveState === "saved" ? (
      <span className="flex items-center gap-1.5 text-xs font-medium text-secondary">
        <CloudCheckIcon size={14} weight="fill" />
        Tersimpan otomatis · {savedAt}
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
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
                  const aspekRow = aspekById.get(id);
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

      <section
        aria-labelledby="evaluasi-heading"
        className="rounded-lg border border-outline bg-surface"
      >
        <div className="border-b border-outline px-5 py-3.5">
          <h2
            id="evaluasi-heading"
            className="text-sm font-semibold text-ink"
          >
            Validasi &amp; Tanda Tangan (Atasan)
          </h2>
          <p className="mt-0.5 text-xs leading-4 text-ink-muted">
            Tinjau kembali isian pegawai di atas, lalu beri persetujuan dan
            tanda tangan Anda.
          </p>
        </div>

        <div className="flex flex-col gap-5 px-5 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-ink">
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => setSetuju(e.target.checked)}
              disabled={pending}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-strong accent-[#1e3a8a]"
            />
            <span>
              Saya telah membaca dan menyetujui seluruh isi dialog kinerja ini.
            </span>
          </label>

          <SignaturePadField
            onChange={setTtdDataUrl}
            disabled={pending}
            label="Tanda Tangan Atasan"
          />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-outline bg-surface/90 px-4 py-3 backdrop-blur lg:pl-60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          {saveMeta}
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
              onClick={handleSubmit}
              disabled={!canEdit || pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperPlaneTiltIcon size={16} weight="bold" />
              {pending ? "Mengirim…" : "Simpan & Kirim Evaluasi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
