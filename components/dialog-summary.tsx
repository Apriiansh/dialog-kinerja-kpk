import { ASPEK_DESC, ASPEK_LABEL, ASPEK_ORDER } from "@/lib/aspek";
import type { AspekPegawaiRow } from "@/lib/dialog-display";
import { AspekPegawaiInput } from "@/components/aspek-pegawai-input";

export function DialogSummary({ aspek }: { aspek: AspekPegawaiRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {ASPEK_ORDER.map((jenis, index) => {
        const data = aspek.find((a) => a.jenis_aspek === jenis);

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
                <AspekPegawaiInput aspek={data} />
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
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}