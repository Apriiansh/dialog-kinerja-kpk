import { createEvent } from "ics";

export function generateIcsContent({
  title,
  description,
  start,
  end,
  location,
}: {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
}): string {
  const toIcsDate = (d: Date): [number, number, number, number, number] => [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
  ];

  const { error, value } = createEvent({
    title,
    description,
    start: toIcsDate(start),
    end: toIcsDate(end),
    location: location ?? "KPK",
  });

  if (error || !value) throw error ?? new Error("Gagal generate .ics");
  return value;
}

export function downloadIcsFile(content: string, filename: string = "dialog-kinerja.ics") {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}