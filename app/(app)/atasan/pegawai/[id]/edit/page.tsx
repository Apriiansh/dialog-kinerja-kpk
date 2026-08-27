import { notFound } from "next/navigation";
import { PegawaiForm } from "@/components/pegawai/form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { pegawaiFormDefaults } from "@/lib/utils/user-defaults";
import { updatePegawai } from "@/lib/actions/pegawai-admin";

export const dynamic = "force-dynamic";

export default async function AtasanPegawaiEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ATASAN");
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id: Number(id), id_atasan: session.id },
    select: {
      npp: true,
      email: true,
      nip: true,
      nama_pegawai: true,
      tanggal_bergabung: true,
      nama_jabatan: true,
      unit_kerja: true,
      masa_kerja_unit_terakhir: true,
    },
  });
  if (!user) notFound();

  return (
    <PegawaiForm
      backHref="/atasan/pegawai"
      backLabel="Kembali ke Daftar Pegawai"
      submitLabel={`Edit ${user.nama_pegawai}`}
      action={async (formData) => {
        "use server";
        return updatePegawai(Number(id), {}, formData);
      }}
      values={pegawaiFormDefaults(user)}
    />
  );
}
