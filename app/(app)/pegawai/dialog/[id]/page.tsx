import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import {
  canEditDialog,
  canValidateDialog,
  getDialogActor,
  getPegawaiDialog,
} from "@/lib/queries/dialog";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/shared/status-badge";
import { DialogSummary } from "@/components/dialog/summary";
import { ValidationPanel } from "@/components/shared/validation-panel";
import { UnduhBuktiButton } from "@/components/shared/unduh-bukti-button";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { FormulirDialogKinerja } from "@/components/dialog/detail-view";
import { ReviuList } from "@/components/reviu/list";
import { Separator } from "@/components/ui/separator";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { EvaluasiLanjutanButton } from "@/components/reviu/lanjutan-button";
import { formatPeriode } from "@/lib/constants/triwulan";
import type { AspekPegawaiRow } from "@/lib/utils/dialog-display";

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
        Isian Anda telah dikirim. Menunggu tanggapan dan pembagian tanggung jawab dari atasan.
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
        Tanggapan atasan telah selesai. Lakukan persetujuan dan tanda tangan di
        bawah untuk mengesahkan target.
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
  const session = await requireRole("PEGAWAI");

  const dialogId = Number(id);
  if (Number.isNaN(dialogId)) notFound();

  const [dialog, pegawai, sequenceNum] = await Promise.all([
    getPegawaiDialog(dialogId, session.id),
    getDialogActor(session.id),
    prisma.dialogKinerja.count({
      where: { id_pegawai: session.id, id: { lte: dialogId } },
    }),
  ]);
  if (!dialog) notFound();

  const isEditable = canEditDialog(dialog.status);
  const isSelesai = dialog.status === "selesai";
  const showValidation =
    canValidateDialog(dialog.status) && !dialog.is_valid_pegawai;
  const selesaiReviuIds = dialog.reviu
    .filter((r: { status: string; id: number }) => r.status === "selesai")
    .map((r: { id: number }) => r.id);
  const latestSelesaiReviuId = selesaiReviuIds[selesaiReviuIds.length - 1];
  const hasLanjutan = dialog.dialog_lanjutan.length > 0;
  const hasBelumTercapai = dialog.aspek.some((aspek: { item: { is_tercapai: boolean | null }[] }) =>
    aspek.item.some((item: { is_tercapai: boolean | null }) => item.is_tercapai === false),
  );

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
                  Dialog Kinerja Ke-{sequenceNum} ({formatPeriode(dialog.triwulan, dialog.periode_tahun)})
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
                {!isSelesai ? (
                  <ChatHeader
                    dialogId={dialog.id}
                    userRole="pegawai"
                    partnerName={dialog.atasan.nama_pegawai}
                    partnerRoleLabel="Atasan Langsung"
                  />
                ) : null}
                {dialog.id_dialog_induk ? (
                  <span className="bg-emerald-400 px-2 py-2 rounded-md text-xs font-semibold text-gray-900">
                    Dialog Lanjutan
                  </span>
                ) : null}
                {isSelesai ? (
                  <>
                    <UnduhBuktiButton autoPrint={cetak} label="Unduh PDF" />
                    <UnduhWordLink href={`/api/unduh/dialog/${dialog.id}/docx`} />
                    {dialog.reviu.length === 0 ? (
                      <Link
                        href={`/pegawai/reviu/new?dialog=${dialog.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                      >
                        Isi Evaluasi Kinerja
                      </Link>
                    ) : null}
                    {latestSelesaiReviuId && !hasLanjutan ? (
                      <EvaluasiLanjutanButton
                        reviuId={latestSelesaiReviuId}
                        label={hasBelumTercapai ? "Evaluasi Lanjutan" : "Ajukan Evaluasi"}
                      />
                    ) : null}
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
          <DialogSummary
            aspek={dialog.aspek}
            isLanjutan={dialog.id_dialog_induk !== null}
            previousItems={dialog.dialog_induk?.aspek.flatMap((aspek: AspekPegawaiRow) => aspek.item)}
          />
        </section>

        {showValidation ? (
          <ValidationPanel dialogId={dialog.id} roleLabel="Pegawai" />
        ) : null}

        {isSelesai && dialog.reviu.length > 0 ? (
          <div className="flex flex-col gap-8">
            <Separator />
            <ReviuList
              reviu={dialog.reviu}
              href={(id) => `/pegawai/reviu/${id}`}
            />
          </div>
        ) : null}
      </div>

      {isSelesai ? (
        <FormulirDialogKinerja
          dialog={dialog}
          pegawai={pegawai ?? { nama_pegawai: session.nama }}
        />
      ) : null}
    </div>
  );
}