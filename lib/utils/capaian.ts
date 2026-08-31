import type { JenisAspek } from "@/generated/prisma/enums";

export function countCapaian(
  aspek: {item: { is_tercapai: boolean | null }[] } [],
): { tercapai: number; belum: number } {

  const items = aspek.flatMap((a) => a.item)
  return {
    tercapai: items.filter((i) => i.is_tercapai === true).length,
    belum: items.filter((i) => i.is_tercapai === false).length,
  };

}

const KARIR_GROUP: readonly JenisAspek[] = ["KARIR_PENDEK", "KARIR_MENENGAH"];

function isAspekTerisi(a: {
  tanggung_jawab_pegawai: string | null;
  item: unknown[];
}): boolean {
  return (a.tanggung_jawab_pegawai?.trim() ?? "") !== "" || a.item.length > 0;
}

export function countFilledAspek(aspek: {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string | null;
  item: unknown[];
}[]): number {
  let count = 0;
  let karirTerisi = false;
  for (const a of aspek) {
    if (KARIR_GROUP.includes(a.jenis_aspek)) {
      if (isAspekTerisi(a)) karirTerisi = true;
      continue;
    }
    if (isAspekTerisi(a)) count += 1;
  }
  if (karirTerisi) count += 1;
  return count;
}
