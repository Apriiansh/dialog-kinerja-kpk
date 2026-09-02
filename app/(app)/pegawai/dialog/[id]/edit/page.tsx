import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  canEditDialog,
  getPegawaiDialog,
} from "@/lib/queries/dialog";
import { DialogForm } from "@/components/dialog/edit-form";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { isJadwalArrived } from "@/lib/utils/dialog-deadline";
import { Metadata } from "next";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Isi Dialog Kinerja #${id}` };
}

export default async function DialogEditPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireRole("PEGAWAI");

  const dialogId = id;

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
    <>
      <DialogForm
        dialogId={dialog.id}
        periodeTahun={dialog.periode_tahun}
        triwulan={dialog.triwulan}
        deskripsiKinerja={dialog.deskripsi_kinerja}
        deskripsiPegawai={dialog.deskripsi_pegawai}
        atasanNama={dialog.atasan.nama_pegawai}
        aspek={dialog.aspek}
        isLanjutan={dialog.id_dialog_induk !== null}
        metodeList={metodeList}
        jadwalDialog={dialog.jadwal_dialog}
        isJadwalArrived={isJadwalArrived(dialog.jadwal_dialog)}
      />
      <ChatHeader
        dialogId={dialog.id}
        userRole="pegawai"
        partnerName={dialog.atasan.nama_pegawai}
        partnerRoleLabel="Atasan Langsung"
      />
    </>
  );
}
