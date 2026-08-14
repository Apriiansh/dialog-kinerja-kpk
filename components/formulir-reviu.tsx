import { formatTanggal } from "@/lib/format";
import { formatWaktuPelaksanaan as printDate } from "@/lib/dialog-display";
import { STATUS_TINDAK_LANJUT_LABEL } from "@/lib/status-reviu";

interface ActorProfile {
  nama_pegawai?: string | null;
  nip?: string | null;
  nama_jabatan?: string | null;
  unit_kerja?: string | null;
}

interface FormulirReviuData {
  status_tindaklanjut: "TERCAPAI" | "TIDAK_TERCAPAI";
  penjelasan: string;
  rencana_tindak_lanjut: string | null;
  tanggal_next_reviu: Date | null;
  ttd_pegawai_path: string | null;
  ttd_atasan_path: string | null;
  waktu_validasi_pegawai: Date | null;
  waktu_validasi_atasan: Date | null;
  status: string;
  dialog: {
    periode_tahun: number;
    pegawai: ActorProfile;
    atasan: ActorProfile;
  };
}

export function FormulirReviu({ reviu }: { reviu: FormulirReviuData }) {
  if (reviu.status !== "selesai") return null;

  const tanggalValidasi =
    reviu.waktu_validasi_atasan ??
    reviu.waktu_validasi_pegawai ??
    new Date();
  const { dialog } = reviu;

  const dataRows = [
    { label: "Nama Pegawai", value: dialog.pegawai.nama_pegawai ?? "—" },
    { label: "NIP", value: dialog.pegawai.nip ?? "—" },
    { label: "Nama Jabatan", value: dialog.pegawai.nama_jabatan ?? "—" },
    { label: "Unit Kerja", value: dialog.pegawai.unit_kerja ?? "—" },
    { label: "Atasan Pegawai", value: dialog.atasan.nama_pegawai ?? "—" },
    { label: "Periode", value: `Tahun ${dialog.periode_tahun}` },
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
                {row.label} : {row.value}
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
                {STATUS_TINDAK_LANJUT_LABEL[reviu.status_tindaklanjut]}
              </td>
            </tr>
            <tr>
              <td className="w-64 px-2 py-1 font-semibold align-top">
                Penjelasan
              </td>
              <td className="px-2 py-1 whitespace-pre-wrap">
                {reviu.penjelasan?.trim() || " "}
              </td>
            </tr>
            {reviu.status_tindaklanjut === "TIDAK_TERCAPAI" ? (
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

      <div className="mt-10 break-inside-avoid">
        <p className="text-center">
          Jakarta, {printDate(tanggalValidasi)}
        </p>
        <div className="mt-8 flex justify-between text-center">
          <div className="w-1/2">
            <p className="font-semibold">Atasan Pegawai,</p>
            {reviu.ttd_atasan_path ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={reviu.ttd_atasan_path}
                alt="Tanda tangan atasan"
                className="mx-auto mt-3 h-16 object-contain"
              />
            ) : (
              <div className="h-16" />
            )}
            <div className="mx-auto mt-2 w-48 border-b-2 border-black" />
            <p className="mt-1 font-semibold">
              {dialog.atasan.nama_pegawai ?? "—"}
            </p>
            <p>{dialog.atasan.nama_jabatan ?? "Jabatan"}</p>
          </div>
          <div className="w-1/2">
            <p className="font-semibold">Pegawai,</p>
            {reviu.ttd_pegawai_path ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={reviu.ttd_pegawai_path}
                alt="Tanda tangan pegawai"
                className="mx-auto mt-3 h-16 object-contain"
              />
            ) : (
              <div className="h-16" />
            )}
            <div className="mx-auto mt-2 w-48 border-b-2 border-black" />
            <p className="mt-1 font-semibold">
              {dialog.pegawai.nama_pegawai ?? "—"}
            </p>
            <p>{dialog.pegawai.nama_jabatan ?? "Jabatan"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
