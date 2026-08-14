import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/session";
import { getAtasanReviu } from "@/lib/reviu-queries";
import { ReviuStatusBadge } from "@/components/reviu-status-badge";
import { TindakLanjutBadge } from "@/components/tindak-lanjut-badge";
import { ReviuSummary } from "@/components/reviu-summary";
import { ReviuSignForm } from "@/components/reviu-sign-form";
import { UnduhBuktiButton } from "@/components/unduh-bukti-button";
import { Separator } from "@/components/ui/separator";
import { FormulirReviu } from "@/components/formulir-reviu";

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
                  Reviu Dialog Kinerja Tahun {reviu.dialog.periode_tahun}
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
              <div className="flex items-center gap-2">
                <ReviuStatusBadge status={reviu.status} />
                <TindakLanjutBadge
                  is_tercapai={reviu.is_tercapai}
                  is_tidak_tercapai={reviu.is_tidak_tercapai}
                />
                {isSelesai ? (
                  <UnduhBuktiButton
                    label="Unduh Bukti Reviu"
                    autoPrint={cetak}
                  />
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

        {reviu.ttd_pegawai_path || reviu.ttd_atasan_path ? (
          <section
            aria-label="Tanda tangan reviu"
            className="flex flex-col gap-4 rounded-lg border border-outline bg-surface px-5 py-4"
          >
            <h2 className="text-sm font-semibold text-ink">Tanda Tangan</h2>
            <div className="flex flex-wrap gap-6">
              {reviu.ttd_atasan_path ? (
                <TtdImage url={reviu.ttd_atasan_path} alt="Tanda tangan atasan" />
              ) : null}
              {reviu.ttd_pegawai_path ? (
                <TtdImage url={reviu.ttd_pegawai_path} alt="Tanda tangan pegawai" />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {isSelesai ? <FormulirReviu reviu={reviu} /> : null}
    </div>
  );
}
