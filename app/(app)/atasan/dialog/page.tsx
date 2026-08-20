import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { getAtasanPegawaiOptions } from "@/lib/queries/atasan";
import { DialogList } from "@/components/dialog/list";
import { NewDialogButton } from "@/components/dialog/create-button";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";

import { getDialogSequenceMap } from "@/lib/queries/dialog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DialogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ATASAN");
  const sp = await searchParams;
  const { page, skip, existingParams } = getPageParams(sp);

  const where = { id_atasan: session.id, status: { not: "selesai" as const } };

  const [dialogs, pegawai, total] = await Promise.all([
    prisma.dialogKinerja.findMany({
      where,
        select: {
          id: true,
          periode_tahun: true,
          triwulan: true,
          status: true,
          is_valid_pegawai: true,
          is_valid_atasan: true,
          id_dialog_induk: true,
          dialog_induk: { select: { periode_tahun: true, triwulan: true } },
          dialog_lanjutan: { select: { id: true } },
        pegawai: {
          select: {
            id: true,
            npp: true,
            nama_pegawai: true,
            nama_jabatan: true,
            unit_kerja: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    getAtasanPegawaiOptions(session.id),
    prisma.dialogKinerja.count({ where }),
  ]);

  const dialogIds = dialogs.map((d) => d.id);
  const seqMap = await getDialogSequenceMap(dialogIds);
  const dialogsWithSeq = dialogs.map((d) => ({
    ...d,
    sequence_number: seqMap.get(d.id),
  }));

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Dialog Kinerja
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Daftar dialog kinerja pegawai beserta status prosesnya.
          </p>
        </div>
        <NewDialogButton pegawai={pegawai} />
      </header>

      {dialogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ChartLineUpIcon size={22} weight="bold" />
          </span>
          <h2 className="text-base font-semibold text-ink">
            Belum ada dialog kinerja
          </h2>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Mulai dialog kinerja baru menggunakan tombol Mulai Dialog untuk
            pegawai Anda.
          </p>
        </div>
      ) : (
        <DialogList dialogs={dialogsWithSeq} />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        basePath="/atasan/dialog"
        existingParams={existingParams}
      />
    </div>
  );
}
