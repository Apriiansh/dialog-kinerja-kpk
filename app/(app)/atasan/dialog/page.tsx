import { ChartLineUpIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
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
  const { page, skip, existingParams } = getPageParams(sp, ["q", "tahun", "triwulan", "status"]);

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tahun = typeof sp.tahun === "string" ? sp.tahun.trim() : "";
  const triwulan = typeof sp.triwulan === "string" ? sp.triwulan.trim() : "";
  const status = typeof sp.status === "string" ? sp.status.trim() : "";

  const where: Record<string, unknown> = { id_atasan: session.id };
  if (status) {
    where.status = status;
  }
  if (tahun) {
    where.periode_tahun = Number(tahun);
  }
  if (triwulan) {
    where.triwulan = triwulan;
  }
  if (q) {
    where.pegawai = {
      OR: [
        { nama_pegawai: { contains: q } },
        { npp: { contains: q } },
        { nama_jabatan: { contains: q } },
      ],
    };
  }

  const [dialogs, pegawai, total, allDialogsForYears] = await Promise.all([
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
        reviu: {
          select: { status: true, is_tercapai: true, is_tidak_tercapai: true },
          orderBy: { created_at: "asc" as const },
        },
        aspek: {
          select: {
            tanggung_jawab_pegawai: true,
            item: { select: { id: true, is_tercapai: true } },
          },
        },
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
    prisma.dialogKinerja.findMany({
      where: { id_atasan: session.id },
      select: { periode_tahun: true },
      distinct: ["periode_tahun"],
    }),
  ]);

  const dialogIds = dialogs.map((d) => d.id);
  const seqMap = await getDialogSequenceMap(dialogIds);
  const dialogsWithSeq = dialogs.map((d) => ({
    ...d,
    sequence_number: seqMap.get(d.id),
  }));

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const availableYears = allDialogsForYears.map((d) => d.periode_tahun).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Dialog Kinerja Pegawai
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Daftar dialog kinerja pegawai beserta status prosesnya.
          </p>
        </div>
        <NewDialogButton pegawai={pegawai} />
      </header>

      {/* Filter & Search Bar */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={16}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari berdasarkan nama pegawai atau NPP..."
            className="h-10 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
          >
            <option value="">Semua Status</option>
            <option value="draft_atasan">Draft</option>
            <option value="menunggu_pegawai">Menunggu Pegawai</option>
            <option value="menunggu_atasan">Menunggu Atasan</option>
            <option value="menunggu_validasi">Menunggu Validasi</option>
            <option value="selesai">Selesai</option>
          </select>
          <select
            name="tahun"
            defaultValue={tahun}
            className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
          <select
            name="triwulan"
            defaultValue={triwulan}
            className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
          >
            <option value="">Semua Triwulan</option>
            <option value="TW1">Triwulan I</option>
            <option value="TW2">Triwulan II</option>
            <option value="TW3">Triwulan III</option>
            <option value="TW4">Triwulan IV</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            Terapkan
          </button>
          {q || tahun || triwulan || status ? (
            <Link
              href="/atasan/dialog"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      {dialogs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ChartLineUpIcon size={22} weight="bold" />
          </span>
          <h2 className="text-base font-semibold text-ink">
            Belum ada dialog kinerja yang cocok
          </h2>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            {q || tahun || triwulan || status
              ? "Coba ubah filter atau kata kunci pencarian Anda."
              : "Mulai dialog kinerja baru menggunakan tombol Mulai Dialog untuk pegawai Anda."}
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
