import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/session";
import {
  canEditDialog,
  canValidateDialog,
  getDialogActor,
  getPegawaiDialog,
} from "@/lib/dialog-queries";
import { StatusBadge } from "@/components/status-badge";
import { DialogSummary } from "@/components/dialog-summary";
import { ValidationPanel } from "@/components/validation-panel";
import { UnduhBuktiButton } from "@/components/unduh-bukti-button";
import { UnduhWordLink } from "@/components/unduh-word-link";
import { FormulirDialogKinerja } from "@/components/formulir-dialog-kinerja";
import { ReviuList } from "@/components/reviu-list";
import { Separator } from "@/components/ui/separator";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Dialog Kinerja #${id}` };
}

function StatusNote({
  status,
  isValidPegawai,
}: {
  status: string;
  isValidPegawai: boolean;
}) {
  if (status === "draft_atasan") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Dialog ini masih disiapkan oleh atasan dan belum dikirim kepada Anda.
      </p>
    );
  }
  if (status === "menunggu_atasan") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Isian Anda telah dikirim. Menunggu reviu dan tanggung jawab dari atasan.
      </p>
    );
  }
  if (status === "menunggu_validasi") {
    if (isValidPegawai) {
      return (
        <p className="text-sm leading-5 text-ink-muted">
          Validasi Anda telah diberikan. Menunggu validasi atasan untuk
          menyelesaikan dialog.
        </p>
      );
    }
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Reviu atasan telah selesai. Lakukan persetujuan dan tanda tangan di
        bawah untuk melanjutkan.
      </p>
    );
  }
  if (status === "selesai") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Dialog kinerja telah selesai divalidasi dan dikunci.
      </p>
    );
  }
  return null;
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

export default async function DialogDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const cetak = sp?.cetak === "1";
  const session = await requireRole("PEGAWAI");

  const dialogId = Number(id);
  if (Number.isNaN(dialogId)) notFound();

  const [dialog, pegawai] = await Promise.all([
    getPegawaiDialog(dialogId, session.id),
    getDialogActor(session.id),
  ]);
  if (!dialog) notFound();

  const isEditable = canEditDialog(dialog.status);
  const isSelesai = dialog.status === "selesai";
  const showValidation =
    canValidateDialog(dialog.status) && !dialog.is_valid_pegawai;
  const latestReviu = dialog.reviu[dialog.reviu.length - 1];

  return (
    <div className="flex flex-col gap-8">
      <div className={`flex flex-col gap-8 ${isSelesai ? "print:hidden" : ""}`}>
        <div className="flex flex-col gap-4">
          <Link
            href="/pegawai/dashboard"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={16} weight="bold" />
            Kembali ke Dashboard
          </Link>

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                  Dialog Kinerja Tahun {dialog.periode_tahun}
                </h1>
                <p className="text-sm leading-5 text-ink-muted">
                  Atasan: {dialog.atasan.nama_pegawai}
                  {dialog.atasan.nama_jabatan
                    ? ` (${dialog.atasan.nama_jabatan})`
                    : ""}
                  {dialog.atasan.unit_kerja
                    ? ` · ${dialog.atasan.unit_kerja}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={dialog.status} />
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                    <UnduhWordLink href={`/api/unduh/dialog/${dialog.id}/word`} />
                  </>
                ) : null}
              </div>
            </div>

            <StatusNote
              status={dialog.status}
              isValidPegawai={dialog.is_valid_pegawai}
            />

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

            {isEditable ? (
              <div className="flex flex-col gap-2 rounded-lg border border-outline bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-5 text-ink-muted">
                  Lengkapi empat aspek evaluasi berikut, lalu kirim ke atasan.
                </p>
                <Link
                  href={`/pegawai/dialog/${dialog.id}/edit`}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                >
                  <PencilSimpleLineIcon size={16} weight="bold" />
                  Isi Dialog Kinerja
                </Link>
              </div>
            ) : null}
          </header>
        </div>

        <section aria-label="Aspek dialog kinerja">
          <DialogSummary aspek={dialog.aspek} />
        </section>

        {showValidation ? (
          <ValidationPanel dialogId={dialog.id} roleLabel="Pegawai" />
        ) : null}

        {dialog.ttd_pegawai_path || dialog.ttd_atasan_path ? (
          <section
            aria-label="Tanda tangan dialog kinerja"
            className="flex flex-col gap-4 rounded-lg border border-outline bg-surface px-5 py-4"
          >
            <h2 className="text-sm font-semibold text-ink">
              Tanda Tangan Dialog Kinerja
            </h2>
            <div className="flex flex-wrap gap-6">
              {dialog.ttd_pegawai_path ? (
                <TtdImage
                  url={dialog.ttd_pegawai_path}
                  alt="Tanda tangan pegawai"
                />
              ) : null}
              {dialog.ttd_atasan_path ? (
                <TtdImage
                  url={dialog.ttd_atasan_path}
                  alt="Tanda tangan atasan"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {isSelesai && dialog.reviu.length > 0 ? (
          <div className="flex flex-col gap-8">
            <Separator />
            <ReviuList
              reviu={dialog.reviu}
              href={(id) => `/pegawai/reviu/${id}`}
            />

            {latestReviu?.ttd_pegawai_path || latestReviu?.ttd_atasan_path ? (
              <section
                aria-label="Tanda tangan reviu dialog kinerja"
                className="flex flex-col gap-4 rounded-lg border border-outline bg-surface px-5 py-4"
              >
                <h2 className="text-sm font-semibold text-ink">
                  Tanda Tangan Reviu Dialog Kinerja
                </h2>
                <div className="flex flex-wrap gap-6">
                  {latestReviu.ttd_pegawai_path ? (
                    <TtdImage
                      url={latestReviu.ttd_pegawai_path}
                      alt="Tanda tangan pegawai"
                    />
                  ) : null}
                  {latestReviu.ttd_atasan_path ? (
                    <TtdImage
                      url={latestReviu.ttd_atasan_path}
                      alt="Tanda tangan atasan"
                    />
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      {isSelesai ? (
        <FormulirDialogKinerja
          dialog={dialog}
          pegawai={pegawai ?? { nama_pegawai: session.nama }}
          atasan={dialog.atasan}
        />
      ) : null}
    </div>
  );
}