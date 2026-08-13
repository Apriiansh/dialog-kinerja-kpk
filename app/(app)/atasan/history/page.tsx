import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { DialogList } from "@/components/dialog-list";

export default async function HistoryPage() {
  const session = await requireRole("ATASAN");

  const dialogs = await prisma.dialogKinerja.findMany({
    where: { id_atasan: session.id, status: { not: "draft_atasan" } },
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
          Riwayat Dialog
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          Dialog kinerja yang sudah dikirim dan diproses.
        </p>
      </header>

      {dialogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ClockCounterClockwise size={22} weight="bold" />
          </span>
          <h2 className="text-base font-semibold text-ink">
            Belum ada riwayat
          </h2>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Dialog yang sudah Anda kirim akan tercatat di sini beserta status
            prosesnya.
          </p>
        </div>
      ) : (
        <DialogList dialogs={dialogs} />
      )}
    </div>
  );
}
