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
      <p className="text-center">Jakarta, {formatWaktuPelaksanaan(tanggal)}</p>
      <div className="mt-8 flex justify-between text-center">
        <div className="w-1/2">
          <p className="font-semibold">Atasan Pegawai,</p>
          {atasanPath ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={atasanPath}
              alt="Tanda tangan atasan"
              className="mx-auto mt-3 h-16 object-contain"
            />
          ) : (
            <div className="h-16" />
          )}
          <div className="mx-auto mt-2 w-48 border-b-2 border-black" />
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
              className="mx-auto mt-3 h-16 object-contain"
            />
          ) : (
            <div className="h-16" />
          )}
          <div className="mx-auto mt-2 w-48 border-b-2 border-black" />
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
        </tbody>
      </table>

      <div className="mt-3">
        <p className="font-bold">A. Hasil Reviu Dialog Kinerja</p>
        <table className="mt-1 w-full border-collapse">
          <tbody>
            <tr>
              <td className="w-64 px-2 py-1 font-semibold">Status Tindak Lanjut</td>
              <td className="px-2 py-1">
                {tindakLanjutLabel(reviu.is_tercapai, reviu.is_tidak_tercapai)}
              </td>
            </tr>
            {reviu.is_tercapai ? (
              <tr>
                <td className="w-64 px-2 py-1 font-semibold align-top">
                  Penjelasan Tercapai
                </td>
                <td className="px-2 py-1 whitespace-pre-wrap">
                  {reviu.penjelasan_tercapai?.trim() || " "}
                </td>
              </tr>
            ) : null}
            {reviu.is_tidak_tercapai ? (
              <tr>
                <td className="w-64 px-2 py-1 font-semibold align-top">
                  Penjelasan Tidak Tercapai
                </td>
                <td className="px-2 py-1 whitespace-pre-wrap">
                  {reviu.penjelasan_tidak_tercapai?.trim() || " "}
                </td>
              </tr>
            ) : null}
            {reviu.is_tidak_tercapai ? (
              <tr>
                <td className="w-64 px-2 py-1 font-semibold align-top">
                  Rencana dan Tindak Lanjut ke Depan
                </td>
                <td className="px-2 py-1 whitespace-pre-wrap">
                  {reviu.rencana_tindak_lanjut?.trim() || " "}
                </td>
              </tr>
            ) : null}
            <tr>
              <td className="w-64 px-2 py-1 font-semibold">
                Tanggal Reviu Berikutnya
              </td>
              <td className="px-2 py-1">
                {reviu.tanggal_next_reviu
                  ? formatTanggal(reviu.tanggal_next_reviu)
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <p className="text-center font-bold uppercase tracking-wide">
          Tanda Tangan Reviu Hasil Dialog Kinerja
        </p>
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
