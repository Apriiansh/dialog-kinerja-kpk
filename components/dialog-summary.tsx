import { ASPEK_DESC, ASPEK_LABEL, ASPEK_ORDER } from "@/lib/aspek";
import type { JenisAspek } from "@/generated/prisma/enums";

export interface SummaryItem {
  dialog_evaluasi: string | null;
  kompetensi_dikembangkan: string | null;
  metode_pengembangan_lainnya: string | null;
  waktu_pelaksanaan: Date | null;
  metode: { nama_metode: string } | null;
}

export interface SummaryAspek {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string | null;
  tanggung_jawab_atasan: string | null;
  item: SummaryItem[];
}

function metodeLabel(item: SummaryItem) {
  if (item.metode_pengembangan_lainnya?.trim()) {
    return item.metode_pengembangan_lainnya;
  }
  return item.metode?.nama_metode ?? null;
}

function formatWaktuPelaksanaan(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

function isEmptyItem(item: SummaryItem) {
  return (
    !item.dialog_evaluasi?.trim() &&
    !item.kompetensi_dikembangkan?.trim() &&
    !metodeLabel(item) &&
    !item.waktu_pelaksanaan
  );
}

export function DialogSummary({ aspek }: { aspek: SummaryAspek[] }) {
  return (
    <div className="flex flex-col gap-4">
      {ASPEK_ORDER.map((jenis, index) => {
        const data = aspek.find((a) => a.jenis_aspek === jenis);
        const items = (data?.item ?? []).filter((i) => !isEmptyItem(i));

        return (
          <section
            key={jenis}
            aria-labelledby={`aspek-${jenis}`}
            className="rounded-lg border border-outline bg-surface"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-outline px-5 py-3.5">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h3
                  id={`aspek-${jenis}`}
                  className="text-sm font-semibold text-ink"
                >
                  {index + 1}. {ASPEK_LABEL[jenis]}
                </h3>
                <p className="text-xs leading-4 text-ink-muted">
                  {ASPEK_DESC[jenis]}
                </p>
              </div>
            </div>

            {!data ? (
              <p className="px-5 py-4 text-sm leading-5 text-ink-muted">
                Belum diisi.
              </p>
            ) : (
              <div className="flex flex-col gap-4 px-5 py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Tanggung Jawab Pegawai
                  </span>
                  <p className="whitespace-pre-wrap text-sm leading-5 text-ink">
                    {data.tanggung_jawab_pegawai?.trim() || "—"}
                  </p>
                </div>

                {data.tanggung_jawab_atasan?.trim() ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                      Tanggung Jawab Atasan
                    </span>
                    <p className="whitespace-pre-wrap text-sm leading-5 text-ink">
                      {data.tanggung_jawab_atasan}
                    </p>
                  </div>
                ) : null}

                {items.length > 0 ? (
                  <ol className="flex flex-col divide-y divide-outline rounded-md border border-outline bg-surface-muted/40">
                    {items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex flex-col gap-2.5 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                              Tujuan / Evaluasi
                            </span>
                            <span className="whitespace-pre-wrap leading-5 text-ink">
                              {item.dialog_evaluasi?.trim() || "—"}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                              Kompetensi
                            </span>
                            <span className="whitespace-pre-wrap leading-5 text-ink">
                              {item.kompetensi_dikembangkan?.trim() || "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                              Metode Pengembangan
                            </span>
                            <span className="leading-5 text-ink">
                              {metodeLabel(item) || "—"}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                              Waktu Pelaksanaan
                            </span>
                            <span className="leading-5 text-ink">
                              {formatWaktuPelaksanaan(item.waktu_pelaksanaan)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm leading-5 text-ink-muted">
                    Belum ada rincian pengembangan.
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}