import { NotFoundCard } from "@/components/shared/not-found-card";

export default function AtasanDialogNotFound() {
  return (
    <NotFoundCard
      title="Dialog tidak ditemukan"
      description="Dialog yang Anda cari tidak ditemukan atau Anda tidak memiliki akses untuk membukanya."
      backHref="/atasan/dialog"
      backLabel="Kembali ke Daftar Dialog"
    />
  );
}