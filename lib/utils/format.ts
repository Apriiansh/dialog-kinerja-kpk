const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatTanggal(date: Date | string): string {
  return tanggalFormatter.format(new Date(date));
}

export function toDateInput(value: Date | null): string {
  if (!value) return "";
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  const daysInMonth = new Date(
    result.getFullYear(),
    targetMonth + 1,
    0,
  ).getDate();
  result.setMonth(targetMonth, Math.min(result.getDate(), daysInMonth));
  return result;
}

export function formatDurasiKeHariIni(from: Date | string): string {
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return "";
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (startDay >= todayDay) return "0 Tahun 0 Bulan 0 Hari";

  let base = startDay;
  let tahun = 0;
  while (addMonthsClamped(base, 12) <= todayDay) {
    base = addMonthsClamped(base, 12);
    tahun += 1;
  }
  let bulan = 0;
  while (addMonthsClamped(base, 1) <= todayDay) {
    base = addMonthsClamped(base, 1);
    bulan += 1;
  }
  const hari = Math.floor((todayDay.getTime() - base.getTime()) / 86400000);
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

export function parseDurasi(text: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const tahunMatch = /(\d+)\s*[Tt]ahun/.exec(trimmed);
  const bulanMatch = /(\d+)\s*[Bb]ulan/.exec(trimmed);
  const hariMatch = /(\d+)\s*[Hh]ari/.exec(trimmed);
  if (!tahunMatch && !bulanMatch && !hariMatch) return null;
  const tahun = Number(tahunMatch?.[1] ?? 0);
  const bulan = Number(bulanMatch?.[1] ?? 0);
  const hari = Number(hariMatch?.[1] ?? 0);
  if (tahun < 0 || bulan < 0 || hari < 0) return null;
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = addMonthsClamped(todayDay, -(tahun * 12 + bulan));
  target.setDate(target.getDate() - hari);
  return target;
}

export function isDurasiText(text: string): boolean {
  return parseDurasi(text) !== null;
}

export function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  return formatTanggal(date);
}