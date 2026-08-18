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

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Reviu #${id}` };
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
                  Reviu Dialog Kinerja Tahun {reviu.dialog.periode_tahun}
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
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton label="Unduh PDF" autoPrint={cetak} />
                    <UnduhWordLink href={`/api/unduh/reviu/${reviu.id}/docx`} />
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

        {reviu.ttd_pegawai_path || reviu.ttd_atasan_path ? (
          <section
            aria-label="Tanda tangan reviu"
            className="flex flex-col gap-4 rounded-lg border border-outline bg-surface px-5 py-4"
          >
            <h2 className="text-sm font-semibold text-ink">Tanda Tangan</h2>
            <div className="flex flex-wrap gap-6">
              {reviu.ttd_pegawai_path ? (
                <TtdImage url={reviu.ttd_pegawai_path} alt="Tanda tangan pegawai" />
              ) : null}
              {reviu.ttd_atasan_path ? (
                <TtdImage url={reviu.ttd_atasan_path} alt="Tanda tangan atasan" />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {isSelesai ? <FormulirReviu reviu={reviu} /> : null}
    </div>
  );
}
