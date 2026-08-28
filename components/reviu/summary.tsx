import { formatTanggal } from "@/lib/utils/format";
import { tindakLanjutLabel } from "@/lib/constants/reviu-status";
import { ASPEK_ORDER, ASPEK_LABEL } from "@/lib/constants/aspek";
import type { JenisAspek } from "@/generated/prisma/enums";
import { CapaianBadge } from "../shared/capaian-badge";

interface ReviuAspekItem {
  id: number;
  dialog_evaluasi: string | null;
  kompetensi_dikembangkan: string | null;
  is_tercapai: boolean | null;
  capaian_keterangan: string | null;
}

interface ReviuAspekRow {
  id: number;
  jenis_aspek: JenisAspek;
  item: ReviuAspekItem[];
}

interface ReviuSummaryRow {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
  rencana_tindak_lanjut: string | null;
  tanggal_next_evaluasi: Date | null;
  waktu_validasi_pegawai: Date | null;
  waktu_validasi_atasan: Date | null;
  dialog?: {
    aspek?: ReviuAspekRow[];
  };
}

export function ReviuSummary({
  reviu,
  showHeader = true,
}: {
  reviu: ReviuSummaryRow;
  showHeader?: boolean;
}) {
  const tanggalNext = reviu.tanggal_next_evaluasi
    ? formatTanggal(reviu.tanggal_next_evaluasi)
    : "—";

  const aspek = [...(reviu.dialog?.aspek ?? [])].sort(
    (a, b) =>
      ASPEK_ORDER.indexOf(a.jenis_aspek) - ASPEK_ORDER.indexOf(b.jenis_aspek),
  );
  const allItems = aspek.flatMap((a) => a.item);
  const tercapaiCount = allItems.filter((i) => i.is_tercapai).length;
  const tidakCount = allItems.filter((i) => i.is_tercapai === false).length;
  const hasAssessment = tercapaiCount > 0 || tidakCount > 0;

  const rows = [
    {
      label: "Status Tindak Lanjut",
      value: allItems.length > 0
        ? `${tercapaiCount} tercapai, ${tidakCount} belum tercapai`
        : tindakLanjutLabel(reviu.is_tercapai, reviu.is_tidak_tercapai),
    },
    {
      label: "Rencana Tindak Lanjut",
      value: reviu.rencana_tindak_lanjut,
    },
    { label: "Tanggal Evaluasi Berikutnya", value: tanggalNext },
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Formulir Reviu Hasil Dialog Kinerja
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink">Ringkasan item:</span>
            {hasAssessment ? (
              <>
                <span className="inline-flex gap-1 rounded-md bg-emerald-400 px-2.5 py-1 text-[11px] font-bold leading-4 text-ink-muted">
                  {tercapaiCount} tercapai
                </span>
                <span className="inline-flex gap-1 rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-bold leading-4 text-ink-muted">
                  {tidakCount} tidak tercapai
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {allItems.length > 0 ? (
        <div className="border-b border-outline px-5 py-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Capaian Item Evaluasi
          </span>
          <ul className="mt-3 flex flex-col gap-4">
            {aspek.map((group) => {
              if (group.item.length === 0) return null;
              return (
                <li key={group.id} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink">
                    {ASPEK_LABEL[group.jenis_aspek]}
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {group.item.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-outline px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-5 text-ink">
                            {item.dialog_evaluasi?.trim()
                              ? item.dialog_evaluasi
                              : `Item evaluasi #${item.id}`}
                          </p>
                          {item.capaian_keterangan?.trim() ? (
                            <p className="mt-0.5 text-xs leading-4 text-ink-muted">
                              {item.capaian_keterangan}
                            </p>
                          ) : null}
                        </div>
                        {item.is_tercapai === null ? (
                          <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                            Belum dinilai
                          </span>
                        ) : item.is_tercapai ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Tercapai
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            Tidak tercapai
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <dl className="flex flex-col divide-y divide-outline">
        {rows.map((row) => {
          const isLong = row.label === "Rencana Tindak Lanjut";
          return (
            <div
              key={row.label}
              className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
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
