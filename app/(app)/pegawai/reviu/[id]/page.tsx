import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { canValidateReviu, getPegawaiReviu } from "@/lib/queries/reviu";
import { ReviuStatusBadge } from "@/components/reviu/status-badge";
import { ReviuSummary } from "@/components/reviu/summary";
import { ReviuSignForm } from "@/components/reviu/sign-form";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { Separator } from "@/components/ui/separator";
import { FormulirReviu } from "@/components/reviu/detail-view";
import { DeleteReviuButton } from "@/components/reviu/delete-button";
import { InitiateDialogButton } from "@/components/dialog/initiate-button";
import { CapaianBadge } from "@/components/shared/capaian-badge";
import { formatPeriode } from "@/lib/constants/triwulan";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Reviu #${id}` };
}

export default async function PegawaiReviuDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const cetak = sp?.cetak === "1";
  const session = await requireRole("PEGAWAI");

  const reviuId = Number(id);
  if (Number.isNaN(reviuId)) notFound();

  const reviu = await getPegawaiReviu(reviuId, session.id);
  if (!reviu) notFound();

  const isDraft = reviu.status === "draft_pegawai";
  const isSelesai = reviu.status === "selesai";
  const showEvaluasiLanjutan =
    isSelesai && reviu.dialog.status === "selesai";
  const showValidation =
    canValidateReviu(reviu.status) && !reviu.is_valid_pegawai;

  return (
    <div className="flex flex-col gap-8">
      <div className={`flex flex-col gap-8 ${isSelesai ? "print:hidden" : ""}`}>
        <div className="flex flex-col gap-4">
          <Link
            href="/pegawai/reviu"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={16} weight="bold" />
            Kembali ke Reviu
          </Link>

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                  Hasil Evaluasi Kinerja {formatPeriode(reviu.dialog.triwulan, reviu.dialog.periode_tahun)}
                </h1>
                <p className="text-sm leading-5 text-ink-muted">
                  Atasan: {reviu.dialog.atasan.nama_pegawai}
                  {reviu.dialog.atasan.nama_jabatan
                    ? ` (${reviu.dialog.atasan.nama_jabatan})`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ReviuStatusBadge status={reviu.status} />
                <CapaianBadge
                  statusDialog={reviu.dialog.status}
                  filledAspekCount={5}
                  reviu={{
                    status: reviu.status,
                    is_tercapai: reviu.is_tercapai,
                    is_tidak_tercapai: reviu.is_tidak_tercapai,
                  }}
                  items={reviu.dialog.aspek.flatMap((a) => a.item)}
                />
                {reviu.dialog.id_dialog_induk ? (
                  <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    Dialog Lanjutan
                  </span>
                ) : null}
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton label="Unduh PDF" autoPrint={cetak} />
                    <UnduhWordLink href={`/api/unduh/reviu/${reviu.id}/docx`} />
                    {showEvaluasiLanjutan ? (
                      <InitiateDialogButton
                        parentDialogId={reviu.dialog.id}
                        parentPeriodeLabel={formatPeriode(reviu.dialog.triwulan, reviu.dialog.periode_tahun)}
                        label="Ajukan Dialog Lanjutan"
                        variant="outline"
                        size="sm"
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {isDraft ? (
              <div className="flex flex-col gap-2 rounded-lg border border-outline bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-5 text-ink-muted">
                  Reviu masih berupa draft dan belum dikirim ke atasan. Lengkapi
                  isian lalu kirim untuk mendapat persetujuan atasan.
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/pegawai/reviu/${reviu.id}/edit`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                  >
                    <PencilSimpleIcon size={16} weight="bold" />
                    Edit Reviu
                  </Link>
                  <DeleteReviuButton reviuId={reviu.id} />
                </div>
              </div>
            ) : null}
            {reviu.status === "menunggu_atasan" ? (
              <p className="text-sm leading-5 text-ink-muted">
                Reviu telah dikirim dan menunggu reviu serta tanda tangan
                atasan.
              </p>
            ) : null}
            {reviu.status === "menunggu_validasi" ? (
              <p className="text-sm leading-5 text-ink-muted">
                Reviu atasan telah selesai. Lakukan persetujuan dan tanda
                tangan di bawah untuk menyelesaikan reviu.
              </p>
            ) : null}
            {isSelesai ? (
              <p className="text-sm leading-5 text-ink-muted">
                Reviu telah selesai ditandatangani oleh atasan dan pegawai.
              </p>
            ) : null}
          </header>
        </div>

        <ReviuSummary reviu={reviu} />

        <Separator />

        {showValidation ? (
          <ReviuSignForm reviuId={reviu.id} role="pegawai" />
        ) : null}
      </div>

      {isSelesai ? <FormulirReviu reviu={reviu} /> : null}
    </div>
  );
}
