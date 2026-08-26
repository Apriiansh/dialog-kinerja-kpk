import Link from "next/link";
import {
  ChatCircleDotsIcon,
  CheckCircleIcon,
  ListChecksIcon,
  XCircleIcon,
  ArrowRightIcon,
  BellIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Donut,
  TrendLine,
  type ChartDatum,
} from "@/components/dashboard/charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ASPEK_ORDER } from "@/lib/constants/aspek";
import { formatPeriode } from "@/lib/constants/triwulan";
import { formatDistanceToNow } from "@/lib/utils/format";
import type { StatusDialog, Triwulan } from "@/generated/prisma/enums";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

const CTA: Record<
  StatusDialog,
  { label: string; href: (id: number) => string; variant: "primary" | "plain" }
> = {
  draft_atasan: {
    label: "Ditunggu",
    href: (id) => `/pegawai/dialog/${id}`,
    variant: "plain",
  },
  menunggu_pegawai: {
    label: "Isi Dialog",
    href: (id) => `/pegawai/dialog/${id}/edit`,
    variant: "primary",
  },
  menunggu_atasan: {
    label: "Lihat Detail",
    href: (id) => `/pegawai/dialog/${id}`,
    variant: "plain",
  },
  menunggu_validasi: {
    label: "Validasi",
    href: (id) => `/pegawai/dialog/${id}`,
    variant: "primary",
  },
  selesai: {
    label: "Lihat Detail",
    href: (id) => `/pegawai/dialog/${id}`,
    variant: "plain",
  },
};

function filledAspekCount(
  aspek: { tanggung_jawab_pegawai: string | null; item: { id: number }[] }[],
) {
  return aspek.filter(
    (a) =>
      (a.tanggung_jawab_pegawai?.trim() ?? "") !== "" || a.item.length > 0,
  ).length;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PegawaiDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await searchParams;

  const session = await requireAuth();

  const [user, dialogs, reviu, recentNotifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { npp: true, nama_jabatan: true, unit_kerja: true },
    }),
    prisma.dialogKinerja.findMany({
      where: { id_pegawai: session.id },
      include: {
        atasan: { select: { nama_pegawai: true, nama_jabatan: true } },
        aspek: {
          include: {
            item: {
              select: { id: true, is_tercapai: true, dialog_evaluasi: true },
            },
          },
        },
      },
      orderBy: { updated_at: "desc" },
    }),
    prisma.reviu.findMany({
      where: { dialog: { id_pegawai: session.id } },
      select: { is_tercapai: true, is_tidak_tercapai: true },
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
  ]);

  const urgentDialogs = dialogs.filter(
    (d) => d.status === "menunggu_pegawai" || d.status === "menunggu_validasi",
  );

  const allItems = dialogs.flatMap((d) =>
    d.aspek.flatMap((a) => a.item),
  );
  const filledItems = allItems.filter(
    (it) => (it.dialog_evaluasi?.trim() ?? "") !== "",
  );

  // Deduplicate items by dialog_evaluasi — latest dialog's status wins
  const latestItemStatus = new Map<string, boolean>();
  for (const d of dialogs) {
    for (const it of d.aspek.flatMap((a) => a.item)) {
      const key = (it.dialog_evaluasi?.trim() ?? "").toLowerCase();
      if (!key || it.is_tercapai === null) continue;
      if (!latestItemStatus.has(key)) {
        latestItemStatus.set(key, it.is_tercapai);
      }
    }
  }
  const tercapaiCount = [...latestItemStatus.values()].filter(Boolean).length;
  const tidakTercapaiCount = [...latestItemStatus.values()].filter((v) => !v).length;
  const uniqueReviewedCount = latestItemStatus.size;

  const shareHint = (part: number) =>
    uniqueReviewedCount > 0
      ? `${Math.round((part / uniqueReviewedCount) * 100)}% dari yang direviu`
      : "belum ada yang direviu";

  type PeriodAccumulator = {
    year: number;
    triwulan: Triwulan;
    tercapai: number;
    tidakTercapai: number;
  };

  const periodMap = new Map<string, PeriodAccumulator>();
  const seenItems = new Map<string, boolean>();
  for (const d of dialogs) {
    const items = d.aspek
      .flatMap((a) => a.item)
      .filter(
        (it) =>
          (it.dialog_evaluasi?.trim() ?? "") !== "" &&
          it.is_tercapai !== null,
      );
    if (items.length === 0) continue;

    const key = `${d.periode_tahun}-${d.triwulan}`;
    const entry = periodMap.get(key) ?? {
      year: d.periode_tahun,
      triwulan: d.triwulan,
      tercapai: 0,
      tidakTercapai: 0,
    };
    for (const it of items) {
      const itemKey = (it.dialog_evaluasi?.trim() ?? "").toLowerCase();
      if (seenItems.has(itemKey)) continue;
      seenItems.set(itemKey, true);
      if (it.is_tercapai) entry.tercapai += 1;
      else entry.tidakTercapai += 1;
    }
    periodMap.set(key, entry);
  }

  const trendData: ChartDatum[] = [...periodMap.values()]
    .sort(
      (a, b) => a.year - b.year || a.triwulan.localeCompare(b.triwulan),
    )
    .map((p) => {
      const total = p.tercapai + p.tidakTercapai;
      return {
        label: `${p.triwulan} '${String(p.year).slice(2)}`,
        tooltipLabel: formatPeriode(p.triwulan, p.year),
        value: Math.round((p.tercapai / total) * 100),
        hint: `${p.tercapai} tercapai · ${p.tidakTercapai} tidak tercapai`,
      };
    });

  const reviuData: ChartDatum[] = [
    {
      label: "Tercapai",
      value: tercapaiCount,
      color: "#15803d",
    },
    {
      label: "Tidak Tercapai",
      value: tidakTercapaiCount,
      color: "#b45309",
    },
  ].filter((d) => d.value > 0);

  const stats = [
    {
      label: "Dialog Kinerja",
      value: dialogs.length,
      hint: `${reviu.length} reviu tercatat`,
      icon: ChatCircleDotsIcon,
      href: "/pegawai/dialog",
      ariaLabel: "Lihat dialog kinerja saya",
      chipClassName: undefined as string | undefined,
    },
    {
      label: "Total Evaluasi",
      value: filledItems.length,
      hint: `${filledItems.length - uniqueReviewedCount} belum direviu`,
      icon: ListChecksIcon,
      href: "/pegawai/reviu",
      ariaLabel: "Lihat reviu evaluasi saya",
      chipClassName: undefined as string | undefined,
    },
    {
      label: "Evaluasi Tercapai",
      value: tercapaiCount,
      hint: shareHint(tercapaiCount),
      icon: CheckCircleIcon,
      href: "/pegawai/reviu",
      ariaLabel: "Lihat evaluasi tercapai",
      chipClassName: "bg-status-green-soft text-status-green",
    },
    {
      label: "Evaluasi Tidak Tercapai",
      value: tidakTercapaiCount,
      hint: shareHint(tidakTercapaiCount),
      icon: XCircleIcon,
      href: "/pegawai/reviu",
      ariaLabel: "Lihat evaluasi tidak tercapai",
      chipClassName: "bg-status-amber-soft text-status-amber",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <GreetingCard
        greeting={`${greeting()}, ${session.nama}`}
        subtitle="Selamat datang di Sistem Aplikasi Dialog Kinerja Biro SDM KPK."
        user={{
          role: "PEGAWAI",
          npp: user?.npp ?? session.npp,
          jabatan: user?.nama_jabatan,
          unitKerja: user?.unit_kerja,
        }}
      />

      {/* Overview Cards */}
      <section aria-label="Ringkasan kinerja" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Ringkasan Kinerja</h2>
          <Link
            href="/pegawai/dialog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
          >
            Lihat Halaman Dialog Kinerja Saya
            <ArrowRightIcon size={14} weight="bold" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(
            ({ label, value, hint, icon, href, ariaLabel, chipClassName }, index) => (
              <StatCard
                key={label}
                label={label}
                value={value}
                hint={hint}
                icon={icon}
                href={href}
                ariaLabel={ariaLabel}
                chipClassName={
                  chipClassName ? `rounded-md ${chipClassName}` : undefined
                }
                tone={index % 2 === 0 ? "cyan" : "red"}
              />
            ),
          )}
        </div>
      </section>

      {/* Charts */}
      <section aria-label="Analitik pribadi" className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Analisis Evaluasi Dialog Kinerja"
          subtitle={`${uniqueReviewedCount} evaluasi telah direviu`}
        >
          {trendData.length === 0 ? (
            <EmptyState
              variant="document"
              title="Belum ada evaluasi yang direviu"
              description="Persentase pencapaian per periode akan tampil di sini setelah reviu evaluasi Anda selesai."
              className="border-none bg-transparent py-10"
            />
          ) : (
            <TrendLine data={trendData} />
          )}
        </ChartCard>
        <ChartCard
          title="Hasil Reviu Saya"
          subtitle={`${uniqueReviewedCount} evaluasi telah direviu`}
        >
          <Donut
            data={reviuData}
            centerValue={uniqueReviewedCount}
            centerLabel="evaluasi"
          />
        </ChartCard>
      </section>

      {/* Action Required Dialogs Section */}
      <section aria-label="Tindakan yang perlu dilakukan" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Perlu Tindakan Anda</h2>
          <span className="text-xs font-medium text-ink-muted">
            {urgentDialogs.length} perlu perhatian
          </span>
        </div>

        {urgentDialogs.length === 0 ? (
          <EmptyState
            variant="document"
            title="Semua tugas telah diselesaikan"
            description="Tidak ada dialog kinerja yang membutuhkan tindakan pengisian atau validasi dari Anda saat ini."
            action={
              <Link
                href="/pegawai/dialog"
                className="mt-1 inline-flex items-center gap-2 rounded-md border border-outline bg-surface px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
              >
                Buka Semua Dialog Kinerja Saya
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {urgentDialogs.map((d) => {
              const filled = filledAspekCount(d.aspek);
              const cta = CTA[d.status];
              const progress = Math.round((filled / ASPEK_ORDER.length) * 100);
              return (
                <li key={d.id}>
                  <Link
                    href={cta.href(d.id)}
                    className="flex flex-col gap-3 rounded-lg border border-outline bg-surface px-5 py-4 transition-colors hover:border-outline-strong hover:shadow-ambient"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-semibold text-ink">
                          Dialog Kinerja {formatPeriode(d.triwulan, d.periode_tahun)}
                        </span>
                        <span className="truncate text-xs text-ink-muted">
                          Atasan: {d.atasan.nama_pegawai}
                          {d.atasan.nama_jabatan
                            ? ` (${d.atasan.nama_jabatan})`
                            : ""}
                        </span>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-[11px] font-medium text-ink-muted">
                          {filled}/{ASPEK_ORDER.length} aspek terisi
                        </span>
                        <div
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-soft"
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary">
                        {cta.label}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <section aria-label="Notifikasi terbaru" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Notifikasi Terbaru</h2>
            <Link
              href="/pegawai/notifikasi"
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