"use client";

import {
  ChartBar,
  Check,
  CheckCircle,
  CloudArrowUp,
  CloudCheck,
  Gauge,
  PaperPlaneTilt,
  SpinnerGap,
  TrendUp,
  UserFocus,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { autosaveResponses, submitDialog } from "@/app/(app)/actions";
import type { DialogSection } from "@/lib/dialog-sections";

const SECTION_ICONS = [ChartBar, Gauge, UserFocus, TrendUp] as const;

type SaveState = "idle" | "saving" | "saved";

export function DialogResponsesForm({
  dialogId,
  canEdit,
  sections,
  initialValues,
  detailHref,
}: {
  dialogId: number;
  canEdit: boolean;
  sections: DialogSection[];
  initialValues: Record<string, string>;
  detailHref: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const valuesRef = useRef(values);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSaveNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist(valuesRef.current);
    notify("Data dialog berhasil disimpan");
    setTimeout(() => router.push(detailHref), 1200);
  };

  const handleSubmit = async () => {
    if (timer.current) clearTimeout(timer.current);
    await persist(valuesRef.current);
    await submitDialog(dialogId);
  };

  const saveMeta =
    saveState === "saving" ? (
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <SpinnerGap size={14} weight="bold" className="animate-spin" />
        Menyimpan…
      </span>
    ) : saveState === "saved" ? (
      <span className="flex items-center gap-1.5 text-xs font-medium text-secondary">
        <CloudCheck size={14} weight="fill" />
        Tersimpan otomatis · {savedAt}
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <CloudArrowUp size={14} weight="bold" />
        Perubahan tersimpan otomatis
      </span>
    );

  return (
    <div className="flex flex-col gap-10 pb-24">
      {toast ? (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-50 animate-toast-in"
        >
          <div className="flex items-center gap-2.5 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary shadow-ambient">
            <CheckCircle size={18} weight="fill" />
            {toast}
          </div>
        </div>
      ) : null}

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
              <div className="flex flex-col gap-5 px-6 py-5">
                {fields.map(({ id, label }) => (
                  <div key={id} className="flex flex-col gap-1.5">
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
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-outline bg-surface/90 px-4 py-3 backdrop-blur lg:pl-60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          {saveMeta}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveNow}
              disabled={!canEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-outline-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={16} weight="bold" />
              Simpan
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperPlaneTilt size={16} weight="bold" />
              Simpan & Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
