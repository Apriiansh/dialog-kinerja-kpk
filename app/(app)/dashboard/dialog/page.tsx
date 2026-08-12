import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { DialogList } from "@/components/dialog-list";

export default async function DialogIndexPage() {
  const session = await requireRole("ATASAN");

  const dialogs = await prisma.dialogKinerja.findMany({
    where: { id_atasan: session.id },
    select: {
      id: true,
      periode_tahun: true,
      status: true,
      is_valid_pegawai: true,
      is_valid_atasan: true,
      pegawai: {
        select: {
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
    },
    orderBy: { updated_at: "desc" },
  });

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
          Dialog Kinerja
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          Daftar dialog kinerja pegawai beserta status prosesnya.
        </p>
      </header>

      {dialogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ChartLineUp size={22} weight="bold" />
          </span>
          <h2 className="text-base font-semibold text-ink">
            Belum ada dialog kinerja
          </h2>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Mulai dialog kinerja baru dari halaman dashboard untuk pegawai Anda.
          </p>
        </div>
      ) : (
        <DialogList dialogs={dialogs} />
      )}
    </div>
  );
}
