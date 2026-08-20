import { formatTanggal } from "@/lib/utils/format";
import { formatWaktuPelaksanaan } from "@/lib/utils/dialog-display";
import { tindakLanjutLabel } from "@/lib/constants/reviu-status";
import type { Triwulan } from "@/generated/prisma/enums";

interface ActorProfile {
  nama_pegawai?: string | null;
  nip?: string | null;
  tanggal_bergabung?: Date | null;
  nama_jabatan?: string | null;
  unit_kerja?: string | null;
  masa_kerja_unit_terakhir?: string | null;
}

interface ReviuAspekItem {
  id: number;
  dialog_evaluasi: string | null;
  kompetensi_dikembangkan: string | null;
  is_tercapai: boolean | null;
  capaian_keterangan: string | null;
}

interface ReviuAspekRow {
  id: number;
  jenis_aspek: string;
  item: ReviuAspekItem[];
}

interface FormulirReviuData {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
  rencana_tindak_lanjut: string | null;
  tanggal_next_evaluasi: Date | null;
  ttd_pegawai_path: string | null;
  ttd_atasan_path: string | null;
  waktu_validasi_pegawai: Date | null;
  waktu_validasi_atasan: Date | null;
  status: string;
  dialog: {
    periode_tahun: number;
    triwulan: Triwulan;
    waktu_validasi_atasan: Date | null;
    pegawai: ActorProfile;
    atasan: ActorProfile;
    aspek?: ReviuAspekRow[];
  };
}

export function FormulirReviu({ reviu }: { reviu: FormulirReviuData }) {
  if (reviu.status !== "selesai") return null;

  const tanggalDialog =
    reviu.dialog.waktu_validasi_atasan ??
    reviu.waktu_validasi_atasan ??
    reviu.waktu_validasi_pegawai ??
    new Date();
  const { dialog } = reviu;
  const tercapai = reviu.is_tercapai;
  const tidakTercapai = reviu.is_tidak_tercapai;

  const dataRows = [
    { label: "Nama Pegawai", value: dialog.pegawai.nama_pegawai ?? null },
    { label: "NIP", value: dialog.pegawai.nip ?? null },
    {
      label: "Tanggal Bergabung",
      value: formatWaktuPelaksanaan(dialog.pegawai.tanggal_bergabung ?? null),
    },
    { label: "Nama Jabatan", value: dialog.pegawai.nama_jabatan ?? null },
    { label: "Unit Kerja", value: dialog.pegawai.unit_kerja ?? null },
    {
      label: "Masa Kerja Unit Terakhir",
      value: dialog.pegawai.masa_kerja_unit_terakhir ?? null,
    },
  ];

  const BLANK = "..............................................................";

  return (
    <div className="hidden font-[Arial,_Helvetica,_sans-serif] text-[10.5pt] text-black print:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-kpk.png"
        alt="Logo KPK"
        className="mb-2 ml-auto block h-[1.19cm] w-[3.2cm] object-contain"
      />
      <div className="text-center">
        <h1 className="text-[12pt] font-bold uppercase tracking-wide">
          Formulir Reviu Hasil Dialog Kinerja
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
          <tr>
            <td className="px-2 py-1">
              Status Tindak Lanjut :{" "}
              {tindakLanjutLabel(reviu.is_tercapai, reviu.is_tidak_tercapai)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-3">
        <p className="text-justify">
          Telah dilaksanakan Dialog Kinerja pada tanggal{" "}
          <span className="font-semibold">
            {formatWaktuPelaksanaan(tanggalDialog)}
          </span>
          .
        </p>
        <p className="mt-3 text-justify">
          Hasil tindak lanjut perbaikan atau penyelesaian untuk permasalahan/
          kinerja/situasi yang dihadapi pegawai pada saat Dialog Kinerja adalah:
        </p>

        <table
          className="mt-2 w-full border-collapse"
          style={{ border: "1px solid black" }}
        >
          <thead>
            <tr>
              <th
                className="px-2 py-1 text-left font-bold"
                style={{ border: "1px solid black" }}
              >
                No
              </th>
              <th
                className="px-2 py-1 text-left font-bold"
                style={{ border: "1px solid black" }}
              >
                Item Evaluasi
              </th>
              <th
                className="px-2 py-1 text-left font-bold"
                style={{ border: "1px solid black" }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {dialog.aspek?.length
              ? dialog.aspek
                  .flatMap((a) => a.item)
                  .map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-2 py-1" style={{ border: "1px solid black" }}>
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1" style={{ border: "1px solid black" }}>
                        <p className="text-justify">
                          {item.dialog_evaluasi?.trim()
                            ? item.dialog_evaluasi
                            : `Item evaluasi #${item.id}`}
                        </p>
                        {item.capaian_keterangan?.trim() ? (
                          <p className="mt-0.5 text-justify">
                            <span className="font-semibold">Catatan: </span>
                            {item.capaian_keterangan}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-1" style={{ border: "1px solid black" }}>
                        {item.is_tercapai === null
                          ? "Belum dinilai"
                          : item.is_tercapai
                            ? "Tercapai"
                            : "Tidak tercapai"}
                      </td>
                    </tr>
                  ))
              : (
                  <tr>
                    <td className="px-2 py-1" style={{ border: "1px solid black" }} colSpan={3}>
                      —
                    </td>
                  </tr>
                )}
          </tbody>
        </table>

        <div className="mt-2 leading-snug">
          <div className="py-1.5">
            <p className="font-semibold">
              {tercapai ? "[✓]" : "[  ]"} Tercapai
            </p>

            <p className="mt-1 text-justify whitespace-pre-wrap">
              <span className="font-semibold">
                Penjelasan singkat hasilnya:
              </span>{" "}
              {tercapai && reviu.penjelasan_tercapai?.trim()
                ? reviu.penjelasan_tercapai
                : BLANK}
            </p>
          </div>

          <div className="py-1.5">
            <p className="font-semibold">
              {tidakTercapai ? "[✓]" : "[  ]"} Tidak Tercapai
            </p>

            <p className="mt-1 text-justify whitespace-pre-wrap">
              <span className="font-semibold">
                Deskripsi penyebab tidak tercapai:
              </span>{" "}
              {tidakTercapai && reviu.penjelasan_tidak_tercapai?.trim()
                ? reviu.penjelasan_tidak_tercapai
                : BLANK}
            </p>

            <p className="mt-1 text-justify whitespace-pre-wrap">
              <span className="font-semibold">
                Rencana dan tindak lanjut ke depan yang akan dilakukan:
              </span>{" "}
              {tidakTercapai && reviu.rencana_tindak_lanjut?.trim()
                ? reviu.rencana_tindak_lanjut
                : BLANK}
            </p>

            <p className="mt-1">
              <span className="font-semibold">
                Tanggal evaluasi berikutnya:
              </span>{" "}
              {tidakTercapai && reviu.tanggal_next_evaluasi
                ? formatTanggal(reviu.tanggal_next_evaluasi)
                : BLANK}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
