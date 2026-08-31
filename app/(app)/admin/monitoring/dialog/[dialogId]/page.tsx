import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, EyeIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { CapaianBadge } from "@/components/shared/capaian-badge";
import { DialogSummary } from "@/components/dialog/summary";
import { ReviuList } from "@/components/reviu/list";
import { Separator } from "@/components/ui/separator";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { formatPeriode } from "@/lib/constants/triwulan";
import { countFilledAspek } from "@/lib/utils/capaian";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ dialogId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { dialogId } = await params;
  return { title: `Detail Dialog #${dialogId} - Monitoring Admin` };
}

export default async function AdminDialogDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { dialogId } = await params;
  const sp = await searchParams;
  const cetak = sp?.cetak === "1";
  await requireRole("ADMIN");

  const idNum = Number(dialogId);
  if (Number.isNaN(idNum)) notFound();

  const dialog = await prisma.dialogKinerja.findUnique({
    where: { id: idNum },
    include: {
      pegawai: {
        select: { id: true, npp: true, nama_pegawai: true, nama_jabatan: true, unit_kerja: true },
      },
      atasan: {
        select: { id: true, npp: true, nama_pegawai: true, nama_jabatan: true, unit_kerja: true },
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
    where: { id_pegawai: dialog.pegawai.id, id: { lte: idNum } },
  });

  const filledCount = countFilledAspek(dialog.aspek);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href={`/admin/monitoring/${dialog.pegawai.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Kembali ke Riwayat Dialog Pegawai
        </Link>

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                Dialog Kinerja Ke-{sequenceNum} ({formatPeriode(dialog.triwulan, dialog.periode_tahun)})
              </h1>
              <p className="text-sm leading-5 text-ink-muted">
                Pegawai: <strong className="text-ink">{dialog.pegawai.nama_pegawai}</strong> (NPP: {dialog.pegawai.npp})
                {dialog.pegawai.nama_jabatan ? ` · ${dialog.pegawai.nama_jabatan}` : ""}
              </p>
              <p className="text-sm leading-5 text-ink-muted">
                Atasan Penilai: <strong className="text-ink">{dialog.atasan.nama_pegawai}</strong> ({dialog.atasan.npp})
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
                <EyeIcon size={14} weight="bold" />
                Read-only Admin
              </span>
              <StatusBadge status={dialog.status} />
              <CapaianBadge
                statusDialog={dialog.status}
                filledAspekCount={filledCount}
                reviu={dialog.reviu.at(-1)}
                items={dialog.aspek.flatMap((a) => a.item)}
              />
              {dialog.id_dialog_induk ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Dialog Lanjutan
                </span>
              ) : null}
              {dialog.status === "selesai" ? (
                <>
                  <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                  <UnduhWordLink href={`/api/unduh/dialog/${dialog.id}/docx`} />
                </>
              ) : null}
            </div>
          </div>

          {dialog.deskripsi_kinerja?.trim() ? (
            <div className="rounded-lg border border-outline bg-surface px-5 py-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
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

      {dialog.reviu.length > 0 ? (
        <section aria-label="Hasil Evaluasi Tindak Lanjut" className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-ink">Hasil Evaluasi Tindak Lanjut</h2>
          <ReviuList reviu={dialog.reviu} />
        </section>
      ) : null}
    </div>
  );
}
