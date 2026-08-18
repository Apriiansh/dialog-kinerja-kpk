import { formatTanggal } from "@/lib/utils/format";
import { tindakLanjutLabel } from "@/lib/constants/reviu-status";
import { TindakLanjutBadge } from "@/components/shared/tindak-lanjut-badge";

interface ReviuSummaryRow {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
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
      value: tindakLanjutLabel(reviu.is_tercapai, reviu.is_tidak_tercapai),
    },
    {
      label: "Penjelasan Tercapai",
      value: reviu.penjelasan_tercapai,
    },
    {
      label: "Penjelasan Tidak Tercapai",
      value: reviu.penjelasan_tidak_tercapai,
    },
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
            <TindakLanjutBadge
              is_tercapai={reviu.is_tercapai}
              is_tidak_tercapai={reviu.is_tidak_tercapai}
            />
          </div>
        </div>
      ) : null}

      <dl className="flex flex-col divide-y divide-outline">
        {rows.map((row) => {
          const isLong =
            row.label === "Penjelasan Tercapai" ||
            row.label === "Penjelasan Tidak Tercapai" ||
            row.label === "Rencana Tindak Lanjut";
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
