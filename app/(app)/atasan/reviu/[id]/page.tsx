import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { getAtasanReviu } from "@/lib/queries/reviu";
import { ReviuStatusBadge } from "@/components/reviu/status-badge";
import { TindakLanjutBadge } from "@/components/shared/tindak-lanjut-badge";
import { ReviuSummary } from "@/components/reviu/summary";
import { ReviuSignForm } from "@/components/reviu/sign-form";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { Separator } from "@/components/ui/separator";
import { FormulirReviu } from "@/components/reviu/detail-view";
import { EvaluasiLanjutanButton } from "@/components/reviu/lanjutan-button";
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

export default async function AtasanReviuDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const cetak = sp?.cetak === "1";
  const session = await requireRole("ATASAN");

  const reviuId = Number(id);
  if (Number.isNaN(reviuId)) notFound();

  const reviu = await getAtasanReviu(reviuId, session.id);
  if (!reviu) notFound();

  const isSelesai = reviu.status === "selesai";
  const showEvaluasiLanjutan =
    isSelesai && reviu.dialog.status === "selesai";
  const isMenungguAtasan =
    reviu.status === "menunggu_atasan" && !reviu.is_valid_atasan;

  return (
    <div className="flex flex-col gap-8">
      <div className={`flex flex-col gap-8 ${isSelesai ? "print:hidden" : ""}`}>
        <div className="flex flex-col gap-4">
          <Link
            href="/atasan/reviu"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} weight="bold" />
            Kembali ke Tindak Lanjut
          </Link>

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                  Hasil Evaluasi Kinerja {formatPeriode(reviu.dialog.triwulan, reviu.dialog.periode_tahun)}
                </h1>
                <p className="text-sm leading-5 text-ink-muted">
                  Pegawai: {reviu.dialog.pegawai.nama_pegawai}
                  {reviu.dialog.pegawai.nama_jabatan
                    ? ` (${reviu.dialog.pegawai.nama_jabatan})`
                    : ""}
                  {reviu.dialog.pegawai.unit_kerja
                    ? ` · ${reviu.dialog.pegawai.unit_kerja}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ReviuStatusBadge status={reviu.status} />
                <CapaianBadge
                  statusDialog={reviu.dialog.status}
                  filledAspekCount={4}
                  reviu={{
                    status: reviu.status,
                    is_tercapai: reviu.is_tercapai,
                    is_tidak_tercapai: reviu.is_tidak_tercapai,
                  }}
                  items={reviu.dialog.aspek.flatMap((a) => a.item)}
                />
                {reviu.dialog.id_dialog_induk ? (
                  <span className="rounded-md bg-blue-500 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    Dialog Lanjutan
                  </span>
                ) : null}
                <TindakLanjutBadge
                  is_tercapai={reviu.is_tercapai}
                  is_tidak_tercapai={reviu.is_tidak_tercapai}
                />
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton
                      label="Unduh PDF"
                      autoPrint={cetak}
                    />
                    <UnduhWordLink href={`/api/unduh/reviu/${reviu.id}/docx`} />
                    {showEvaluasiLanjutan ? (
                      <EvaluasiLanjutanButton
                        parentDialogId={reviu.dialog.id}
                        parentPeriodeLabel={formatPeriode(reviu.dialog.triwulan, reviu.dialog.periode_tahun)}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {isMenungguAtasan ? (
              <p className="text-sm leading-5 text-ink-muted">
                Reviu dari pegawai menunggu persetujuan dan tanda tangan Anda.
              </p>
            ) : null}
            {reviu.status === "menunggu_validasi" ? (
              <p className="text-sm leading-5 text-ink-muted">
                Reviu telah ditandatangani atasan dan menunggu validasi pegawai.
              </p>
            ) : null}
            {reviu.status === "revisi_capaian" ? (
              <p className="text-sm leading-5 text-ink-muted">
                Reviu telah Anda kembalikan untuk revisi. Menunggu pegawai
                memperbaiki isian dan mengirim ulang.
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

        {isMenungguAtasan ? (
          <ReviuSignForm reviuId={reviu.id} role="atasan" />
        ) : null}
      </div>

      {isSelesai ? <FormulirReviu reviu={reviu} /> : null}
    </div>
  );
}
