"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { AlarmIcon, XIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { formatTanggal, toDateInput } from "@/lib/utils/format";
import { formatPeriode } from "@/lib/constants/triwulan";
import type { EvaluasiReminderItem } from "@/lib/queries/reviu";

interface EvaluasiReminderBannerProps {
  reminders: EvaluasiReminderItem[];
  role: "PEGAWAI" | "ATASAN" | "ADMIN";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("evaluasi_banner_dismissed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("evaluasi_banner_dismissed", callback);
  };
}

function getSnapshot(): string {
  try {
    return sessionStorage.getItem("dismissed_evaluasi_reminders") ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

export function EvaluasiReminderBanner({
  reminders,
  role,
}: EvaluasiReminderBannerProps) {
  const dismissedJson = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const dismissed: string[] = (() => {
    try {
      return JSON.parse(dismissedJson);
    } catch {
      return [];
    }
  })();

  const activeReminders = reminders.filter((r) => !dismissed.includes(r.id));

  if (activeReminders.length === 0) {
    return null;
  }

  function handleDismiss(id: string) {
    try {
      const current: string[] = JSON.parse(
        sessionStorage.getItem("dismissed_evaluasi_reminders") ?? "[]",
      );
      const updated = [...current, id];
      sessionStorage.setItem(
        "dismissed_evaluasi_reminders",
        JSON.stringify(updated),
      );
      window.dispatchEvent(new Event("evaluasi_banner_dismissed"));
    } catch {}
  }

  return (
    <div className="mb-6 flex flex-col gap-2.5 print:hidden">
      {activeReminders.map((r) => {
        const todayStr = toDateInput(new Date());
        const targetStr = toDateInput(new Date(r.tanggalEvaluasi));
        const isPast = targetStr <= todayStr;
        const dateStr = formatTanggal(r.tanggalEvaluasi);
        const periodeStr = `Dialog Kinerja ${formatPeriode(r.triwulan, r.periodeTahun)}`;

        return (
          <div
            key={r.id}
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-status-amber/40 bg-status-amber-soft px-4 py-3 text-ink shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-status-amber/15 text-status-amber">
                <AlarmIcon size={18} weight="bold" />
              </span>
              <div className="min-w-0 flex-1 text-sm leading-5">
                {role === "ATASAN" ? (
                  <span>
                    <strong className="font-semibold text-ink">
                      {isPast ? "Jadwal Evaluasi Tiba: " : "Evaluasi Mendekat: "}
                    </strong>
                    Evaluasi untuk <strong className="font-semibold">{r.namaPegawai}</strong> ({periodeStr}) {isPast ? "jatuh pada" : "dijadwalkan"} <span className="font-semibold text-status-amber">{dateStr}</span>. Segera buat dialog kinerja lanjutan.
                  </span>
                ) : (
                  <span>
                    <strong className="font-semibold text-ink">
                      {isPast ? "Waktunya Evaluasi: " : "Evaluasi Mendekat: "}
                    </strong>
                    {periodeStr} {isPast ? "jatuh pada" : "dijadwalkan"} <span className="font-semibold text-status-amber">{dateStr}</span>. Cek apakah atasan sudah membuat dialog baru.
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={r.href}
                className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink border border-outline/50 shadow-2xs hover:bg-white hover:border-outline transition-colors"
              >
                <span>{role === "ATASAN" ? "Buka Dialog" : "Cek Dialog"}</span>
                <ArrowRightIcon size={12} weight="bold" />
              </Link>
              <button
                type="button"
                onClick={() => handleDismiss(r.id)}
                aria-label="Tutup pemberitahuan"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-status-amber/20 hover:text-ink cursor-pointer"
              >
                <XIcon size={14} weight="bold" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
