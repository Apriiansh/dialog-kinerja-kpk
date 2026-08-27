import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAtasanDialog } from "@/lib/queries/atasan";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeleteDialogButton } from "@/components/dialog/delete-button";
import { DialogSummary } from "@/components/dialog/summary";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { FormulirDialogKinerja } from "@/components/dialog/detail-view";
import { ReviuList } from "@/components/reviu/list";
import { ReviuSignForm } from "@/components/reviu/sign-form";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { InitiateDialogButton } from "@/components/dialog/initiate-button";
import { formatPeriode } from "@/lib/constants/triwulan";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Dialog Kinerja #${id}` };
}

import { AtasanApprovalPanel } from "@/components/dialog/atasan-approval-panel";

function StatusNote({ status }: { status: string }) {
  if (status === "draft") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Pegawai telah mengajukan jadwal dialog kinerja ini. Tinjau pengajuan di bawah untuk menyetujui atau mengembalikan dengan catatan.
      </p>
    );
  }
  if (status === "menunggu_pegawai") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Dialog telah disetujui. Pegawai sedang melengkapi isian aspek — Anda dapat mengisi Deskripsi Kinerja dan Tanggung Jawab Atasan melalui menu <strong>Input</strong>.
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
  const isDraft = status === "draft";
  const isCollaboration = status === "menunggu_pegawai";
  const isReview = status === "menunggu_atasan";
  const isSelesai = status === "selesai";
  const canEditDialog = isDraft || isCollaboration || isReview;
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
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} weight="bold" />
            Kembali ke Daftar Dialog
          </Link>

          <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
                    Dialog Kinerja Ke-{sequenceNum}
                  </h1>
                  <span className="rounded-md border border-outline bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                    {formatPeriode(dialog.triwulan, dialog.periode_tahun)}
                  </span>
                  {dialog.id_dialog_induk ? (
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Dialog Lanjutan
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-5 text-ink-muted">
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

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                {!isSelesai ? (
                  <ChatHeader
                    dialogId={dialog.id}
                    userRole="atasan"
                    partnerName={dialog.pegawai.nama_pegawai}
                    partnerRoleLabel="Pegawai"
                  />
                ) : null}
                {canEditDialog ? (
                  <Link
                    href={`/atasan/dialog/${dialog.id}/edit`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-strong bg-surface px-3.5 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-surface-muted"
                  >
                    <PencilSimple size={14} weight="bold" />
                    Edit Dialog
                  </Link>
                ) : null}
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                    <UnduhWordLink href={`/api/unduh/dialog/${dialog.id}/docx`} />
                    {latestSelesaiReviuId && !hasLanjutan ? (
                      <InitiateDialogButton
                        parentDialogId={dialog.id}
                        parentPeriodeLabel={formatPeriode(dialog.triwulan, dialog.periode_tahun)}
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

            {dialog.deskripsi_pegawai?.trim() || dialog.deskripsi_kinerja?.trim() ? (
              <div className="grid gap-3 sm:grid-cols-1">
                {dialog.deskripsi_pegawai?.trim() ? (
                  <div className="rounded-lg border border-outline bg-surface px-5 py-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      {dialog.deskripsi_kinerja?.trim()
                        ? "Deskripsi Kinerja (versi Pegawai)"
                        : "Deskripsi Kinerja (Pegawai)"}
                    </span>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-ink">
                      {dialog.deskripsi_pegawai}
                    </p>
                  </div>
                ) : null}

                {dialog.deskripsi_kinerja?.trim() ? (
                  <div className="rounded-lg border border-outline bg-surface px-5 py-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      {dialog.deskripsi_pegawai?.trim()
                        ? "Deskripsi Kinerja (versi Atasan)"
                        : "Deskripsi Kinerja (Atasan)"}
                    </span>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-ink">
                      {dialog.deskripsi_kinerja}
                    </p>
                  </div>
                ) : null}
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
