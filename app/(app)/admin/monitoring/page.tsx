import { MonitorPlayIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminMonitoringPage() {
  await requireRole("ADMIN");

  const dialogs = await prisma.dialogKinerja.findMany({
    select: {
      id: true,
      periode_tahun: true,
      status: true,
      updated_at: true,
      pegawai: { select: { npp: true, nama_pegawai: true } },
      atasan: { select: { nama_pegawai: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  const selesai = dialogs.filter((d) => d.status === "selesai").length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
          Monitoring Dialog Kinerja
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          {selesai} dari {dialogs.length} dialog telah selesai. Klik dialog
          untuk melihat detail secara read-only.
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
            {dialogs.map((d) => (
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
                  <span className="text-sm text-ink">{d.periode_tahun}</span>
                  <span className="flex justify-start lg:justify-end">
                    <StatusBadge status={d.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}