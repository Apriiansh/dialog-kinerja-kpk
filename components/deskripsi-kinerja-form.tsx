"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  CloudCheckIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { saveDeskripsiKinerja, submitDialog } from "@/lib/actions/atasan";

type SaveState = "idle" | "saving" | "saved";

export function DeskripsiKinerjaForm({
  dialogId,
  initialValue,
}: {
  dialogId: number;
  initialValue: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (next: string) => {
      setSaveState("saving");
      const result = await saveDeskripsiKinerja(dialogId, next);
      if (result?.error) {
        setSaveState("idle");
        return result.error;
      }
      setSaveState("saved");
      setSavedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      return undefined;
    },
    [dialogId],
  );

  useEffect(() => {
    const onBeforeUnload = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void persist(value);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persist, value]);

  const handleChange = (next: string) => {
    setValue(next);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(next), 800);
  };

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleSaveNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    const error = await persist(value);
    if (error) {
      notify(error);
      return;
    }
    notify("Deskripsi kinerja berhasil disimpan");
    router.refresh();
  };

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    await persist(value);
    await submitDialog(dialogId);
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
      {toast ? (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-50 animate-toast-in"
        >
          <div className="flex items-center gap-2.5 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary shadow-ambient">
            <CheckCircleIcon size={18} weight="fill" />
            {toast}
          </div>
        </div>
      ) : null}

      <section aria-label="Deskripsi kinerja" className="flex flex-col gap-6">
        <div className="rounded-lg border border-outline bg-surface">
          <div className="flex flex-col gap-0.5 border-b border-outline px-6 py-4">
            <h2 className="text-base font-semibold text-ink">
              Deskripsi Kinerja / Situasi &amp; Permasalahan
            </h2>
            <p className="text-xs leading-4 text-ink-muted">
              Opsional, boleh diisi. Uraikan kondisi kinerja pegawai sebagai
              bahan dialog sebelum dikirim ke pegawai.
            </p>
          </div>
          <div className="flex flex-col gap-5 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="deskripsi_kinerja"
                className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
              >
                Deskripsi Kinerja
              </label>
              <textarea
                id="deskripsi_kinerja"
                name="deskripsi_kinerja"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                rows={6}
                placeholder="Contoh: Target capaian kinerja tahun ini belum optimal pada indikator kualitas layanan. Perlu pembahasan strategi peningkatan…"
                className="resize-y rounded-md border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-outline bg-surface/90 px-4 py-3 backdrop-blur lg:pl-60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          {saveMeta}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveNow}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-outline-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
            >
              <FloppyDiskIcon size={16} weight="bold" />
              Simpan
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperPlaneTiltIcon size={16} weight="bold" />
              {pending ? "Mengirim…" : "Simpan & Kicd m ke Pegawai"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
