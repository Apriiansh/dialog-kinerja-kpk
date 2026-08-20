import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilSimple, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAtasanDialog } from "@/lib/queries/atasan";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeleteDialogButton } from "@/components/dialog/delete-button";
import { DialogSummary } from "@/components/dialog/summary";
import { DialogResponsesForm } from "@/components/dialog/responses-form";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { FormulirDialogKinerja } from "@/components/dialog/detail-view";
import { ReviuList } from "@/components/reviu/list";
import { ReviuSignForm } from "@/components/reviu/sign-form";
import { ScrollToAnchor } from "@/components/shared/scroll-to-anchor";
import { Separator } from "@/components/ui/separator";
import { submitDialog } from "@/lib/actions/atasan";
import { EvaluasiLanjutanButton } from "@/components/reviu/lanjutan-button";
import { formatPeriode } from "@/lib/constants/triwulan";

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

  const dialog = await getAtasanDialog(dialogId, session.id);
  if (!dialog) notFound();

  const sequenceNum = await prisma.dialogKinerja.count({
    where: { id_pegawai: dialog.id_pegawai, id: { lte: dialogId } },
  });

  const status = dialog.status;
  const isDraft = status === "draft_atasan";
  const isReview = status === "menunggu_atasan";
  const isSelesai = status === "selesai";
  const selesaiReviuIds = dialog.reviu
    .filter((r) => r.status === "selesai")
    .map((r) => r.id);
  const latestSelesaiReviuId = selesaiReviuIds[selesaiReviuIds.length - 1];
  const hasLanjutan = dialog.dialog_lanjutan.length > 0;
  const hasBelumTercapai = dialog.aspek.some((aspek) =>
    aspek.item.some((item) => item.is_tercapai === false),
  );

  return (
    <div className="flex flex-col gap-8">
      <ScrollToAnchor />
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
                  Dialog Kinerja Ke-{sequenceNum} ({formatPeriode(dialog.triwulan, dialog.periode_tahun)})
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
                {dialog.id_dialog_induk ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    Dialog Lanjutan
                  </span>
                ) : null}
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                    <UnduhWordLink href={`/api/unduh/dialog/${dialog.id}/docx`} />
                    {latestSelesaiReviuId && !hasLanjutan && hasBelumTercapai ? (
                      <EvaluasiLanjutanButton reviuId={latestSelesaiReviuId} />
                    ) : null}
                  </>
                ) : null}
                {isDraft ? (
                  <>
                    <Link
                      href={`/atasan/dialog/${dialog.id}/edit`}
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-faint"
                    >
                      <PencilSimple size={12} weight="bold" />
                      {dialog.id_dialog_induk ? "Isi Dialog Lanjutan" : "Isi Dialog"}
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
              <DialogSummary
                aspek={dialog.aspek}
                isLanjutan={dialog.id_dialog_induk !== null}
                previousItems={dialog.dialog_induk?.aspek.flatMap((aspek) => aspek.item)}
              />
            </section>

            {status === "menunggu_validasi" ? (
              <p className="text-sm leading-5 text-ink-muted">
                Evaluasi atasan telah disimpan dan menunggu validasi pegawai.
              </p>
            ) : null}

            {isSelesai && dialog.reviu.length > 0 ? (
              <div id="reviu" className="flex scroll-mt-14 flex-col gap-8">
                <Separator />
                <ReviuList reviu={dialog.reviu} />

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
        />
      ) : null}
    </div>
  );
}
