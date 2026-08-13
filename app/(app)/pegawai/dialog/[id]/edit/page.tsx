import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  canEditDialog,
  getPegawaiDialog,
} from "@/lib/dialog-queries";
import { DialogForm } from "@/components/dialog-form";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Isi Dialog Kinerja #${id}` };
}

export default async function DialogEditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRole("PEGAWAI");

  const dialogId = Number(id);
  if (Number.isNaN(dialogId)) redirect("/pegawai/dashboard");

  const [dialog, metodeList] = await Promise.all([
    getPegawaiDialog(dialogId, session.id),
    prisma.masterMetodePengembangan.findMany({
      where: { is_active: true },
      select: { id: true, nama_metode: true },
      orderBy: { id: "asc" },
    }),
  ]);

  if (!dialog) redirect("/pegawai/dashboard");
  if (!canEditDialog(dialog.status)) {
    redirect(`/pegawai/dialog/${dialog.id}`);
  }

  return (
    <DialogForm
      dialogId={dialog.id}
      periodeTahun={dialog.periode_tahun}
      deskripsiKinerja={dialog.deskripsi_kinerja}
      atasanNama={dialog.atasan.nama_pegawai}
      aspek={dialog.aspek}
      metodeList={metodeList}
    />
  );
}