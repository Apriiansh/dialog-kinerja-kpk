import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilSimple, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/session";
import { getAtasanDialog } from "@/lib/atasan-queries";
import { getDialogActor } from "@/lib/dialog-queries";
import { StatusBadge } from "@/components/status-badge";
import { DeleteDialogButton } from "@/components/delete-dialog-button";
import { DialogSummary } from "@/components/dialog-summary";
import { DialogResponsesForm } from "@/components/dialog-responses-form";
import { UnduhBuktiButton } from "@/components/unduh-bukti-button";
import { UnduhWordLink } from "@/components/unduh-word-link";
import { FormulirDialogKinerja } from "@/components/formulir-dialog-kinerja";
import { ReviuList } from "@/components/reviu-list";
import { ReviuSignForm } from "@/components/reviu-sign-form";
import { Separator } from "@/components/ui/separator";
import { submitDialog } from "@/lib/actions/atasan";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Dialog Kinerja #${id}` };
}

function StatusNote({ status }: { status: string }) {
  if (status === "draft_atasan") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Dialog masih berupa draf dan belum dikirim ke pegawai. Deskripsi
        kinerja opsional; isi bila perlu lalu kirim.
      </p>
    );
  }
  if (status === "menunggu_pegawai") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Dialog telah dikirim. Menunggu pegawai melengkapi isian empat aspek.
      </p>
    );
  }
  if (status === "menunggu_atasan") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Pegawai telah mengisi dialog. Reviu isian pegawai, isi tanggung jawab
        atasan, lalu beri persetujuan dan tanda tangan di bawah.
      </p>
    );
  }
  if (status === "menunggu_validasi") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Evaluasi atasan telah disimpan. Menunggu validasi dan tanda tangan
        pegawai untuk menyelesaikan dialog.
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
  const session = await requireRole("ATASAN");

  const dialogId = Number(id);
  if (Number.isNaN(dialogId)) notFound();

  const [dialog, atasan] = await Promise.all([
    getAtasanDialog(dialogId, session.id),
    getDialogActor(session.id),
  ]);
  if (!dialog) notFound();

  const status = dialog.status;
  const isDraft = status === "draft_atasan";
  const isReview = status === "menunggu_atasan";
  const isSelesai = status === "selesai";
  const latestReviu = dialog.reviu[dialog.reviu.length - 1];

  return (
    <div className="flex flex-col gap-8">
      <div className={`flex flex-col gap-8 ${isSelesai ? "print:hidden" : ""}`}>
        <div className="flex flex-col gap-4">
          <Link
            href="/atasan/dialog"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={16} weight="bold" />
            Kembali ke Daftar Dialog
          </Link>

          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                  Dialog Kinerja Tahun {dialog.periode_tahun}
                </h1>
                <p className="text-sm leading-5 text-ink-muted">
                  Pegawai: {dialog.pegawai.nama_pegawai}
                  {dialog.pegawai.nama_jabatan
                    ? ` (${dialog.pegawai.nama_jabatan})`
                    : ""}
                  {dialog.pegawai.unit_kerja
                    ? ` · ${dialog.pegawai.unit_kerja}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                    <UnduhWordLink href={`/api/unduh/dialog/${dialog.id}/word`} />
                  </>
                ) : null}
                {isDraft ? (
                  <>
                    <Link
                      href={`/atasan/dialog/${dialog.id}/edit`}
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-faint"
                    >
                      <PencilSimple size={12} weight="bold" />
                      Edit
                    </Link>
                    <DeleteDialogButton dialogId={dialog.id} />
                    <form action={submitDialog.bind(null, dialog.id)}>
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                      >
                        <PaperPlaneTilt size={12} weight="bold" />
                        Kirim
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>

            <StatusNote status={status} />

            {isDraft && !dialog.deskripsi_kinerja?.trim() ? (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-outline-strong bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-5 text-ink-muted">
                  Belum ada deskripsi kinerja. Anda dapat langsung mengirim
                  dialog atau mengisi deskripsi terlebih dahulu melalui tombol
                  Edit.
                </p>
                <Link
                  href={`/atasan/dialog/${dialog.id}/edit`}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                >
                  <PencilSimple size={16} weight="bold" />
                  Isi Deskripsi Kinerja
                </Link>
              </div>
            ) : null}

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

        {isReview ? (
          <DialogResponsesForm
            dialogId={dialog.id}
            canEdit
            aspek={dialog.aspek}
          />
        ) : (
          <>
            <section aria-label="Aspek dialog kinerja">
              <DialogSummary aspek={dialog.aspek} />
            </section>

            {status === "menunggu_validasi" ? (
              <p className="text-sm leading-5 text-ink-muted">
                Evaluasi atasan telah disimpan dan menunggu validasi pegawai.
              </p>
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
                <ReviuList reviu={dialog.reviu} />

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

                {dialog.reviu.some(
                  (r) => r.status === "menunggu_atasan" && !r.is_valid_atasan,
                ) ? (
                  <ReviuSignForm
                    reviuId={
                      dialog.reviu.find(
                        (r) =>
                          r.status === "menunggu_atasan" && !r.is_valid_atasan,
                      )!.id
                    }
                    role="atasan"
                  />
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      {isSelesai ? (
        <FormulirDialogKinerja
          dialog={dialog}
          pegawai={dialog.pegawai}
          atasan={atasan ?? { nama_pegawai: session.nama }}
        />
      ) : null}
    </div>
  );
}
