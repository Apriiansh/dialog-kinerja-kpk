import { PegawaiForm } from "@/components/pegawai-form";
import { requireRole } from "@/lib/session";
import { createPegawai } from "@/lib/actions/pegawai-admin";

export const dynamic = "force-dynamic";

export default async function AtasanPegawaiNewPage() {
  await requireRole("ATASAN");

  return (
    <PegawaiForm
      backHref="/atasan/pegawai"
      backLabel="Kembali ke Daftar Pegawai"
      submitLabel="Tambah Pegawai"
      action={async (formData) => {
        "use server";
        return createPegawai({}, formData);
      }}
    />
  );
}