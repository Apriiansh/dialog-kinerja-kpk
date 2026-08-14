import Link from "next/link";
import {
  BuildingsIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  HourglassIcon,
  IdentificationCardIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { RoleTag } from "@/components/role-tag";
import { StatusBadge } from "@/components/status-badge";
import { ASPEK_ORDER } from "@/lib/aspek";
import type { StatusDialog } from "@/generated/prisma/enums";

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

  const [user, dialogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: { npp: true, nama_jabatan: true, unit_kerja: true },
    }),
    prisma.dialogKinerja.findMany({
      where: { id_pegawai: session.id },
      include: {
        atasan: { select: { nama_pegawai: true, nama_jabatan: true } },
        aspek: {
          include: { item: { select: { id: true } } },
        },
      },
      orderBy: { updated_at: "desc" },
    }),
  ]);

  const urgentDialogs = dialogs.filter(
    (d) => d.status === "menunggu_pegawai" || d.status === "menunggu_validasi",
  );

  const stats = [
    {
      key: "menunggu_pegawai" as const,
      label: "Perlu Diisi",
      count: dialogs.filter((d) => d.status === "menunggu_pegawai").length,
      icon: PencilSimpleIcon,
      className: "bg-status-amber-soft text-status-amber",
    },
    {
      key: "menunggu_atasan" as const,
      label: "Menunggu Atasan",
      count: dialogs.filter((d) => d.status === "menunggu_atasan").length,
      icon: HourglassIcon,
      className: "bg-status-blue-soft text-status-blue",
    },
    {
      key: "menunggu_validasi" as const,
      label: "Menunggu Validasi",
      count: dialogs.filter((d) => d.status === "menunggu_validasi").length,
      icon: ShieldCheckIcon,
      className: "bg-status-indigo-soft text-status-indigo",
    },
    {
      key: "selesai" as const,
      label: "Selesai",
      count: dialogs.filter((d) => d.status === "selesai").length,
      icon: CheckCircleIcon,
      className: "bg-status-green-soft text-status-green",
    },
  ];

  const profile = [
    { label: "NPP", value: user?.npp ?? session.npp, icon: IdentificationCardIcon },
    { label: "Jabatan", value: user?.nama_jabatan ?? "—", icon: BriefcaseIcon },
    { label: "Unit Kerja", value: user?.unit_kerja ?? "—", icon: BuildingsIcon },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            {greeting()}, {session.nama}
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Selamat datang di Sistem Aplikasi Dialog Kinerja Biro SDM KPK.
          </p>
        </div>
        <RoleTag role={session.role} />
      </header>

      {/* Profil Pegawai */}
      <section aria-label="Ringkasan profil" className="rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline px-6 py-4">
          <h2 className="text-sm font-semibold text-ink">Data Kepegawaian</h2>
        </div>
        <dl className="grid gap-6 px-6 py-5 sm:grid-cols-3">
          {profile.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                <Icon size={18} weight="bold" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                  {label}
                </dt>
                <dd className="truncate text-sm font-medium text-ink">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Overview Cards */}
      <section aria-label="Ringkasan dialog kinerja" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Status Dialog Kinerja</h2>
          <Link
            href="/pegawai/dialog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
          >
            Lihat Halaman Dialog Kinerja Saya
            <ArrowRightIcon size={14} weight="bold" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ key, label, count, icon: Icon, className }) => (
            <Link
              key={key}
              href={`/pegawai/dialog?status=${key}`}
              aria-label={`Lihat dialog berstatus ${label}`}
              className="flex items-center gap-3 rounded-lg border border-outline bg-surface px-5 py-4 transition-colors hover:border-outline-strong hover:shadow-ambient"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${className}`}
              >
                <Icon size={20} weight="bold" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-2xl font-semibold leading-8 text-ink">
                  {count}
                </span>
                <span className="truncate text-xs font-medium text-ink-muted">
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>
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
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ClipboardTextIcon size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              Semua tugas telah diselesaikan
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Tidak ada dialog kinerja yang membutuhkan tindakan pengisian atau validasi dari Anda saat ini.
            </p>
            <Link
              href="/pegawai/dialog"
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-outline px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-muted"
            >
              Buka Semua Dialog Kinerja Saya
            </Link>
          </div>
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
                          Dialog Kinerja Tahun {d.periode_tahun}
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
    </div>
  );
}
