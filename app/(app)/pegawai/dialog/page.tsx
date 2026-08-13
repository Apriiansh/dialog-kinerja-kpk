import Link from "next/link";
import {
  CheckCircle,
  ClipboardText,
  Hourglass,
  PencilSimple,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import { UnduhBuktiLink } from "@/components/unduh-bukti-link";
import { ASPEK_ORDER } from "@/lib/aspek";
import type { StatusDialog } from "@/generated/prisma/enums";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "Dialog Kinerja Saya - Dialog Kinerja KPK",
};

const CTA: Record<
  StatusDialog,
  { label: string; href: (id: number) => string; variant: "primary" | "plain" }
> = {
  draft_atasan: {
    label: "Ditunggu Atasan",
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

const VALID_STATUSES: StatusDialog[] = [
  "draft_atasan",
  "menunggu_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
  "selesai",
];

const FILTERS: { key: StatusDialog | "semua"; label: string }[] = [
  { key: "semua", label: "Semua Dialog" },
  { key: "menunggu_pegawai", label: "Perlu Diisi" },
  { key: "menunggu_atasan", label: "Menunggu Atasan" },
  { key: "menunggu_validasi", label: "Menunggu Validasi" },
  { key: "selesai", label: "Selesai" },
];

function filledAspekCount(
  aspek: { tanggung_jawab_pegawai: string | null; item: { id: number }[] }[],
) {
  return aspek.filter(
    (a) =>
      (a.tanggung_jawab_pegawai?.trim() ?? "") !== "" || a.item.length > 0,
  ).length;
}

export default async function PegawaiDialogListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("PEGAWAI");
  const sp = await searchParams;
  const rawStatus = typeof sp.status === "string" ? sp.status : undefined;
  const activeStatus: StatusDialog | "semua" =
    rawStatus && (VALID_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as StatusDialog)
      : "semua";

  const dialogs = await prisma.dialogKinerja.findMany({
    where: { id_pegawai: session.id },
    include: {
      atasan: { select: { nama_pegawai: true, nama_jabatan: true } },
      aspek: {
        include: { item: { select: { id: true } } },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  const visibleDialogs =
    activeStatus === "semua"
      ? dialogs
      : dialogs.filter((d) => d.status === activeStatus);

  const stats = [
    {
      key: "menunggu_pegawai" as const,
      label: "Perlu Diisi",
      count: dialogs.filter((d) => d.status === "menunggu_pegawai").length,
      icon: PencilSimple,
      className: "bg-status-amber-soft text-status-amber",
    },
    {
      key: "menunggu_atasan" as const,
      label: "Menunggu Atasan",
      count: dialogs.filter((d) => d.status === "menunggu_atasan").length,
      icon: Hourglass,
      className: "bg-status-blue-soft text-status-blue",
    },
    {
      key: "menunggu_validasi" as const,
      label: "Menunggu Validasi",
      count: dialogs.filter((d) => d.status === "menunggu_validasi").length,
      icon: ShieldCheck,
      className: "bg-status-indigo-soft text-status-indigo",
    },
    {
      key: "selesai" as const,
      label: "Selesai",
      count: dialogs.filter((d) => d.status === "selesai").length,
      icon: CheckCircle,
      className: "bg-status-green-soft text-status-green",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Dialog Kinerja Saya
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Daftar lengkap dokumen dialog kinerja periode berjalan dan riwayat evaluasi Anda.
          </p>
        </div>
      </header>

      {/* Stats Summary Banner */}
      <section aria-label="Ringkasan status dialog" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, label, count, icon: Icon, className }) => (
          <Link
            key={key}
            href={`/pegawai/dialog?status=${key}`}
            className={`flex items-center gap-3.5 rounded-lg border bg-surface px-5 py-4 transition-all hover:border-outline-strong hover:shadow-ambient ${
              activeStatus === key ? "border-primary ring-1 ring-primary/20" : "border-outline"
            }`}
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
      </section>

      {/* In-Page Filter Tabs & List */}
      <section aria-label="Daftar dialog kinerja" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(({ key, label }) => {
              const active = key === activeStatus;
              return (
                <Link
                  key={key}
                  href={
                    key === "semua"
                      ? "/pegawai/dialog"
                      : `/pegawai/dialog?status=${key}`
                  }
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-primary text-on-primary shadow-xs"
                      : "border border-outline text-ink-muted hover:border-primary hover:text-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <span className="text-xs font-medium text-ink-muted">
            Menampilkan {visibleDialogs.length} dari {dialogs.length} dialog
          </span>
        </div>

        {visibleDialogs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ClipboardText size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              {activeStatus === "semua"
                ? "Belum ada dialog kinerja"
                : `Tidak ada dialog berstatus "${FILTERS.find((f) => f.key === activeStatus)?.label}"`}
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              {activeStatus === "semua"
                ? "Dokumen dialog kinerja yang telah diinisiasi oleh atasan Anda akan ditampilkan di sini."
                : "Coba pilih tab filter lainnya untuk melihat daftar dialog."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visibleDialogs.map((d) => {
              const filled = filledAspekCount(d.aspek);
              const cta = CTA[d.status];
              const progress = Math.round((filled / ASPEK_ORDER.length) * 100);
              return (
                <li key={d.id}>
                  <div className="flex flex-col gap-4 rounded-lg border border-outline bg-surface p-5 transition-colors hover:border-outline-strong hover:shadow-ambient sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-ink">
                          Dialog Kinerja Tahun {d.periode_tahun}
                        </span>
                        <StatusBadge status={d.status} />
                      </div>
                      <span className="truncate text-xs leading-4 text-ink-muted">
                        Atasan Penilai: <strong className="font-medium text-ink">{d.atasan.nama_pegawai}</strong>
                        {d.atasan.nama_jabatan ? ` (${d.atasan.nama_jabatan})` : ""}
                      </span>
                      <div className="mt-1 flex items-center gap-3">
                        <div
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="h-2 w-36 overflow-hidden rounded-full bg-surface-soft"
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-ink-muted">
                          {filled}/{ASPEK_ORDER.length} aspek terisi ({progress}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline/50 pt-3 sm:border-t-0 sm:pt-0">
                      {d.status === "selesai" ? (
                        <UnduhBuktiLink
                          path="/pegawai/dialog"
                          dialogId={d.id}
                          className="inline-flex items-center gap-2 rounded-md border border-outline bg-white px-4 py-2 text-xs font-semibold text-ink hover:border-outline-strong hover:bg-surface-muted"
                        />
                      ) : null}
                      <Link
                        href={cta.href(d.id)}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
                          cta.variant === "primary"
                            ? "bg-primary text-on-primary hover:bg-primary-strong shadow-xs"
                            : "border border-outline bg-white text-ink hover:border-outline-strong hover:bg-surface-muted"
                        }`}
                      >
                        {cta.label}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
