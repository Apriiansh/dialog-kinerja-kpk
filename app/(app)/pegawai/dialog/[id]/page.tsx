import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilSimpleIcon, PencilSimpleLineIcon } from "@phosphor-icons/react/dist/ssr";
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
import { InitiateDialogButton } from "@/components/dialog/initiate-button";
import { formatPeriode } from "@/lib/constants/triwulan";
import type { AspekPegawaiRow } from "@/lib/utils/dialog-display";
import { PegawaiDraftActions } from "@/components/dialog/draft-actions";

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

function StatusNote({
  status,
  isValidPegawai,
}: {
  status: string;
  isValidPegawai: boolean;
}) {
  if (status === "draft") {
    return (
      <p className="text-sm leading-5 text-ink-muted">
        Pengajuan dialog kinerja ini sedang menunggu persetujuan jadwal dari atasan Anda.
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

  return (
    <div className="flex flex-col gap-8">
      <div className={`flex flex-col gap-8 ${isSelesai ? "print:hidden" : ""}`}>
        <div className="flex flex-col gap-4">
          <Link
            href="/pegawai/dialog"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={14} weight="bold" />
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
                  Atasan:{" "}
                  <span className="font-medium text-ink">
                    {dialog.atasan.nama_pegawai}
                  </span>
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
                {isEditable ? (
                  <Link
                    href={`/pegawai/dialog/${dialog.id}/edit`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary-strong"
                  >
                    <PencilSimpleIcon size={14} weight="bold" />
                    Isi Dialog
                  </Link>
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

            <StatusNote
              status={dialog.status}
              isValidPegawai={dialog.is_valid_pegawai}
            />

            {dialog.alasan_tolak ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <span className="font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Catatan Revisi dari Atasan:
                </span>
                <p className="text-sm font-medium">{dialog.alasan_tolak}</p>
              </div>
            ) : null}

            {dialog.jadwal_dialog ? (
              <div className="rounded-lg border border-outline bg-surface p-4 flex flex-col gap-2">
                <div className="text-xs text-ink-muted">
                  Jadwal Pelaksanaan: <strong className="text-ink font-semibold">{new Date(dialog.jadwal_dialog).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>
                </div>
              </div>
            ) : null}

            {dialog.status === "draft" ? (
              <div className="flex flex-col gap-3 rounded-lg border border-outline bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-muted">
                  Pengajuan sedang ditinjau atasan. Anda dapat memperbarui jadwal atau menghapus draft pengajuan ini.
                </p>
                <PegawaiDraftActions
                  dialogId={dialog.id}
                  currentJadwal={
                    dialog.jadwal_dialog
                      ? new Date(dialog.jadwal_dialog).toISOString().split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  currentDeskripsi={dialog.deskripsi_pegawai ?? ""}
                />
              </div>
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

            {isEditable ? (
              <div className="flex flex-col gap-2 rounded-lg border border-outline bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-5 text-ink-muted">
                  Lengkapi lima aspek evaluasi berikut, lalu kirim ke atasan.
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