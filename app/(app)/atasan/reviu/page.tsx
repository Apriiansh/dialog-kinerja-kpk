import Link from "next/link";
import {
  ArrowsClockwiseIcon,
  PencilSimpleIcon,
  HourglassIcon,
  SealCheckIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { REVIU_INCLUDE } from "@/lib/queries/reviu";
import { ReviuStatusBadge } from "@/components/reviu/status-badge";
import { TindakLanjutBadge } from "@/components/shared/tindak-lanjut-badge";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";
import type { StatusReviu } from "@/generated/prisma/enums";
import { formatPeriode } from "@/lib/constants/triwulan";
import { checkUpcomingReviuReminders } from "@/lib/actions/recurring-notifications";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "Reviu Dialog Kinerja - Dialog Kinerja KPK",
};

const VALID_STATUSES: StatusReviu[] = [
  "draft_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
  "selesai",
];

const FILTERS: { key: StatusReviu | "semua"; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "menunggu_atasan", label: "Menunggu Reviu Anda" },
  { key: "menunggu_validasi", label: "Menunggu Validasi" },
  { key: "selesai", label: "Selesai" },
];

export default async function AtasanReviuListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ATASAN");
  const sp = await searchParams;

  await checkUpcomingReviuReminders().catch(() => {});

  const rawStatus = typeof sp.status === "string" ? sp.status : undefined;
  const activeStatus: StatusReviu | "semua" =
    rawStatus && (VALID_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as StatusReviu)
      : "semua";
  const { page, skip, existingParams } = getPageParams(sp, ["status"]);

  const baseWhere = { dialog: { id_atasan: session.id } };
  const listWhere =
    activeStatus !== "semua"
      ? { ...baseWhere, status: activeStatus }
      : baseWhere;

  const [visible, total, draftCount, menungguAtasanCount, menungguValidasiCount, selesaiCount] =
    await Promise.all([
      prisma.reviu.findMany({
        where: listWhere,
        include: REVIU_INCLUDE,
        orderBy: { created_at: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.reviu.count({ where: listWhere }),
      prisma.reviu.count({ where: { ...baseWhere, status: "draft_pegawai" } }),
      prisma.reviu.count({ where: { ...baseWhere, status: "menunggu_atasan" } }),
      prisma.reviu.count({ where: { ...baseWhere, status: "menunggu_validasi" } }),
      prisma.reviu.count({ where: { ...baseWhere, status: "selesai" } }),
    ]);

  const allTotal = draftCount + menungguAtasanCount + menungguValidasiCount + selesaiCount;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const count = (status: StatusReviu) => {
    if (status === "draft_pegawai") return draftCount;
    if (status === "menunggu_atasan") return menungguAtasanCount;
    if (status === "menunggu_validasi") return menungguValidasiCount;
    return selesaiCount;
  };

  const stats = [
    {
      key: "draft_pegawai" as const,
      label: "Draft",
      count: count("draft_pegawai"),
      icon: PencilSimpleIcon,
      className: "bg-surface-soft text-primary",
    },
    {
      key: "menunggu_atasan" as const,
      label: "Menunggu Reviu Anda",
      count: count("menunggu_atasan"),
      icon: HourglassIcon,
      className: "bg-status-amber-soft text-status-amber",
    },
    {
      key: "menunggu_validasi" as const,
      label: "Menunggu Validasi",
      count: count("menunggu_validasi"),
      icon: SealCheckIcon,
      className: "bg-status-indigo-soft text-status-indigo",
    },
    {
      key: "selesai" as const,
      label: "Selesai",
      count: count("selesai"),
      icon: CheckCircleIcon,
      className: "bg-status-green-soft text-status-green",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
          Reviu Dialog Kinerja
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          Reviu hasil tindak lanjut yang diajukan pegawai setelah dialog
          kinerja selesai.
        </p>
      </header>

      <section aria-label="Ringkasan status reviu" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, label, count, icon: Icon, className }) => (
          <Link
            key={key}
            href={`/atasan/reviu?status=${key}`}
            className={`flex items-center gap-3.5 rounded-lg border bg-surface px-5 py-4 transition-all hover:border-outline-strong hover:shadow-ambient ${activeStatus === key
                ? "border-primary ring-1 ring-primary/20"
                : "border-outline"
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

      <section aria-label="Daftar reviu" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(({ key, label }) => {
              const active = key === activeStatus;
              return (
                <Link
                  key={key}
                  href={
                    key === "semua"
                      ? "/atasan/reviu"
                      : `/atasan/reviu?status=${key}`
                  }
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${active
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
            Menampilkan {total} dari {allTotal} reviu
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ArrowsClockwiseIcon size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              {activeStatus === "semua"
                ? "Belum ada reviu dialog kinerja"
                : `Tidak ada reviu berstatus "${FILTERS.find((f) => f.key === activeStatus)?.label}"`}
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Reviu yang diajukan pegawai akan tampil di sini untuk direviu
              dan ditandatangani.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((r) => {
              const isPending = r.status === "menunggu_atasan";
              return (
                <li key={r.id}>
                  <div className="flex flex-col gap-4 rounded-lg border border-outline bg-surface p-5 transition-colors hover:border-outline-strong hover:shadow-ambient sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-ink">
                          {r.dialog.pegawai.nama_pegawai}
                        </span>
                        <ReviuStatusBadge status={r.status} />
                        <TindakLanjutBadge
                          is_tercapai={r.is_tercapai}
                          is_tidak_tercapai={r.is_tidak_tercapai}
                        />
                      </div>
                      <span className="truncate text-xs leading-4 text-ink-muted">
                        Dialog Kinerja {formatPeriode(r.dialog.triwulan, r.dialog.periode_tahun)}
                        {r.dialog.pegawai.nama_jabatan
                          ? ` · ${r.dialog.pegawai.nama_jabatan}`
                          : ""}
                        {r.dialog.pegawai.unit_kerja
                          ? ` · ${r.dialog.pegawai.unit_kerja}`
                          : ""}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-outline/50 pt-3 sm:border-t-0 sm:pt-0">
                      <Link
                        href={`/atasan/dialog/${r.dialog.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors ${isPending
                            ? "bg-primary text-on-primary hover:bg-primary-strong shadow-xs"
                            : "border border-outline bg-white text-ink hover:border-outline-strong hover:bg-surface-muted"
                          }`}
                      >
                        {isPending ? "Reviu & Tandatangani" : "Lihat Dialog"}
                      </Link>
                      {r.status === "selesai" ? (
                        <>
                          <Link
                            href={`/atasan/reviu/${r.id}?cetak=1`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-outline bg-white px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
                          >
                            <DownloadSimpleIcon size={14} weight="bold" />
                            Unduh PDF
                          </Link>
                          <UnduhWordLink
                            href={`/api/unduh/reviu/${r.id}/docx`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-outline bg-white px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={allTotal}
        basePath="/atasan/reviu"
        existingParams={existingParams}
      />
    </div>
  );
}
