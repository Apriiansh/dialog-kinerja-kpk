import {
  UsersIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  HourglassIcon,
  ArrowRightIcon,
  BellIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { ChartCard } from "@/components/dashboard/chart-card";
import {
  TrendLine,
  type ChartDatum,
} from "@/components/dashboard/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { DIALOG_STATUS_CHART } from "@/lib/utils/chart-colors";
import { formatDistanceToNow } from "@/lib/utils/format";
import type { StatusDialog, Triwulan } from "@/generated/prisma/enums";
import { formatPeriode } from "@/lib/constants/triwulan";
import { EvaluationCalendar, type CalendarEvent } from "@/components/dashboard/evaluation-calendar";
import { AchievementList } from "@/components/dashboard/achievement-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { GreetingCard } from "@/components/dashboard/greeting-card";

const STATUS_ORDER: StatusDialog[] = [
  "draft",
  "menunggu_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
  "selesai",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function AtasanDashboardPage() {
  const session = await requireAuth();

  const [
    pegawai,
    dialogs,
    recentNotifications,
    upcomingReviu,
    upcomingDialogs,
    analyticsByPegawai,
    atasanProfile,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { id_atasan: session.id, is_active: true },
      select: {
        id: true,
        npp: true,
        nama_pegawai: true,
        nama_jabatan: true,
        unit_kerja: true,
      },
      orderBy: { nama_pegawai: "asc" },
    }),
    prisma.dialogKinerja.findMany({
      where: { id_atasan: session.id },
      select: {
        id: true,
        id_pegawai: true,
        periode_tahun: true,
        triwulan: true,
        status: true,
        updated_at: true,
        pegawai: {
          select: { nama_pegawai: true, npp: true },
        },
      },
      orderBy: { updated_at: "desc" },
    }),
    prisma.notification.findMany({
      where: { id_user: session.id },
      select: {
        id: true,
        title: true,
        description: true,
        link: true,
        is_read: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: 5,
    }),
    prisma.reviu.findMany({
      where: {
        dialog: { id_atasan: session.id },
        status: "selesai",
        tanggal_next_evaluasi: { not: null },
      },
      select: {
        id: true,
        tanggal_next_evaluasi: true,
        dialog: {
          select: {
            id: true,
            periode_tahun: true,
            triwulan: true,
            pegawai: { select: { nama_pegawai: true, npp: true } },
          },
        },
      },
      orderBy: { tanggal_next_evaluasi: "asc" },
    }),
    prisma.dialogKinerja.findMany({
      where: {
        id_atasan: session.id,
        jadwal_dialog: { not: null },
        status: { in: ["draft", "menunggu_pegawai", "menunggu_atasan", "menunggu_validasi"] },
      },
      select: {
        id: true,
        jadwal_dialog: true,
        periode_tahun: true,
        triwulan: true,
        status: true,
        pegawai: { select: { nama_pegawai: true, npp: true } },
      },
      orderBy: { jadwal_dialog: "asc" },
    }),
    prisma.user.findMany({
      where: { id_atasan: session.id, is_active: true },
      select: {
        id: true,
        nama_pegawai: true,
        npp: true,
        dialogAsPegawai: {
          where: { status: "selesai", periode_tahun: new Date().getFullYear() },
          select: {
            id: true,
            triwulan: true,
            aspek: {
              select: {
                jenis_aspek: true,
                item: {
                  where: { is_tercapai: { not: null } },
                  select: {
                    id: true,
                    dialog_evaluasi: true,
                    is_tercapai: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { nama_pegawai: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { npp: true, nama_jabatan: true, unit_kerja: true },
    }),
  ]);

  const recent = dialogs.slice(0, 5);
  const dialogCount = dialogs.length;
  const doneCount = dialogs.filter((d) => d.status === "selesai").length;
  const menungguCount = dialogs.filter(
    (d) => d.status === "menunggu_atasan",
  ).length;

  const teamTahun = new Date().getFullYear();
  const teamPeriodMap = new Map<Triwulan, { tercapai: number; tidakTercapai: number }>();
  for (const p of analyticsByPegawai) {
    for (const d of p.dialogAsPegawai) {
      const reviewed = d.aspek
        .flatMap((a) => a.item)
        .filter((it) => (it.dialog_evaluasi?.trim() ?? "") !== "");
      if (reviewed.length === 0) continue;
      const entry =
        teamPeriodMap.get(d.triwulan) ?? { tercapai: 0, tidakTercapai: 0 };
      for (const it of reviewed) {
        if (it.is_tercapai) entry.tercapai += 1;
        else entry.tidakTercapai += 1;
      }
      teamPeriodMap.set(d.triwulan, entry);
    }
  }
  const teamTrendData: ChartDatum[] = [...teamPeriodMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tw, acc]) => ({
      label: `${tw} '${String(teamTahun).slice(2)}`,
      tooltipLabel: formatPeriode(tw, teamTahun),
      value: Math.round((acc.tercapai / (acc.tercapai + acc.tidakTercapai)) * 100),
      hint: `${acc.tercapai} tercapai · ${acc.tidakTercapai} tidak tercapai`,
    }));

  const calendarEvents: CalendarEvent[] = [
    ...upcomingReviu.map((r) => ({
      id: r.id,
      dialogId: r.dialog.id,
      date: r.tanggal_next_evaluasi!.toISOString(),
      pegawaiName: r.dialog.pegawai.nama_pegawai,
      npp: r.dialog.pegawai.npp,
      triwulan: r.dialog.triwulan,
      tahun: r.dialog.periode_tahun,
      kind: "reviu" as const,
    })),
    ...upcomingDialogs.map((d) => ({
      id: d.id,
      dialogId: d.id,
      date: d.jadwal_dialog!.toISOString(),
      pegawaiName: d.pegawai.nama_pegawai,
      npp: d.pegawai.npp,
      triwulan: d.triwulan,
      tahun: d.periode_tahun,
      kind: "dialog" as const,
      status: d.status,
    })),
  ];

  const achievementStats = analyticsByPegawai.map(p => {
    const items = p.dialogAsPegawai.flatMap(d => d.aspek.flatMap(a => a.item.map(i => ({
      id: i.id,
      jenis_aspek: a.jenis_aspek,
      dialog_evaluasi: i.dialog_evaluasi || "",
      is_tercapai: i.is_tercapai!
    }))));
    const tercapaiCount = items.filter(i => i.is_tercapai).length;
    const tidakTercapaiCount = items.filter(i => !i.is_tercapai).length;
    
    return {
      pegawaiId: p.id,
      nama_pegawai: p.nama_pegawai,
      npp: p.npp,
      tercapaiCount,
      tidakTercapaiCount,
      items
    };
  }).filter(p => p.items.length > 0);

  const totalTercapai = achievementStats.reduce((sum, emp) => sum + emp.tercapaiCount, 0);
  const totalTidakTercapai = achievementStats.reduce((sum, emp) => sum + emp.tidakTercapaiCount, 0);

  const evalMap = new Map<string, { evaluasi: string; tercapai: number; tidakTercapai: number }>();
  
  analyticsByPegawai.forEach(p => {
    p.dialogAsPegawai.forEach(d => {
      d.aspek.forEach(a => {
        a.item.forEach(i => {
          const key = `${a.jenis_aspek}:::${i.dialog_evaluasi?.trim() || "Target tidak memiliki nama"}`;
          if (!evalMap.has(key)) {
            evalMap.set(key, { evaluasi: i.dialog_evaluasi?.trim() || "Target tidak memiliki nama", tercapai: 0, tidakTercapai: 0 });
          }
          const stat = evalMap.get(key)!;
          if (i.is_tercapai) stat.tercapai++;
          else stat.tidakTercapai++;
        });
      });
    });
  });

  const rawEvalStats = Array.from(evalMap.entries()).map(([key, stat]) => {
    const [jenis_aspek, _] = key.split(":::");
    return { jenis_aspek, ...stat };
  });

  // Group by jenis_aspek
  const aspectGroups = new Map<string, typeof rawEvalStats>();
  rawEvalStats.forEach(stat => {
    if (!aspectGroups.has(stat.jenis_aspek)) {
      aspectGroups.set(stat.jenis_aspek, []);
    }
    aspectGroups.get(stat.jenis_aspek)!.push(stat);
  });

  const analyticsByEvaluasi = Array.from(aspectGroups.entries()).map(([jenis_aspek, items]) => ({
    jenis_aspek,
    items: items.sort((a, b) => (b.tercapai + b.tidakTercapai) - (a.tercapai + a.tidakTercapai))
  }));

  const dialogCountByPegawai = new Map<number, number>();
  for (const d of dialogs) {
    dialogCountByPegawai.set(
      d.id_pegawai,
      (dialogCountByPegawai.get(d.id_pegawai) ?? 0) + 1,
    );
  }

  const stats = [
    {
      label: "Pegawai",
      value: pegawai.length,
      hint: "bawahan di unit kerja",
      icon: UsersIcon,
    },
    {
      label: "Dialog Kinerja",
      value: dialogCount,
      hint: "total periode berjalan",
      icon: ChatCircleDotsIcon,
    },
    {
      label: "Menunggu Anda",
      value: menungguCount,
      hint: "perlu tindakan atasan",
      icon: HourglassIcon,
    },
    {
      label: "Selesai",
      value: doneCount,
      hint: "validasi lengkap",
      icon: CheckCircleIcon,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <GreetingCard
        greeting={`${greeting()}, ${session.nama}`}
        subtitle="Pantau dialog kinerja pegawai di bawah Anda."
        user={{
          role: "ATASAN",
          npp: atasanProfile?.npp ?? session.npp,
          jabatan: atasanProfile?.nama_jabatan,
          unitKerja: atasanProfile?.unit_kerja,
        }}
      />

      <section
        aria-label="Ringkasan kinerja"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, hint, icon }, index) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            hint={hint}
            icon={icon}
            tone={index % 2 === 0 ? "cyan" : "red"}
          />
        ))}
      </section>

      <section aria-label="Tren pencapaian tim">
        <ChartCard
          title="Tren Pencapaian Evaluasi Tim"
          subtitle={`Rata-rata persentase capaian evaluasi seluruh pegawai per triwulan (${teamTahun})`}
        >
          {teamTrendData.length === 0 ? (
            <EmptyState
              variant="document"
              title="Belum ada reviu selesai"
              description="Grafik tren akan tampil setelah ada reviu evaluasi yang selesai di tahun ini."
              className="border-none bg-transparent py-10"
            />
          ) : (
            <TrendLine data={teamTrendData} />
          )}
        </ChartCard>
      </section>

      <section
        aria-label="Jadwal dan Analitik"
        className="grid gap-4 xl:grid-cols-2"
      >
        <ChartCard
          title="Jadwal Evaluasi"
          subtitle="Kalender evaluasi target pegawai di bawah Anda"
        >
          <div className="w-full">
            <EvaluationCalendar events={calendarEvents} />
          </div>
        </ChartCard>
        
        <ChartCard
          title="Analisis Capaian Kinerja"
          subtitle={`Statistik capaian target tim Anda di tahun ${new Date().getFullYear()}`}
        >
          <div className="w-full flex flex-col gap-4">
            <AchievementList 
              analytics={achievementStats} 
              evalAnalytics={analyticsByEvaluasi}
              totalTercapai={totalTercapai}
              totalTidakTercapai={totalTidakTercapai}
            />
          </div>
        </ChartCard>
      </section>

      <section
        aria-label="Pegawai dan dialog terbaru"
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartCard
          title="Pegawai di Bawah Anda"
          subtitle={`${pegawai.length} pegawai aktif`}
          action={
            <Link
              href="/atasan/pegawai"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
            >
              Kelola Pegawai
              <ArrowRightIcon size={12} weight="bold" />
            </Link>
          }
        >
          {pegawai.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              Belum ada pegawai di bawah Anda.
            </p>
          ) : (
            <ul className="divide-y divide-outline">
              {pegawai.slice(0, 8).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      href={`/atasan/pegawai/${p.id}/edit`}
                      className="truncate text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      {p.nama_pegawai}
                    </Link>
                    <span className="truncate text-xs text-ink-muted">
                      NPP {p.npp}
                      {p.unit_kerja ? ` · ${p.unit_kerja}` : ""}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-bold text-ink-muted">
                    {dialogCountByPegawai.get(p.id) ?? 0} dialog
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard
          title="Dialog Terbaru"
          subtitle="Aktivitas dialog kinerja paling akhir"
          action={
            <Link
              href="/atasan/dialog"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
            >
              Kelola Dialog
              <ArrowRightIcon size={12} weight="bold" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              Belum ada dialog kinerja.
            </p>
          ) : (
            <ul className="divide-y divide-outline">
              {recent.map((d) => {
                const cfg = DIALOG_STATUS_CHART[d.status];
                return (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link
                        href={`/atasan/dialog/${d.id}`}
                        className="truncate text-sm font-semibold text-ink transition-colors hover:text-primary"
                      >
                        {d.pegawai?.nama_pegawai}
                      </Link>
                      <span className="text-xs text-ink-muted">
                        {d.pegawai?.npp} · {formatPeriode(d.triwulan, d.periode_tahun)}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                      style={{
                        color: cfg.color,
                        backgroundColor: `${cfg.color}1a`,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      </section>

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <section aria-label="Notifikasi terbaru" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Notifikasi Terbaru</h2>
            <Link
              href="/atasan/notifikasi"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
            >
              Lihat Semua
              <ArrowRightIcon size={14} weight="bold" />
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {recentNotifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link}
                  className={`flex gap-4 rounded-lg border bg-surface px-5 py-3 transition-colors hover:border-outline-strong hover:shadow-ambient ${
                    n.is_read ? "border-outline" : "border-l-primary border-l-2 border-outline"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                    <BellIcon size={16} weight="bold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.is_read ? "font-medium text-ink" : "font-semibold text-ink"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                      {n.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-ink-muted">
                    {formatDistanceToNow(n.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}