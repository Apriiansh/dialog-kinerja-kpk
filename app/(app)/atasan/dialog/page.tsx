import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr";
import {
  CheckCircleIcon,
  HourglassIcon,
  PencilSimpleIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { DialogList } from "@/components/dialog/list";
import { DialogFilterBar } from "@/components/dialog/dialog-filter-bar";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";
import { getDialogSequenceMap } from "@/lib/queries/dialog";
import type { StatusDialog } from "@/generated/prisma/enums";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VALID_STATUSES: StatusDialog[] = [
  "draft",
  "menunggu_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
  "selesai",
];

export default async function DialogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ATASAN");
  const sp = await searchParams;
  const { page, skip, existingParams } = getPageParams(sp, ["q", "tahun", "triwulan", "status"]);

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tahun = typeof sp.tahun === "string" ? sp.tahun.trim() : "";
  const triwulan = typeof sp.triwulan === "string" ? sp.triwulan.trim() : "";
  const activeStatus: StatusDialog | "semua" =
    typeof sp.status === "string" && (VALID_STATUSES as string[]).includes(sp.status)
      ? (sp.status as StatusDialog)
      : "semua";

  const where: Record<string, unknown> = { id_atasan: session.id };
  if (activeStatus !== "semua") {
    where.status = activeStatus;
  }
  if (tahun) {
    where.periode_tahun = Number(tahun);
  }
  if (triwulan) {
    where.triwulan = triwulan;
  }
  if (q) {
    where.pegawai = {
      OR: [
        { nama_pegawai: { contains: q } },
        { npp: { contains: q } },
        { nama_jabatan: { contains: q } },
      ],
    };
  }

  const [dialogs, statusCounts, total, allDialogsForYears] = await Promise.all([
    prisma.dialogKinerja.findMany({
      where,
      select: {
        id: true,
        periode_tahun: true,
        triwulan: true,
        status: true,
        is_valid_pegawai: true,
        is_valid_atasan: true,
        id_dialog_induk: true,
        dialog_induk: { select: { periode_tahun: true, triwulan: true } },
        dialog_lanjutan: { select: { id: true } },
        reviu: {
          select: { status: true, is_tercapai: true, is_tidak_tercapai: true },
          orderBy: { created_at: "asc" as const },
        },
        aspek: {
          select: {
            tanggung_jawab_pegawai: true,
            item: { select: { id: true, is_tercapai: true } },
          },
        },
        pegawai: {
          select: {
            id: true,
            npp: true,
            nama_pegawai: true,
            nama_jabatan: true,
            unit_kerja: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.dialogKinerja.groupBy({
      by: ["status"],
      where: { id_atasan: session.id },
      _count: { _all: true },
    }),
    prisma.dialogKinerja.count({ where }),
    prisma.dialogKinerja.findMany({
      where: { id_atasan: session.id },
      select: { periode_tahun: true },
      distinct: ["periode_tahun"],
    }),
  ]);

  const dialogIds = dialogs.map((d) => d.id);
  const seqMap = await getDialogSequenceMap(dialogIds);
  const dialogsWithSeq = dialogs.map((d) => ({
    ...d,
    sequence_number: seqMap.get(d.id),
  }));

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const availableYears = allDialogsForYears.map((d) => d.periode_tahun).sort((a, b) => b - a);

  const countByStatus = (status: StatusDialog) =>
    statusCounts.find((s) => s.status === status)?._count._all ?? 0;
  const allTotal = statusCounts.reduce((sum, s) => sum + s._count._all, 0);

  const stats: {
    key: StatusDialog | "semua";
    label: string;
    count: number;
    icon: typeof PencilSimpleIcon;
    className: string;
  }[] = [
    {
      key: "semua",
      label: "Semua",
      count: allTotal,
      icon: ChartLineUpIcon,
      className: "bg-surface-soft text-primary",
    },
    {
      key: "draft",
      label: "Pengajuan / Draft",
      count: countByStatus("draft"),
      icon: PencilSimpleIcon,
      className: "bg-slate-100 text-slate-700",
    },
    {
      key: "selesai",
      label: "Selesai",
      count: countByStatus("selesai"),
      icon: CheckCircleIcon,
      className: "bg-status-green-soft text-status-green",
    },
    {
      key: "menunggu_pegawai",
      label: "Pegawai Melengkapi",
      count: countByStatus("menunggu_pegawai"),
      icon: HourglassIcon,
      className: "bg-status-amber-soft text-status-amber",
    },
    {
      key: "menunggu_atasan",
      label: "Atasan Memvalidasi",
      count: countByStatus("menunggu_atasan"),
      icon: CheckCircleIcon,
      className: "bg-status-blue-soft text-status-blue",
    },
    {
      key: "menunggu_validasi",
      label: "Validasi Akhir",
      count: countByStatus("menunggu_validasi"),
      icon: SealCheckIcon,
      className: "bg-status-indigo-soft text-status-indigo",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Dialog Kinerja Pegawai
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Daftar dialog kinerja pegawai beserta status prosesnya.
          </p>
        </div>
      </header>

      {/* Stats by Status */}
      <section aria-label="Ringkasan status dialog" className="grid grid-cols-3 gap-3">
        {stats.map(({ key, label, count, icon: Icon, className }) => {
          const active = key === activeStatus;
          return (
            <Link
              key={key}
              href={key === "semua" ? "/atasan/dialog" : `/atasan/dialog?status=${key}`}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg border bg-surface px-4 py-3 transition-all hover:border-outline-strong hover:shadow-ambient ${active ? "border-primary ring-1 ring-primary/20" : "border-outline"}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${className}`}>
                <Icon size={18} weight="bold" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-xl font-semibold leading-6 text-ink">{count}</span>
                <span className="truncate text-xs font-medium text-ink-muted">{label}</span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Filter & Search Bar */}
      <DialogFilterBar
        q={q}
        tahun={tahun}
        triwulan={triwulan}
        availableYears={availableYears}
        resetHref="/atasan/dialog"
      />

      {dialogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ChartLineUpIcon size={22} weight="bold" />
          </span>
          <h2 className="text-base font-semibold text-ink">
            Belum ada dialog kinerja yang cocok
          </h2>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            {q || tahun || triwulan || activeStatus !== "semua"
              ? "Coba ubah filter atau kata kunci pencarian Anda."
              : "Mulai dialog kinerja baru menggunakan tombol Mulai Dialog untuk pegawai Anda."}
          </p>
        </div>
      ) : (
        <DialogList dialogs={dialogsWithSeq} />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        basePath="/atasan/dialog"
        existingParams={existingParams}
      />
    </div>
  );
}
