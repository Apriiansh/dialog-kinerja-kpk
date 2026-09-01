"use client";

import { CalendarCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { generateIcsContent, downloadIcsFile } from "@/lib/utils/ics";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

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
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            onClick={handleDownload}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-strong bg-blue-500 px-3.5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-blue-700 ${className}`}
          >
            <CalendarCheckIcon size={14} weight="bold" />
            {label}
          </button>
        }
      ></HoverCardTrigger>
      <HoverCardContent side="bottom" align="center" className="w-72 rounded-md bg-sky-50 border border-sky-200 px-3 py-2 text-[11px] text-sky-800 leading-relaxed">
        <p className="font-semibold">Tambah ke Kalender</p>
        <p>
          File <strong>.ics</strong> akan otomatis terbuka di aplikasi kalender Outlook. Pastikan sudah login di aplikasi tersebut agar jadwal langsung tersimpan.
        </p>
      </HoverCardContent>
    </HoverCard>

  );
}
