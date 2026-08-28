import { NotFoundCard } from "@/components/shared/not-found-card";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <NotFoundCard
        title="Halaman tidak ditemukan"
        description="Halaman yang Anda cari tidak ditemukan atau telah dipindahkan. Periksa kembali alamat URL Anda."
        backHref="/"
        backLabel="Ke Beranda"
      />
    </div>
  );
}