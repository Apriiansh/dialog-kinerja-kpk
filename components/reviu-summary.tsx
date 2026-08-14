import { formatTanggal } from "@/lib/format";
import { STATUS_TINDAK_LANJUT_LABEL } from "@/lib/status-reviu";
import { TindakLanjutBadge } from "@/components/tindak-lanjut-badge";

interface ReviuSummaryRow {
  status_tindaklanjut: "TERCAPAI" | "TIDAK_TERCAPAI";
  penjelasan: string;
  rencana_tindak_lanjut: string | null;
  tanggal_next_reviu: Date | null;
  waktu_validasi_pegawai: Date | null;
  waktu_validasi_atasan: Date | null;
}

export function ReviuSummary({
  reviu,
  showHeader = true,
}: {
  reviu: ReviuSummaryRow;
  showHeader?: boolean;
}) {
  const tanggalNext = reviu.tanggal_next_reviu
    ? formatTanggal(reviu.tanggal_next_reviu)
    : "—";

  const rows = [
    {
      label: "Status Tindak Lanjut",
      value: STATUS_TINDAK_LANJUT_LABEL[reviu.status_tindaklanjut],
    },
    { label: "Penjelasan", value: reviu.penjelasan },
    {
      label: "Rencana Tindak Lanjut",
      value: reviu.rencana_tindak_lanjut,
    },
    { label: "Tanggal Reviu Berikutnya", value: tanggalNext },
    {
      label: "Tanggal divalidasi Atasan",
      value: reviu.waktu_validasi_atasan
        ? formatTanggal(reviu.waktu_validasi_atasan)
        : "Belum",
    },
    {
      label: "Validasi Pegawai",
      value: reviu.waktu_validasi_pegawai
        ? formatTanggal(reviu.waktu_validasi_pegawai)
        : "Belum",
    },
  ];

  return (
    <section
      aria-label="Isi reviu"
      className="overflow-hidden rounded-lg border border-outline bg-surface"
    >
      {showHeader ? (
        <div className="border-b border-outline bg-surface-muted/60 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
              Formulir Reviu Hasil Dialog Kinerja
            </span>
            <TindakLanjutBadge status={reviu.status_tindaklanjut} />
          </div>
        </div>
      ) : null}

      <dl className="flex flex-col divide-y divide-outline">
        {rows.map((row) => {
          const isLong = row.label === "Penjelasan" || row.label === "Rencana Tindak Lanjut";
          return (
            <div
              key={row.label}
              className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                {row.label}
              </dt>
              <dd
                className={`text-sm leading-5 text-ink ${
                  isLong ? "whitespace-pre-wrap" : ""
                }`}
              >
                {row.value?.trim() ? row.value : "—"}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
