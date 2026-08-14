import { formatTanggal } from "@/lib/format";
import { formatWaktuPelaksanaan } from "@/lib/dialog-display";
import { tindakLanjutLabel } from "@/lib/status-reviu";

interface ActorProfile {
  nama_pegawai?: string | null;
  nip?: string | null;
  tanggal_bergabung?: Date | null;
  nama_jabatan?: string | null;
  unit_kerja?: string | null;
  masa_kerja_unit_terakhir?: string | null;
}

interface FormulirReviuData {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
  rencana_tindak_lanjut: string | null;
  tanggal_next_reviu: Date | null;
  ttd_pegawai_path: string | null;
  ttd_atasan_path: string | null;
  waktu_validasi_pegawai: Date | null;
  waktu_validasi_atasan: Date | null;
  status: string;
  dialog: {
    periode_tahun: number;
    waktu_validasi_atasan: Date | null;
    pegawai: ActorProfile;
    atasan: ActorProfile;
  };
}

function TtdBlock({
  tanggal,
  atasanPath,
  atasanNama,
  atasanJabatan,
  pegawaiPath,
  pegawaiNama,
  pegawaiJabatan,
}: {
  tanggal: Date;
  atasanPath: string | null;
  atasanNama?: string | null;
  atasanJabatan?: string | null;
  pegawaiPath: string | null;
  pegawaiNama?: string | null;
  pegawaiJabatan?: string | null;
}) {
  return (
    <div className="mt-10 break-inside-avoid">
      <p>Jakarta, {formatWaktuPelaksanaan(tanggal)}</p>
      <div className="mt-8 flex justify-between">
        <div className="w-1/2">
          <p className="font-semibold">Atasan Pegawai,</p>
          {atasanPath ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={atasanPath}
              alt="Tanda tangan atasan"
              className="mt-3 h-16 object-contain"
            />
          ) : (
            <div className="h-16" />
          )}
          <div className="mt-2 w-48 border-b-2 border-black" />
          <p className="mt-1 font-semibold">{atasanNama ?? "—"}</p>
          <p>{atasanJabatan ?? "Jabatan"}</p>
        </div>
        <div className="w-1/2">
          <p className="font-semibold">Pegawai,</p>
          {pegawaiPath ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pegawaiPath}
              alt="Tanda tangan pegawai"
              className="mt-3 h-16 object-contain"
            />
          ) : (
            <div className="h-16" />
          )}
          <div className="mt-2 w-48 border-b-2 border-black" />
          <p className="mt-1 font-semibold">{pegawaiNama ?? "—"}</p>
          <p>{pegawaiJabatan ?? "Jabatan"}</p>
        </div>
      </div>
    </div>
  );
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
                Tanggal reviu berikutnya:
              </span>{" "}
              {tidakTercapai && reviu.tanggal_next_reviu
                ? formatTanggal(reviu.tanggal_next_reviu)
                : BLANK}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">

        <TtdBlock
          tanggal={tanggalDialog}
          atasanPath={reviu.ttd_atasan_path}
          atasanNama={dialog.atasan.nama_pegawai}
          atasanJabatan={dialog.atasan.nama_jabatan}
          pegawaiPath={reviu.ttd_pegawai_path}
          pegawaiNama={dialog.pegawai.nama_pegawai}
          pegawaiJabatan={dialog.pegawai.nama_jabatan}
        />
      </div>
    </div>
  );
}
