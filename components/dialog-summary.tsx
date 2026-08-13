import { ASPEK_DESC, ASPEK_LABEL } from "@/lib/aspek";
import type { AspekPegawaiRow } from "@/lib/dialog-display";
import { AspekPegawaiInput } from "@/components/aspek-pegawai-input";
import type { JenisAspek } from "@/generated/prisma/enums";

interface SummaryGroup {
  label: string;
  jenis: JenisAspek;
}

interface SummarySection {
  letter: string;
  title: string;
  desc: string;
  groups: SummaryGroup[];
}

const SUMMARY_SECTIONS: SummarySection[] = [
  {
    letter: "A",
    title: ASPEK_LABEL.SKP,
    desc: ASPEK_DESC.SKP,
    groups: [{ label: ASPEK_LABEL.SKP, jenis: "SKP" }],
  },
  {
    letter: "B",
    title: ASPEK_LABEL.GAP_ASESMEN,
    desc: ASPEK_DESC.GAP_ASESMEN,
    groups: [{ label: ASPEK_LABEL.GAP_ASESMEN, jenis: "GAP_ASESMEN" }],
  },
  {
    letter: "C",
    title: ASPEK_LABEL.PERILAKU,
    desc: ASPEK_DESC.PERILAKU,
    groups: [{ label: ASPEK_LABEL.PERILAKU, jenis: "PERILAKU" }],
  },
  {
    letter: "D",
    title: "Aspirasi Karir",
    desc: "Aspirasi pengembangan karir dalam jangka pendek dan menengah.",
    groups: [
      { label: "1. Jangka Pendek (1-2 Tahun)", jenis: "KARIR_PENDEK" },
      { label: "2. Jangka Menengah (3-5 Tahun)", jenis: "KARIR_MENENGAH" },
    ],
  },
];

export function DialogSummary({ aspek }: { aspek: AspekPegawaiRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      {SUMMARY_SECTIONS.map(({ letter, title, desc, groups }) => (
        <section
          key={letter}
          aria-labelledby={`aspek-${letter}`}
          className="rounded-lg border border-outline bg-surface"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-outline px-5 py-3.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h3
                id={`aspek-${letter}`}
                className="text-sm font-semibold text-ink"
              >
                {letter}. {title}
              </h3>
              <p className="text-xs leading-4 text-ink-muted">{desc}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 px-5 py-4">
            {groups.map(({ label, jenis }) => {
              const data = aspek.find((a) => a.jenis_aspek === jenis);

              return (
                <div key={jenis} className="flex flex-col gap-4">
                  {groups.length > 1 ? (
                    <h4 className="text-sm font-semibold text-ink">{label}</h4>
                  ) : null}

                  {!data ? (
                    <p className="text-sm leading-5 text-ink-muted">
                      Belum diisi.
                    </p>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}