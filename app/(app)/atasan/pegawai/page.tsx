import {
  PlusIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { PegawaiTableBody } from "@/components/pegawai/pegawai-table-body";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AtasanPegawaiPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("ATASAN");
  const sp = await searchParams;
  const { page, skip, existingParams } = getPageParams(sp);

  const where = { id_atasan: session.id };

  const [pegawai, total, activeCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        npp: true,
        nip: true,
        nama_pegawai: true,
        nama_jabatan: true,
        unit_kerja: true,
        is_active: true,
      },
      orderBy: [{ is_active: "desc" }, { nama_pegawai: "asc" }],
      skip,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, is_active: true } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const rows = pegawai.map((p) => ({ pegawai: p }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Pegawai
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {activeCount} pegawai aktif di bawah Anda.
          </p>
        </div>
        <Link
          href="/atasan/pegawai/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
        >
          <PlusIcon size={16} weight="bold" />
          Tambah Pegawai
        </Link>
      </header>

      {pegawai.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <UsersIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada pegawai
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Tambahkan pegawai yang menjadi bawahan Anda agar dapat membuat
            dialog kinerja.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <Table>
            <TableHeader className="bg-surface-muted/60">
              <TableRow className="border-outline hover:bg-transparent">
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Nama
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  NIP / NPP
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Unit Kerja & Jabatan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <PegawaiTableBody rows={rows} />
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        basePath="/atasan/pegawai"
        existingParams={existingParams}
      />
    </div>
  );
}
