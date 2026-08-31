import type { JenisAspek } from "@/generated/prisma/enums";
import {
  dialogEvaluasiLabel,
  formatWaktuPelaksanaan,
  isEmptyItem,
  metodeLabel,
  type AspekPegawaiRow,
} from "@/lib/utils/dialog-display";
interface ActorProfile {
  nama_pegawai?: string | null;
  nip?: string | null;
  tanggal_bergabung?: Date | null;
  nama_jabatan?: string | null;
  unit_kerja?: string | null;
  masa_kerja_unit_terakhir?: string | null;
}

interface FormulirDialog {
  status: string;
  deskripsi_kinerja: string | null;
  waktu_validasi_pegawai: Date | null;
  waktu_validasi_atasan: Date | null;
  aspek: AspekPegawaiRow[];
}

const SECTIONS: {
  letter: string;
  title: string;
  jenis: JenisAspek[];
}[] = [
  { letter: "A", title: "Evaluasi Kinerja (SKP)", jenis: ["SKP"] },
  { letter: "B", title: "Evaluasi Gap Asesmen Pegawai", jenis: ["GAP_ASESMEN"] },
  { letter: "C", title: "Evaluasi Perilaku Pegawai", jenis: ["PERILAKU"] },
  {
    letter: "D",
    title: "Aspirasi Karir Pegawai",
    jenis: ["KARIR_PENDEK", "KARIR_MENENGAH"],
  },
];

const KARIR_TITLE: Record<"KARIR_PENDEK" | "KARIR_MENENGAH", string> = {
  KARIR_PENDEK: "1. Jangka Pendek (1-2 Tahun ke depan)",
  KARIR_MENENGAH: "2. Jangka Menengah (3-5 Tahun ke depan)",
};

function ItemTable({
  jenis,
  aspek,
}: {
  jenis: JenisAspek;
  aspek: AspekPegawaiRow | undefined;
}) {
  const items = (aspek?.item ?? []).filter((i) => !isEmptyItem(i));
  const rows =
    items.length > 0
      ? items.map((item, index) => (
          <tr key={index}>
            <td className="border border-black px-1.5 py-1 text-center align-top">
              {index + 1}
            </td>
            <td className="border border-black px-1.5 py-1 align-top whitespace-pre-wrap">
              {item.dialog_evaluasi?.trim() || " "}
            </td>
            <td className="border border-black px-1.5 py-1 align-top whitespace-pre-wrap">
              {item.kompetensi_dikembangkan?.trim() || " "}
            </td>
            <td className="border border-black px-1.5 py-1 align-top">
              {metodeLabel(item) || " "}
            </td>
            <td className="border border-black px-1.5 py-1 align-top">
              {formatWaktuPelaksanaan(item.waktu_pelaksanaan)}
            </td>
          </tr>
        ))
      : [
          <tr key="empty">
            <td className="border border-black px-1.5 py-1 text-center">1</td>
            <td className="border border-black px-1.5 py-1">&nbsp;</td>
            <td className="border border-black px-1.5 py-1">&nbsp;</td>
            <td className="border border-black px-1.5 py-1">&nbsp;</td>
            <td className="border border-black px-1.5 py-1">&nbsp;</td>
          </tr>,
        ];

  return (
    <table className="w-full border-collapse leading-snug">
      <thead>
        <tr>
          <th className="w-7 border border-black px-1.5 py-1 text-center font-semibold">
            No
          </th>
          <th className="border border-black px-1.5 py-1 text-center font-semibold">
            {dialogEvaluasiLabel(jenis)}
          </th>
          <th className="border border-black px-1.5 py-1 text-center font-semibold">
            Kompetensi dikembangkan
          </th>
          <th className="border border-black px-1.5 py-1 text-center font-semibold">
            Metode Pengembangan
          </th>
          <th className="border border-black px-1.5 py-1 text-center font-semibold">
            Waktu Pelaksanaan
          </th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function TanggungJawabBlock({
  label,
  content,
}: {
  label: string;
  content: string | null | undefined;
}) {
  const text = content?.trim();
  return (
    <div className="mt-2">
      <p className="font-bold">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{text ? text : "-"}</p>
    </div>
  );
}

export function FormulirDialogKinerja({
  dialog,
  pegawai,
}: {
  dialog: FormulirDialog;
  pegawai?: ActorProfile;
}) {
  if (dialog.status !== "selesai") return null;

  const dataRows = [
    { label: "Nama Pegawai", value: pegawai?.nama_pegawai ?? null },
    { label: "NIP", value: pegawai?.nip ?? null },
    {
      label: "Tanggal Bergabung",
      value: formatWaktuPelaksanaan(pegawai?.tanggal_bergabung ?? null),
    },
    { label: "Nama Jabatan", value: pegawai?.nama_jabatan ?? null },
    { label: "Unit Kerja", value: pegawai?.unit_kerja ?? null },
    {
      label: "Masa Kerja Unit Terakhir",
      value: pegawai?.masa_kerja_unit_terakhir ?? null,
    },
  ];

  return (
    <div className="hidden font-[Arial,Helvetica,sans-serif] text-[10.5pt] text-black print:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-kpk.png"
        alt="Logo KPK"
        className="mb-2 ml-auto block h-[1.19cm] w-[3.2cm] object-contain"
      />
      <div className="text-center">
        <h1 className="text-[12pt] font-bold uppercase tracking-wide">
          Formulir Dialog Kinerja
        </h1>
        <p className="text-[12pt] font-bold uppercase tracking-wide">
          Pegawai Komisi Pemberantasan Korupsi
        </p>
      </div>

      <table
        className="mt-3 w-full border-collapse"
        style={{ border: "1px solid black" }}
      >
        <tbody>
          {dataRows.map((row) => (
            <tr key={row.label}>
              <td className="px-2 py-1">
                {row.label} : {row.value ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3">
        <p className="text-justify">
          Deskripsi kinerja/situasi/permasalahan yang dihadapi, sebagai bahan
          proses coaching, mentoring dan counseling.
        </p>
        <p className="mt-0.5 text-justify">
          (Informasi dan data dapat dilampirkan sebagai bukti pendukung jika
          dibutuhkan)
        </p>
        <p className="mt-1 text-justify">
          {dialog.deskripsi_kinerja?.trim() ? dialog.deskripsi_kinerja : "-"}
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section
          key={section.letter}
          className="mt-4"
          aria-label={section.title}
        >
          <h2 className="font-bold">
            {section.letter}. {section.title}
          </h2>
          {section.jenis.map((jenis) => {
            const aspek = dialog.aspek.find((a) => a.jenis_aspek === jenis);
            return (
              <div key={jenis} className="mt-1.5 break-inside-avoid">
                {section.jenis.length > 1 ? (
                  <p className="font-semibold">
                    {KARIR_TITLE[jenis as "KARIR_PENDEK" | "KARIR_MENENGAH"]}
                  </p>
                ) : null}
                <ItemTable jenis={jenis} aspek={aspek} />
                <TanggungJawabBlock
                  label="• Tanggung Jawab Pegawai"
                  content={aspek?.tanggung_jawab_pegawai}
                />
                <TanggungJawabBlock
                  label="• Tanggung Jawab Atasan"
                  content={aspek?.tanggung_jawab_atasan}
                />
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
