import { MonitorPlayIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";
import { formatPeriode } from "@/lib/constants/triwulan";

import { getDialogSequenceMap } from "@/lib/queries/dialog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMonitoringPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const { page, skip, existingParams } = getPageParams(sp);

  const where = {};

  const [dialogs, total, selesaiCount] = await Promise.all([
    prisma.dialogKinerja.findMany({
      where,
      select: {
        id: true,
        id_pegawai: true,
        periode_tahun: true,
        triwulan: true,
        status: true,
        id_dialog_induk: true,
        dialog_induk: { select: { periode_tahun: true, triwulan: true } },
        updated_at: true,
        pegawai: { select: { npp: true, nama_pegawai: true } },
        atasan: { select: { nama_pegawai: true } },
      },
      orderBy: { updated_at: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.dialogKinerja.count({ where }),
    prisma.dialogKinerja.count({ where: { status: "selesai" } }),
  ]);

  const dialogIds = dialogs.map((d) => d.id);
  const seqMap = await getDialogSequenceMap(dialogIds);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
          Monitoring Dialog Kinerja
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          {selesaiCount} dari {total} dialog telah selesai. Klik dialog untuk
          melihat detail secara read-only.
        </p>
      </header>

      {dialogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <MonitorPlayIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada dialog kinerja
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Dialog yang dibuat atasan akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <div className="hidden grid-cols-[1fr_160px_120px_120px] gap-4 border-b border-outline bg-surface-muted/60 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted lg:grid">
            <span>Pegawai</span>
            <span>Atasan</span>
            <span>Periode</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-outline">
            {dialogs.map((d) => {
              const seq = seqMap.get(d.id);
              return (
                <li key={d.id}>
                  <Link
                    href={`/admin/monitoring/${d.id}`}
                    className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-surface-muted/40 lg:grid lg:grid-cols-[1fr_160px_120px_120px] lg:items-center lg:gap-4"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-ink">
                        {d.pegawai?.nama_pegawai}
                      </span>
                      <span className="text-xs text-ink-muted">
                        NPP {d.pegawai?.npp}
                      </span>
                    </div>
                    <span className="truncate text-sm text-ink">
                      {d.atasan?.nama_pegawai ?? "—"}
                    </span>
                    <span className="flex flex-col gap-1 text-sm text-ink">
                      <span>
                        {seq ? `Dialog Ke-${seq} ` : ""}
                        {formatPeriode(d.triwulan, d.periode_tahun)}
                      </span>
                      {d.dialog_induk ? (
                        <span className="w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Lanjutan dari {formatPeriode(d.dialog_induk.triwulan, d.dialog_induk.periode_tahun)}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex justify-start lg:justify-end">
                      <StatusBadge status={d.status} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        basePath="/admin/monitoring"
        existingParams={existingParams}
      />
    </div>
  );
}
