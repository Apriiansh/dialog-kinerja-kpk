import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { StatusBadge } from "@/components/status-badge";
import { DeskripsiKinerjaForm } from "@/components/deskripsi-kinerja-form";

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
      status: true,
      periode_tahun: true,
      pegawai: {
        select: {
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
    },
  });
  if (!dialog) redirect("/atasan/dialog");
  if (dialog.status !== "draft_atasan") redirect(`/atasan/dialog/${dialog.id}`);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href={`/atasan/dialog/${dialog.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-strong transition-colors hover:text-primary"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            Kembali ke detail
          </Link>
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Isi Dialog Kinerja
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {dialog.pegawai.nama_pegawai}
            {dialog.pegawai.nama_jabatan ? ` · ${dialog.pegawai.nama_jabatan}` : ""}
            {dialog.pegawai.unit_kerja ? ` · ${dialog.pegawai.unit_kerja}` : ""} ·{" "}
            Periode {dialog.periode_tahun}
          </p>
        </div>
        <StatusBadge status={dialog.status} />
      </header>

      <DeskripsiKinerjaForm
        dialogId={dialog.id}
        initialValue={dialog.deskripsi_kinerja ?? ""}
      />
    </div>
  );
}
