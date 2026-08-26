import Link from "next/link";
import {
  CheckCircleIcon,
  ClipboardTextIcon,
  HourglassIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";
import { formatPeriode } from "@/lib/constants/triwulan";
import type { StatusDialog } from "@/generated/prisma/enums";
import { CapaianBadge } from "@/components/shared/capaian-badge";
import { EvaluasiLanjutanButton } from "@/components/reviu/lanjutan-button";

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
  { key: "semua", label: "Semua" },
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

function evaluatedAspekCount(
  aspek: { item: { is_tercapai: boolean | null }[] }[],
) {
  return aspek.filter(
    (group) =>
      group.item.length === 0 ||
      group.item.every((item) => item.is_tercapai !== null),
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
  const { page, skip, existingParams } = getPageParams(sp, ["status", "q", "tahun", "triwulan"]);

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tahun = typeof sp.tahun === "string" ? sp.tahun.trim() : "";
  const triwulan = typeof sp.triwulan === "string" ? sp.triwulan.trim() : "";

  const baseWhere = { id_pegawai: session.id };

  const [allDialogs, menungguAtasanCount, menungguValidasiCount, selesaiCount] =
    await Promise.all([
      prisma.dialogKinerja.findMany({
        where: baseWhere,
        include: {
          atasan: { select: { nama_pegawai: true, nama_jabatan: true } },
          aspek: {
            include: {
              item: {
                select: {
                  id: true,
                  is_tercapai: true,
                  dialog_evaluasi: true,
                },
              },
            },
          },
          dialog_induk: {
            select: {
              periode_tahun: true,
              triwulan: true,
              aspek: { select: { item: { select: { is_tercapai: true } } } },
            },
          },
          dialog_lanjutan: { select: { id: true } },
          reviu: {
            select: { id: true, status: true, is_tercapai: true, is_tidak_tercapai: true, dialog: { select: { id: true } } },
            orderBy: { created_at: "asc" as const },
          },
        },
        orderBy: { updated_at: "desc" },
      }),
      prisma.dialogKinerja.count({ where: { ...baseWhere, status: "menunggu_atasan" } }),
      prisma.dialogKinerja.count({ where: { ...baseWhere, status: "menunggu_validasi" } }),
      prisma.dialogKinerja.count({ where: { ...baseWhere, status: "selesai" } }),
    ]);

  const allTotal = allDialogs.length;
  const menungguPegawaiCount = allDialogs.filter((d) => d.status === "menunggu_pegawai").length;

  const availableYears = [...new Set(allDialogs.map((d) => d.periode_tahun))].sort((a, b) => b - a);

  const filteredDialogs = allDialogs.filter((d) => {
    if (activeStatus !== "semua" && d.status !== activeStatus) return false;
    if (tahun && String(d.periode_tahun) !== tahun) return false;
    if (triwulan && d.triwulan !== triwulan) return false;
    if (q) {
      const query = q.toLowerCase();
      const matchTahun = String(d.periode_tahun).includes(query);
      const matchTW = d.triwulan.toLowerCase().includes(query);
      const matchItems = d.aspek.some(
        (a) =>
          a.item.some((item) =>
            (item.dialog_evaluasi?.toLowerCase() ?? "").includes(query),
          ) || (a.tanggung_jawab_pegawai?.toLowerCase() ?? "").includes(query),
      );
      if (!matchTahun && !matchTW && !matchItems) return false;
    }
    return true;
  });

  const filteredTotal = filteredDialogs.length;
  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE);
  const visibleDialogs = filteredDialogs.slice(skip, skip + PAGE_SIZE);

  const sortedById = [...allDialogs].sort((a, b) => a.id - b.id);
  const seqMap = new Map(sortedById.map((d, index) => [d.id, index + 1]));

  const stats = [
    {
      key: "menunggu_pegawai" as const,
      label: "Perlu Diisi",
      count: menungguPegawaiCount,
      icon: PencilSimpleIcon,
      className: "bg-status-amber-soft text-status-amber",
    },
    {
      key: "menunggu_atasan" as const,
      label: "Menunggu Atasan",
      count: menungguAtasanCount,
      icon: HourglassIcon,
      className: "bg-status-blue-soft text-status-blue",
    },
    {
      key: "menunggu_validasi" as const,
      label: "Menunggu Validasi",
      count: menungguValidasiCount,
      icon: ShieldCheckIcon,
      className: "bg-status-indigo-soft text-status-indigo",
    },
    {
      key: "selesai" as const,
      label: "Selesai",
      count: selesaiCount,
      icon: CheckCircleIcon,
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
            className={`flex items-center gap-3.5 rounded-lg border bg-surface px-5 py-4 transition-all hover:border-outline-strong hover:shadow-ambient ${activeStatus === key ? "border-primary ring-1 ring-primary/20" : "border-outline"
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
              <span className="text-xs font-medium text-ink-muted">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Filter & Search Bar */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari berdasarkan target kegiatan atau kata kunci..."
            className="h-10 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeStatus !== "semua" ? (
            <input type="hidden" name="status" value={activeStatus} />
          ) : null}
          <select
            name="tahun"
            defaultValue={tahun}
            className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
          <select
            name="triwulan"
            defaultValue={triwulan}
            className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
          >
            <option value="">Semua Periode</option>
            <option value="TW1">Triwulan I (Perencanaan & Evaluasi)</option>
            <option value="TW3">Triwulan III (Monitoring Progres)</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            Terapkan
          </button>
          {q || tahun || triwulan ? (
            <Link
              href={activeStatus !== "semua" ? `/pegawai/dialog?status=${activeStatus}` : "/pegawai/dialog"}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

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
            Menampilkan {filteredTotal} dari {allTotal} dialog
          </span>
        </div>

        {visibleDialogs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ClipboardTextIcon size={22} weight="bold" />
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
              const isLanjutan = d.id_dialog_induk !== null;
              const cta = CTA[d.status];
              const sourceAspek = isLanjutan
                ? (d.dialog_induk?.aspek ?? [])
                : d.aspek;
              const itemCounts = d.aspek.reduce(
                    (counts, group) => {
                      for (const item of group.item) {
                        if (item.is_tercapai === true) counts.tercapai += 1;
                        else if (item.is_tercapai === false) counts.tidakTercapai += 1;
                      }
                      return counts;
                    },
                    { tercapai: 0, tidakTercapai: 0 },
                  );
              const latestSelesaiReviu = d.reviu
                .filter((reviu) => reviu.status === "selesai")
                .at(-1);
              const hasLanjutan = d.dialog_lanjutan.length > 0;
              const hasBelumTercapai = d.aspek.some((aspek) =>
                aspek.item.some((item) => item.is_tercapai === false),
              );
              const sequenceNum = seqMap.get(d.id) ?? 1;
              return (
                <li key={d.id}>
                  <div className="flex flex-col gap-2 rounded-lg border border-outline bg-surface p-5 transition-colors hover:border-outline-strong hover:shadow-ambient sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-ink">
                          Dialog Kinerja Ke-{sequenceNum} ({formatPeriode(d.triwulan, d.periode_tahun)})
                        </span>
                        <StatusBadge status={d.status} />
                        {d.dialog_induk ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            Lanjutan dari {formatPeriode(d.dialog_induk.triwulan, d.dialog_induk.periode_tahun)}
                          </span>
                        ) : null}
                      </div>
                      <span className="truncate text-xs leading-4 text-ink-muted">
                        Atasan Penilai: <strong className="font-medium text-ink">{d.atasan.nama_pegawai}</strong>
                        {d.atasan.nama_jabatan ? ` (${d.atasan.nama_jabatan})` : ""}
                      </span>
                      <div className="mt-1 flex items-center gap-3">
                        <CapaianBadge
                          statusDialog={d.status}
                          filledAspekCount={filledAspekCount(d.aspek)}
                          reviu={isLanjutan ? null : d.reviu.at(-1)}
                          items={sourceAspek.flatMap((a) => a.item)}
                        />
                      </div>
                      {(itemCounts.tercapai > 0 || itemCounts.tidakTercapai > 0) ? (
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                          <span className="text-emerald-700">
                            {itemCounts.tercapai} tercapai
                          </span>
                          <span className="text-red-700">
                            {itemCounts.tidakTercapai} tidak tercapai
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-outline/50 pt-3 sm:border-t-0 sm:pt-0">
                      {d.status === "selesai" ? (
                        <>
                           {latestSelesaiReviu && !hasLanjutan ? (
                             <EvaluasiLanjutanButton
                               reviuId={latestSelesaiReviu.id}
                               label={hasBelumTercapai ? 'Evaluasi Lanjutan' : 'Ajukan Evaluasi'}
                             />
                           ) : null}
                           {d.reviu.length === 0 ? (
                             <Link
                               href={`/pegawai/reviu/new?dialog=${d.id}`}
                               className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                             >
                               Buat Reviu
                             </Link>
                           ) : null}
                        </>
                      ) : null}
                      <Link
                        href={cta.href(d.id)}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${cta.variant === "primary"
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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={allTotal}
        basePath="/pegawai/dialog"
        existingParams={existingParams}
      />
    </div>
  );
}
