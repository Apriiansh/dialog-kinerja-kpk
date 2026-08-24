import { ChartCard } from "./chart-card";
import { TrendLine, type ChartDatum } from "./charts";
import { EmptyState } from "@/components/shared/empty-state";
import { ASPEK_LABEL } from "@/lib/constants/aspek";
import type { JenisAspek } from "@/generated/prisma/enums";

export type CarryOverItem = {
  jenis_aspek: JenisAspek;
  evaluasi: string;
};

export function PegawaiTrendCard({
  pegawaiName,
  trendData,
  summary,
  carryOver,
  carryOverPeriode,
}: {
  pegawaiName: string;
  trendData: ChartDatum[];
  summary: { total: number; tercapai: number; tidakTercapai: number };
  carryOver: CarryOverItem[];
  carryOverPeriode: string | null;
}) {
  return (
    <section
      aria-label="Analisis tren pegawai"
      className="mt-6 grid gap-4 xl:grid-cols-2"
    >
      <ChartCard
        title="Tren Pencapaian Evaluasi"
        subtitle={`${summary.total} evaluasi telah direviu atas nama ${pegawaiName}`}
      >
        {trendData.length === 0 ? (
          <EmptyState
            variant="document"
            title="Belum ada evaluasi yang direviu"
            description="Grafik tren akan tampil setelah reviu evaluasi pegawai ini selesai."
            className="border-none bg-transparent py-10"
          />
        ) : (
          <TrendLine data={trendData} />
        )}
      </ChartCard>

      <ChartCard
        title="Perlu Perhatian (Carry-over)"
        subtitle={
          carryOverPeriode
            ? `Item belum tercapai dari ${carryOverPeriode}`
            : "Belum ada data reviu"
        }
      >
        {carryOver.length === 0 ? (
          <EmptyState
            variant="dialog"
            title={
              carryOverPeriode
                ? "Semua target periode terakhir tercapai"
                : "Belum ada riwayat reviu"
            }
            description={
              carryOverPeriode
                ? "Tidak ada item yang perlu ditinjau ulang dari periode sebelumnya."
                : undefined
            }
            className="border-none bg-transparent py-10"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {carryOver.map((item, i) => (
              <li
                key={`${item.jenis_aspek}-${i}`}
                className="flex items-start gap-3 rounded-lg border border-outline bg-surface-muted/50 px-4 py-3"
              >
                <span className="mt-0.5 shrink-0 rounded-md bg-status-amber-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-amber">
                  {ASPEK_LABEL[item.jenis_aspek]}
                </span>
                <span className="text-sm leading-5 text-ink">{item.evaluasi}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </section>
  );
}
