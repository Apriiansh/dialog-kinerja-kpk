import {
  UsersIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  HourglassIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBars, Donut, type ChartDatum } from "@/components/dashboard/charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import {
  DIALOG_STATUS_CHART,
  ROLE_CHART,
} from "@/lib/utils/chart-colors";
import type { Role, StatusDialog } from "@/generated/prisma/enums";
import { formatPeriode } from "@/lib/constants/triwulan";

const PRIMARY = "#0891b2";
const STATUS_ORDER: StatusDialog[] = [
  "draft_atasan",
  "menunggu_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
  "selesai",
];
const ROLE_ORDER: Role[] = ["ATASAN", "PEGAWAI"];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function AdminDashboardPage() {
  const session = await requireRole("ADMIN");

  const [
    userCount,
    activeUserCount,
    dialogCount,
    inProgressCount,
    doneCount,
    reviuCount,
    reviuTercapai,
    reviuTidak,
    statusGroups,
    periodGroups,
    roleGroups,
    recentDialogs,
    adminProfile,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { is_active: true } }),
    prisma.dialogKinerja.count(),
    prisma.dialogKinerja.count({ where: { status: { not: "selesai" } } }),
    prisma.dialogKinerja.count({ where: { status: "selesai" } }),
    prisma.reviu.count(),
    prisma.reviu.count({ where: { is_tercapai: true } }),
    prisma.reviu.count({ where: { is_tidak_tercapai: true } }),
    prisma.dialogKinerja.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.dialogKinerja.groupBy({
      by: ["periode_tahun", "triwulan"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["default_role"],
      where: { default_role: { not: "ADMIN" } },
      _count: { _all: true },
    }),
    prisma.dialogKinerja.findMany({
      select: {
        id: true,
        periode_tahun: true,
        triwulan: true,
        status: true,
        updated_at: true,
        pegawai: { select: { nama_pegawai: true, npp: true } },
        atasan: { select: { nama_pegawai: true } },
      },
      orderBy: { updated_at: "desc" },
      take: 8,
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { npp: true, nama_jabatan: true, unit_kerja: true },
    }),
  ]);

  const statusData: ChartDatum[] = STATUS_ORDER.map((status) => {
    const found = statusGroups.find((g) => g.status === status);
    const cfg = DIALOG_STATUS_CHART[status];
    return {
      label: cfg.short,
      tooltipLabel: cfg.label,
      value: found?._count._all ?? 0,
      color: cfg.color,
    };
  }).filter((d) => d.value > 0);

  const periodData: ChartDatum[] = periodGroups
    .map((g) => ({
      label: `${formatPeriode(g.triwulan, g.periode_tahun)}`,
      value: g._count._all,
      color: PRIMARY,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const nonAdminActiveUserCount = roleGroups.reduce(
    (total, group) => total + group._count._all,
    0,
  );

  const roleData: ChartDatum[] = ROLE_ORDER.map((role) => {
    const found = roleGroups.find((g) => g.default_role === role);
    const cfg = ROLE_CHART[role];
    return {
      label: cfg.label,
      value: found?._count._all ?? 0,
      color: cfg.color,
    };
  }).filter((d) => d.value > 0);

  const reviuData: ChartDatum[] = [
    {
      label: "Tercapai",
      value: reviuTercapai,
      color: "#15803d",
    },
    {
      label: "Tidak Tercapai",
      value: reviuTidak,
      color: "#b45309",
    },
    {
      label: "Dalam Proses",
      value: Math.max(0, reviuCount - reviuTercapai - reviuTidak),
      color: "#475569",
    },
  ].filter((d) => d.value > 0);

  const stats = [
    {
      label: "Pengguna Aktif",
      value: activeUserCount,
      hint: `dari ${userCount} total pengguna`,
      icon: UsersIcon,
    },
    {
      label: "Dialog Kinerja",
      value: dialogCount,
      hint: "total semua periode",
      icon: ChatCircleDotsIcon,
    },
    {
      label: "Berjalan",
      value: inProgressCount,
      hint: "belum selesai",
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
        subtitle="Pantau pengguna, dialog kinerja, dan reviu di seluruh organisasi."
        user={{
          role: "ADMIN",
          npp: adminProfile?.npp ?? session.npp,
          jabatan: adminProfile?.nama_jabatan,
          unitKerja: adminProfile?.unit_kerja,
        }}
      />

      <section
        aria-label="Ringkasan sistem"
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

      <section
        aria-label="Analitik dialog"
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartCard
          title="Dialog Berdasarkan Status"
          subtitle="Distribusi seluruh dialog kinerja berdasarkan tahapannya"
        >
          <StatusBars data={statusData} />
        </ChartCard>
        <ChartCard
          title="Dialog per Periode"
          subtitle="Jumlah dialog kinerja per tahun periode"
        >
          <StatusBars data={periodData} />
        </ChartCard>
      </section>

      <section
        aria-label="Analitik pengguna dan reviu"
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartCard
          title="Pengguna per Peran"
          subtitle={`${nonAdminActiveUserCount} pengguna aktif terdaftar`}
        >
          <Donut
            data={roleData}
            centerValue={nonAdminActiveUserCount}
            centerLabel="pengguna"
          />
        </ChartCard>
        <ChartCard
          title="Hasil Reviu"
          subtitle={`${reviuCount} reviu tercatat`}
        >
          <Donut
            data={reviuData}
            centerValue={reviuCount}
            centerLabel="reviu"
          />
        </ChartCard>
      </section>

      <section aria-label="Dialog terbaru" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">
            Dialog Kinerja Terbaru
          </h2>
          <Link
            href="/admin/monitoring"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
          >
            Monitoring Dialog Kinerja
            <ArrowRightIcon size={16} weight="bold" />
          </Link>
        </div>
        {recentDialogs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ChatCircleDotsIcon size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              Belum ada dialog kinerja
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Dialog kinerja yang dibuat atasan akan tampil di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline bg-surface">
            <ul className="divide-y divide-outline">
              {recentDialogs.map((d) => {
                const cfg = DIALOG_STATUS_CHART[d.status];
                return (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link
                        href={`/admin/monitoring/${d.id}`}
                        className="truncate text-sm font-semibold text-ink transition-colors hover:text-primary"
                      >
                        {d.pegawai?.nama_pegawai}
                      </Link>
                      <span className="text-xs text-ink-muted">
                        {d.pegawai?.npp} · {formatPeriode(d.triwulan, d.periode_tahun)} · Atasan:{" "}
                        {d.atasan?.nama_pegawai}
                      </span>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: cfg.color, backgroundColor: `${cfg.color}1a` }}
                    >
                      {cfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}