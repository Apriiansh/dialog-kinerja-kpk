import { AdminMetodeForm } from "@/components/admin/metode-form";
import { requireRole } from "@/lib/auth/session";
import { createMetode } from "@/lib/actions/admin-metode";

export const dynamic = "force-dynamic";

export default async function AdminMetodeNewPage() {
  await requireRole("ADMIN");

  return (
    <AdminMetodeForm
      backHref="/admin/metode"
      backLabel="Kembali ke Metode Pengembangan"
      submitLabel="Tambah Metode"
      action={async (formData) => {
        "use server";
        return createMetode({}, formData);
      }}
    />
  );
}