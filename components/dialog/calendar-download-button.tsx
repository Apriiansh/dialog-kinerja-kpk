"use client";

import { CalendarCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { generateIcsContent, downloadIcsFile } from "@/lib/utils/ics";

interface CalendarDownloadButtonProps {
  jadwalDialog: Date | null;
  title: string;
  description: string;
  label?: string;
  className?: string;
}

export function CalendarDownloadButton({
  jadwalDialog,
  title,
  description,
  label = "Kalender",
  className = "",
}: CalendarDownloadButtonProps) {
  function handleDownload() {
    if (!jadwalDialog) return;
    const icsContent = generateIcsContent({
      title,
      description,
      start: new Date(jadwalDialog),
      end: new Date(new Date(jadwalDialog).getTime() + 60 * 60 * 1000),
      location: "KPK",
    });
    downloadIcsFile(icsContent, "dialog-kinerja.ics");
  }

  if (!jadwalDialog) return null;

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-strong bg-surface px-3.5 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-surface-muted ${className}`}
    >
      <CalendarCheckIcon size={14} weight="bold" />
      {label}
    </button>
  );
}