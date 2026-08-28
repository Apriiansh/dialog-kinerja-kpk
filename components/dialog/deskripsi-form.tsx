"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloudArrowUpIcon,
  CloudCheckIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { saveDeskripsiKinerja, submitDialog } from "@/lib/actions/atasan";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

import type { Triwulan } from "@/generated/prisma/enums";

type SaveState = "idle" | "saving" | "saved";

export function DeskripsiKinerjaForm({
  dialogId,
  initialValue,
  initialTahun = 2026,
  initialTriwulan = "TW3",
}: {
  dialogId: number;
  initialValue: string;
  initialTahun?: number;
  initialTriwulan?: Triwulan;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [tahun, setTahun] = useState<number>(initialTahun);
  const [triwulan, setTriwulan] = useState<Triwulan>(initialTriwulan);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>("");
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (nextValue: string, nextTahun: number, nextTriwulan: Triwulan) => {
      setSaveState("saving");
      const result = await saveDeskripsiKinerja(dialogId, nextValue, nextTahun, nextTriwulan);
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
        void persist(value, tahun, triwulan);
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [persist, value, tahun, triwulan]);

  const handleChange = (next: string) => {
    setValue(next);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(next, tahun, triwulan), 800);
  };

  const handleTahunChange = (nextTahun: number) => {
    setTahun(nextTahun);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(value, nextTahun, triwulan), 800);
  };

  const handleTriwulanChange = (nextTW: Triwulan) => {
    setTriwulan(nextTW);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(value, tahun, nextTW), 800);
  };

  const handleSaveNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    const error = await persist(value, tahun, triwulan);
    if (error) {
      showError(error);
      return;
    }
    showSuccess("Perubahan dialog kinerja berhasil disimpan");
    router.refresh();
  };

  const handleSubmit = async () => {
    if (pending) return;
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    await persist(value, tahun, triwulan);
    await submitDialog(dialogId);
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
      <span className="flex shrink-0 items-center text-xs font-medium text-ink-muted">
        <CloudArrowUpIcon size={14} weight="bold" />
      </span>
    );

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Pengaturan Periode Dialog */}
      <section aria-label="Periode dialog" className="flex flex-col gap-4">
        <div className="rounded-xl border border-outline bg-surface p-6 shadow-xs">
          <h2 className="text-base font-semibold text-ink">
            Periode Dialog Kinerja
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Sesuaikan tahun dan triwulan dialog kinerja ini jika diperlukan.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="periode_tahun" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
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
              <label htmlFor="triwulan" className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
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
      </section>

      {/* Deskripsi Kinerja */}
      <section aria-label="Deskripsi kinerja" className="flex flex-col gap-6">
        <div className="rounded-xl border border-outline bg-surface shadow-xs">
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
                className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
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
                className="resize-y rounded-lg border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-outline bg-surface/90 backdrop-blur lg:pl-60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
              {pending ? "Mengirim…" : "Simpan & Kirim ke Pegawai"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
