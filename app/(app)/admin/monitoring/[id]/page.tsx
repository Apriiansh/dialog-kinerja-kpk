import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import { DialogSummary } from "@/components/dialog-summary";
import { ReviuList } from "@/components/reviu-list";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Monitoring Dialog #${id}` };
}

function TtdImage({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
        {alt}
      </span>
      <div className="w-56 overflow-hidden rounded-md border border-outline bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="h-28 w-full object-contain" />
      </div>
    </div>
  );
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
        select: { npp: true, nama_pegawai: true, nama_jabatan: true },
      },
      atasan: {
        select: { npp: true, nama_pegawai: true, nama_jabatan: true },
      },
      aspek: { include: { item: { include: { metode: true } } } },
      reviu: {
        orderBy: { created_at: "asc" as const },
      },
    },
  });
  if (!dialog) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/monitoring"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          Kembali ke Monitoring
        </Link>

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                Dialog Kinerja Tahun {dialog.periode_tahun}
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
                <Eye size={14} weight="bold" />
                Read-only
              </span>
              <StatusBadge status={dialog.status} />
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
        <DialogSummary aspek={dialog.aspek} />
      </section>

      <Separator />
      
      {dialog.reviu.length > 0 ? <ReviuList reviu={dialog.reviu} /> : null}

      {dialog.ttd_pegawai_path || dialog.ttd_atasan_path ? (
        <section
          aria-label="Tanda tangan"
          className="flex flex-col gap-4 rounded-lg border border-outline bg-surface px-5 py-4"
        >
          <h2 className="text-sm font-semibold text-ink">Tanda Tangan</h2>
          <div className="flex flex-wrap gap-6">
            {dialog.ttd_pegawai_path ? (
              <TtdImage url={dialog.ttd_pegawai_path} alt="Tanda tangan pegawai" />
            ) : null}
            {dialog.ttd_atasan_path ? (
              <TtdImage url={dialog.ttd_atasan_path} alt="Tanda tangan atasan" />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}