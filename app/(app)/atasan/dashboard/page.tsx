import {
  UsersIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  HourglassIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  StatusBars,
  HorizontalBars,
  type ChartDatum,
} from "@/components/dashboard/charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DIALOG_STATUS_CHART } from "@/lib/chart-colors";
import type { StatusDialog } from "@/generated/prisma/enums";

const STATUS_ORDER: StatusDialog[] = [
  "draft_atasan",
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

  const [pegawai, dialogs] = await Promise.all([
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
        status: true,
        updated_at: true,
        pegawai: {
          select: { nama_pegawai: true, npp: true },
        },
      },
      orderBy: { updated_at: "desc" },
    }),
  ]);

  const recent = dialogs.slice(0, 5);
  const dialogCount = dialogs.length;
  const doneCount = dialogs.filter((d) => d.status === "selesai").length;
  const menungguCount = dialogs.filter(
    (d) => d.status === "menunggu_atasan",
  ).length;

  const statusData: ChartDatum[] = STATUS_ORDER.map((status) => {
    const cfg = DIALOG_STATUS_CHART[status];
    return {
      label: cfg.short,
      tooltipLabel: cfg.label,
      value: dialogs.filter((d) => d.status === status).length,
      color: cfg.color,
    };
  }).filter((d) => d.value > 0);

  const perPegawaiMap = new Map<number, ChartDatum>();
  for (const d of dialogs) {
    const name = d.pegawai?.nama_pegawai ?? `Pegawai #${d.id_pegawai}`;
    const entry = perPegawaiMap.get(d.id_pegawai) ?? {
      label: name,
      value: 0,
      color: "#1e3a8a",
    };
    entry.value += 1;
    perPegawaiMap.set(d.id_pegawai, entry);
  }
  const perPegawaiData = [...perPegawaiMap.values()].sort(
    (a, b) => b.value - a.value,
  );

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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            {greeting()}, {session.nama}
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Pantau dialog kinerja pegawai di bawah Anda.
          </p>
        </div>
      </header>

      <section
        aria-label="Ringkasan kinerja"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-3 rounded-lg border border-outline bg-surface p-5"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                <Icon size={18} weight="bold" />
              </span>
              <span className="text-2xl font-semibold leading-8 text-ink">
                {value}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="text-xs leading-4 text-ink-muted">{hint}</span>
            </div>
          </div>
        ))}
      </section>

      <section
        aria-label="Analitik tim"
        className="grid gap-4 lg:grid-cols-2"
      >
        <ChartCard
          title="Status Dialog Tim Anda"
          subtitle={`${dialogCount} dialog kinerja di bawah pengelolaan Anda`}
        >
          <StatusBars data={statusData} />
        </ChartCard>
        <ChartCard
          title="Dialog per Pegawai"
          subtitle="Jumlah dialog yang dibuat untuk masing-masing pegawai"
        >
          <HorizontalBars data={perPegawaiData} />
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
                        {d.pegawai?.npp} · Tahun {d.periode_tahun}
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
    </div>
  );
}