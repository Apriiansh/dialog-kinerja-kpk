import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { AtasanEditForm } from "@/components/dialog/atasan-edit-form";
import { formatPeriode } from "@/lib/constants/triwulan";
import type { AspekPegawaiRow } from "@/lib/utils/dialog-display";

export default async function EditDialogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("ATASAN");

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: Number(id), id_atasan: session.id },
    select: {
      id: true,
      deskripsi_kinerja: true,
      deskripsi_pegawai: true,
      status: true,
      periode_tahun: true,
      triwulan: true,
      pegawai: {
        select: {
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
      aspek: {
        include: { item: { include: { metode: true } } },
      },
    },
  });
  if (!dialog) redirect("/atasan/dialog");
  if (!["draft", "menunggu_pegawai", "menunggu_atasan"].includes(dialog.status)) redirect(`/atasan/dialog/${dialog.id}`);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/atasan/dialog/${dialog.id}`}
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            Kembali ke Detail Dialog
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
              Isi Dialog Kinerja
            </h1>
            <span className="rounded-md border border-outline bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
              {formatPeriode(dialog.triwulan, dialog.periode_tahun)}
            </span>
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
          <StatusBadge status={dialog.status} />
          <ChatHeader
            dialogId={dialog.id}
            userRole="atasan"
            partnerName={dialog.pegawai.nama_pegawai}
            partnerRoleLabel="Pegawai"
          />
        </div>
      </header>

      <AtasanEditForm
        dialogId={dialog.id}
        status={dialog.status}
        initialDeskripsiKinerja={dialog.deskripsi_kinerja ?? ""}
        initialTahun={dialog.periode_tahun}
        initialTriwulan={dialog.triwulan}
        aspek={dialog.aspek as AspekPegawaiRow[]}
        deskripsiPegawai={dialog.deskripsi_pegawai ?? ""}
      />
    </div>
  );
}
