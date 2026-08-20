import type { Triwulan } from "@/generated/prisma/enums";

export const TRIWULAN_LABEL: Record<Triwulan, string> = {
  TW1: "Triwulan I",
  TW2: "Triwulan II",
  TW3: "Triwulan III",
  TW4: "Triwulan IV",
};

export const TRIWULAN_BULAN: Record<Triwulan, number[]> = {
  TW1: [0, 1, 2],
  TW2: [3, 4, 5],
  TW3: [6, 7, 8],
  TW4: [9, 10, 11],
};

export function getTriwulanFromDate(date: Date): Triwulan {
  const month = date.getMonth();
  if (month <= 2) return "TW1";
  if (month <= 5) return "TW2";
  if (month <= 8) return "TW3";
  return "TW4";
}

export function triwulanLabel(tw: Triwulan): string {
  return TRIWULAN_LABEL[tw];
}

export function formatPeriode(triwulan: Triwulan, tahun: number): string {
  return `${TRIWULAN_LABEL[triwulan]} ${tahun}`;
}
