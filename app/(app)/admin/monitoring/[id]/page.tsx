import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, EyeIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { DialogSummary } from "@/components/dialog/summary";
import { ReviuList } from "@/components/reviu/list";
import { Separator } from "@/components/ui/separator";
import { formatPeriode } from "@/lib/constants/triwulan";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Monitoring Dialog #${id}` };
}

export default async function AdminMonitoringDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  await requireRole("ADMIN");

  const dialogId = Number(id);
  if (Number.isNaN(dialogId)) notFound();

  const dialog = await prisma.dialogKinerja.findUnique({
    where: { id: dialogId },
    include: {
      pegawai: {
        select: { id: true, npp: true, nama_pegawai: true, nama_jabatan: true },
      },
      atasan: {
        select: { npp: true, nama_pegawai: true, nama_jabatan: true },
      },
      aspek: { include: { item: { include: { metode: true } } } },
      dialog_induk: {
        include: { aspek: { include: { item: { include: { metode: true } } } } },
      },
      reviu: {
        orderBy: { created_at: "asc" as const },
      },
    },
  });
  if (!dialog) notFound();

  const sequenceNum = await prisma.dialogKinerja.count({
    where: { id_pegawai: dialog.pegawai.id, id: { lte: dialogId } },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/monitoring"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Kembali ke Monitoring
        </Link>

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                  Dialog Kinerja Ke-{sequenceNum} ({formatPeriode(dialog.triwulan, dialog.periode_tahun)})
                </h1>
              <p className="text-sm leading-5 text-ink-muted">
                Pegawai: {dialog.pegawai.nama_pegawai} (
                {dialog.pegawai.npp})
                {dialog.pegawai.nama_jabatan
                  ? ` · ${dialog.pegawai.nama_jabatan}`
                  : ""}
              </p>
              <p className="text-sm leading-5 text-ink-muted">
                Atasan: {dialog.atasan.nama_pegawai} ({dialog.atasan.npp})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
                <EyeIcon size={14} weight="bold" />
                Read-only
              </span>
              <StatusBadge status={dialog.status} />
              {dialog.id_dialog_induk ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Dialog Lanjutan
                </span>
              ) : null}
            </div>
          </div>

          {dialog.deskripsi_kinerja?.trim() ? (
            <div className="rounded-lg border border-outline bg-surface px-5 py-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Deskripsi Kinerja (dari Atasan)
              </span>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-ink">
                {dialog.deskripsi_kinerja}
              </p> 
            </div>
          ) : null}
        </header>
      </div>

      <section aria-label="Aspek dialog kinerja">
        <DialogSummary
          aspek={dialog.aspek}
          isLanjutan={dialog.id_dialog_induk !== null}
          previousItems={dialog.dialog_induk?.aspek.flatMap((aspek) => aspek.item)}
        />
      </section>

      <Separator />
      
      {dialog.reviu.length > 0 ? <ReviuList reviu={dialog.reviu} /> : null}
    </div>
  );
}