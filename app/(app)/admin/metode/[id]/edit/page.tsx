import { notFound } from "next/navigation";
import { AdminMetodeForm } from "@/components/admin/metode-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { updateMetode } from "@/lib/actions/admin-metode";

export const dynamic = "force-dynamic";

export default async function AdminMetodeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const metode = await prisma.masterMetodePengembangan.findUnique({
    where: { id: Number(id) },
    select: { id: true, nama_metode: true, is_active: true },
  });
  if (!metode) notFound();

  return (
    <AdminMetodeForm
      backHref="/admin/metode"
      backLabel="Kembali ke Metode Pengembangan"
      submitLabel={`Edit ${metode.nama_metode}`}
      action={async (formData) => {
        "use server";
        return updateMetode(Number(id), {}, formData);
      }}
      values={{
        nama_metode: metode.nama_metode,
        is_active: metode.is_active ? "1" : "",
      }}
    />
  );
}