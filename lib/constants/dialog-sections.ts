import type { JenisAspek } from "@/generated/prisma/client";

export interface DialogField {
  id: number;
  label: string;
}

export interface DialogSection {
  no: string;
  title: string;
  desc: string;
  fields: DialogField[];
}

export interface DialogAspekRow {
  id: number;
  jenis_aspek: JenisAspek;
  tanggung_jawab_atasan: string | null;
}

export const DIALOG_SECTIONS: Array<{
  no: string;
  title: string;
  desc: string;
  fields: Array<{ jenis: JenisAspek; label: string }>;
}> = [
  {
    no: "A",
    title: "Evaluasi Kinerja (SKP)",
    desc: "Uraikan penilaian atasan atas capaian kinerja dan sasaran kerja pegawai.",
    fields: [{ jenis: "SKP", label: "Tanggung Jawab Atasan" }],
  },
  {
    no: "B",
    title: "Evaluasi Gap Asesmen Pegawai",
    desc: "Uraikan hasil asesmen dan kesenjangan kompetensi yang perlu ditindaklanjuti.",
    fields: [{ jenis: "GAP_ASESMEN", label: "Tanggung Jawab Atasan" }],
  },
  {
    no: "C",
    title: "Evaluasi Perilaku Pegawai",
    desc: "Uraikan penilaian perilaku kerja pegawai dalam melaksanakan tugas.",
    fields: [{ jenis: "PERILAKU", label: "Tanggung Jawab Atasan" }],
  },
  {
    no: "D",
    title: "Aspirasi Karir Pegawai",
    desc: "Uraikan rencana pengembangan karir pegawai dari sisi atasan.",
    fields: [
      { jenis: "KARIR_PENDEK", label: "Jangka Pendek (1-2 Tahun Kedepan)" },
      { jenis: "KARIR_MENENGAH", label: "Jangka Menengah (3-5 Tahun Kedepan)" },
    ],
  },
];

export function buildDialogSections(aspek: DialogAspekRow[]) {
  const byType = new Map(aspek.map((a) => [a.jenis_aspek, a]));
  const sections: DialogSection[] = DIALOG_SECTIONS.map(
    ({ no, title, desc, fields }) => ({
      no,
      title,
      desc,
      fields: fields.map(({ jenis, label }) => ({
        id: byType.get(jenis)!.id,
        label,
      })),
    }),
  );
  const initialValues = Object.fromEntries(
    aspek.map((a) => [a.id, a.tanggung_jawab_atasan ?? ""]),
  );
  return { sections, initialValues };
}
