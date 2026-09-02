import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilSimpleIcon,
  ChatCircleDotsIcon,
} from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAtasanDialog } from "@/lib/queries/atasan";
import { StatusBadge } from "@/components/shared/status-badge";
import { DialogSummary } from "@/components/dialog/summary";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { Separator } from "@/components/ui/separator";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { FormulirDialogKinerja } from "@/components/dialog/detail-view";
import { ReviuList } from "@/components/reviu/list";
import { ReviuSignForm } from "@/components/reviu/sign-form";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { InitiateDialogButton } from "@/components/dialog/initiate-button";
import { formatPeriode } from "@/lib/constants/triwulan";
import { AtasanApprovalPanel } from "@/components/dialog/atasan-approval-panel";
import { CalendarDownloadButton } from "@/components/dialog/calendar-download-button";
import { ScrollToAnchor } from "@/components/shared/scroll-to-anchor";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Dialog Kinerja #${id}` };
}

function StatusNote({ status }: { status: string }) {
  if (status === "draft") {
    return (
      <p className="text-xs leading-5 text-ink-muted sm:text-sm">
        Pegawai telah mengajukan jadwal dialog kinerja ini. Tinjau pengajuan di
        bawah untuk menyetujui atau mengembalikan dengan catatan.
      </p>
    );
  }
  if (status === "menunggu_pegawai") {
    return (
      <p className="text-xs leading-5 text-ink-muted sm:text-sm">
        Dialog sedang dalam proses pengisian. Pegawai melengkapi isian aspek,
        dan Anda juga dapat mengisi Deskripsi Kinerja serta Tanggung Jawab
        Atasan melalui tombol <strong>Isi Dialog</strong>.
      </p>
    );
  }
  if (status === "menunggu_atasan") {
    return (
      <p className="text-xs leading-5 text-ink-muted sm:text-sm">
        Pegawai telah mengisi dialog. Menunggu validasi Anda: reviu isian
        pegawai, isi tanggung jawab atasan, lalu validasi, atau
        kembalikan dengan catatan revisi.
      </p>
    );
  }
  if (status === "revisi_evaluasi") {
    return (
      <p className="text-xs leading-5 text-ink-muted sm:text-sm">
        Dialog telah Anda kembalikan untuk revisi. Menunggu pegawai memperbaiki
        isian dan mengirim ulang.
      </p>
    );
  }
  if (status === "menunggu_validasi") {
    return (
      <p className="text-xs leading-5 text-ink-muted sm:text-sm">
        Evaluasi atasan telah disimpan. Menunggu validasi pegawai untuk menyelesaikan dialog.
      </p>
    );
  }
  if (status === "selesai") {
    return (
      <p className="text-xs leading-5 text-ink-muted sm:text-sm">
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
  const chatOpen = sp?.chat === "1";
  const session = await requireRole("ATASAN");

  const dialogId = id

  const dialog = await getAtasanDialog(dialogId, session.id);
  if (!dialog) notFound();

  const sequenceNum = await prisma.dialogKinerja.count({
    where: {
      id_pegawai: dialog.id_pegawai,
      created_at: { lte: dialog.created_at },
    },
  });

  const status = dialog.status;
  const isDraft = status === "draft";
  const isCollaboration = status === "menunggu_pegawai";
  const isReview = status === "menunggu_atasan";
  const isSelesai = status === "selesai";
  const canEditDialog = isCollaboration || isReview;
  const selesaiReviuIds = dialog.reviu
    .filter((r) => r.status === "selesai")
    .map((r) => r.id);
  const latestSelesaiReviuId = selesaiReviuIds[selesaiReviuIds.length - 1];
  const hasLanjutan = dialog.dialog_lanjutan.length > 0;

  const formattedDate = dialog.jadwal_dialog
    ? new Date(dialog.jadwal_dialog).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      : "Belum ditentukan";

  const icsTitle = dialog.jadwal_dialog
    ? `Dialog Kinerja - ${dialog.pegawai.nama_pegawai} - ${formatPeriode(dialog.triwulan, dialog.periode_tahun)}`
    : "";

  const icsDescription = dialog.jadwal_dialog
    ? [
        `Jadwal Dialog Kinerja`,
        `Pegawai: ${dialog.pegawai.nama_pegawai}`,
        `Periode: ${formatPeriode(dialog.triwulan, dialog.periode_tahun)}`,
        `Tanggal: ${formattedDate}`,
        dialog.deskripsi_pegawai ? `Catatan Pegawai: ${dialog.deskripsi_pegawai}` : "",
        dialog.deskripsi_kinerja ? `Catatan Atasan: ${dialog.deskripsi_kinerja}` : "",
      ].filter(Boolean).join("\n")
    : "";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <ScrollToAnchor />
      <div
        className={`flex flex-col gap-6 sm:gap-8 ${isSelesai ? "print:hidden" : ""}`}
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <Link
            href="/atasan/dialog"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            Kembali ke Daftar Dialog
          </Link>

          <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <h1 className="text-xl font-semibold leading-7 tracking-[-0.01em] text-ink sm:text-[24px] sm:leading-8">
                    Dialog Kinerja Ke-{sequenceNum}
                  </h1>
                  <span className="rounded-md border border-outline bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted whitespace-nowrap">
                    {formatPeriode(dialog.triwulan, dialog.periode_tahun)}
                  </span>
                  {dialog.id_dialog_induk ? (
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
                      Dialog Lanjutan
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-5 text-ink-muted sm:text-sm wrap-break-words">
                  Pegawai:{" "}
                  <span className="font-medium text-ink">
                    {dialog.pegawai.nama_pegawai}
                  </span>
                  {dialog.pegawai.nama_jabatan
                    ? ` (${dialog.pegawai.nama_jabatan})`
                    : ""}
                  {dialog.pegawai.unit_kerja
                    ? ` · ${dialog.pegawai.unit_kerja}`
                    : ""}
                </p>
              </div>

              <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:justify-end">
                <StatusBadge status={status} />
                {!isSelesai ? (
                  <ChatHeader
                    dialogId={dialog.id}
                    userRole="atasan"
                    defaultOpen={chatOpen}
                    partnerName={dialog.pegawai.nama_pegawai}
                    partnerRoleLabel="Pegawai"
                  />
                ) : null}
                {canEditDialog ? (
                  <Link
                    href={`/atasan/dialog/${dialog.id}/edit`}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-outline-strong bg-primary px-3.5 text-xs font-semibold text-muted shadow-xs transition-colors hover:bg-surface-muted"
                  >
                    <PencilSimpleIcon size={14} weight="bold" />
                    Isi Dialog
                  </Link>
                ) : null}

                {dialog.jadwal_dialog && !isDraft && (
                  <CalendarDownloadButton
                    jadwalDialog={dialog.jadwal_dialog}
                    title={icsTitle}
                    description={icsDescription}
                    label="Kalender"
                  />
                )}

                {isSelesai ? (
                  <>
                    <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                    <UnduhWordLink
                      href={`/api/unduh/dialog/${dialog.id}/docx`}
                    />
                    <Link
                      href={`/chat/${dialog.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-strong bg-surface px-3.5 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-surface-muted"
                    >
                      <ChatCircleDotsIcon size={14} weight="bold" />
                      Riwayat Chat
                    </Link>
                    {latestSelesaiReviuId && !hasLanjutan ? (
                      <InitiateDialogButton
                        parentDialogId={dialog.id}
                        parentPeriodeLabel={formatPeriode(
                          dialog.triwulan,
                          dialog.periode_tahun,
                        )}
                        label="Ajukan Dialog Lanjutan"
                        variant="outline"
                        size="sm"
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <StatusNote status={status} />

            {isDraft ? (
              <AtasanApprovalPanel
                dialogId={dialog.id}
                jadwalDialog={dialog.jadwal_dialog}
                deskripsiPegawai={dialog.deskripsi_pegawai}
                initialDeskripsiAtasan={dialog.deskripsi_kinerja}
              />
            ) : null}

            {dialog.deskripsi_pegawai?.trim() ||
            dialog.deskripsi_kinerja?.trim() ? (
              <div className="rounded-lg border border-outline bg-surface px-4 py-3 sm:px-5 sm:py-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  {dialog.deskripsi_pegawai?.trim() &&
                  dialog.deskripsi_kinerja?.trim()
                    ? "Deskripsi Kinerja"
                    : dialog.deskripsi_pegawai?.trim()
                      ? "Deskripsi Kinerja (Pegawai)"
                      : "Deskripsi Kinerja (Atasan)"}
                </span>

                <div className="mt-2">
                  {dialog.deskripsi_pegawai?.trim() &&
                  dialog.deskripsi_kinerja?.trim() ? (
                    <>
                      <div>
                        <span className="text-xs font-medium text-ink-muted">
                          Pegawai
                        </span>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
                          {dialog.deskripsi_pegawai}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-outline pt-4">
                        <span className="text-xs font-medium text-ink-muted">
                          Atasan
                        </span>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
                          {dialog.deskripsi_kinerja}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
                      {dialog.deskripsi_pegawai?.trim() ||
                        dialog.deskripsi_kinerja}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </header>
        </div>

        <section aria-label="Aspek dialog kinerja" className="overflow-x-auto">
          <DialogSummary
            aspek={dialog.aspek}
            isLanjutan={dialog.id_dialog_induk !== null}
            previousItems={dialog.dialog_induk?.aspek.flatMap(
              (aspek) => aspek.item,
            )}
          />
        </section>

        {status === "menunggu_validasi" ? (
          <p className="text-xs leading-5 text-ink-muted sm:text-sm">
            Evaluasi atasan telah disimpan dan menunggu validasi pegawai.
          </p>
        ) : null}

        {isSelesai && dialog.reviu.length > 0 ? (
          <div id="reviu" className="flex scroll-mt-14 flex-col gap-6 sm:gap-8">
            <Separator />
            <ReviuList reviu={dialog.reviu} />

            {dialog.reviu.some(
              (r) => r.status === "menunggu_atasan" && !r.is_valid_atasan,
            ) ? (
              <ReviuSignForm
                reviuId={
                  dialog.reviu.find(
                    (r) => r.status === "menunggu_atasan" && !r.is_valid_atasan,
                  )!.id
                }
                role="atasan"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {isSelesai ? (
        <div className="overflow-x-auto">
          <FormulirDialogKinerja dialog={dialog} pegawai={dialog.pegawai} />
        </div>
      ) : null}
    </div>
  );
}
