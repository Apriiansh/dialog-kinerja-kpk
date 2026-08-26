import {
  PlusIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
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
  const { page, skip, existingParams } = getPageParams(sp, ["q", "status", "unit"]);

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "all";
  const unit = typeof sp.unit === "string" ? sp.unit.trim() : "";

  const and: Prisma.UserWhereInput[] = [{ id_atasan: session.id }];

  if (q) {
    and.push({
      OR: [
        { nama_pegawai: { contains: q } },
        { npp: { contains: q } },
        { nip: { contains: q } },
        { nama_jabatan: { contains: q } },
        { unit_kerja: { contains: q } },
      ],
    });
  }

  if (status === "active") and.push({ is_active: true });
  else if (status === "inactive") and.push({ is_active: false });

  if (unit) and.push({ unit_kerja: unit });

  const where: Prisma.UserWhereInput = { AND: and };

  const [pegawai, total, activeCount, allUnits] = await Promise.all([
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
    prisma.user.count({ where: { id_atasan: session.id, is_active: true } }),
    prisma.user.findMany({
      where: { id_atasan: session.id, unit_kerja: { not: null } },
      select: { unit_kerja: true },
      distinct: ["unit_kerja"],
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const rows = pegawai.map((p) => ({ pegawai: p }));
  const units = allUnits
    .map((u) => u.unit_kerja)
    .filter((u): u is string => Boolean(u))
    .sort();

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
            placeholder="Cari berdasarkan nama, NPP, atau jabatan..."
            className="h-10 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          {units.length > 0 ? (
            <select
              name="unit"
              defaultValue={unit}
              className="h-10 rounded-lg border border-outline bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
            >
              <option value="">Semua Unit Kerja</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            Terapkan
          </button>
          {q || (status && status !== "all") || unit ? (
            <Link
              href="/atasan/pegawai"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      {pegawai.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <UsersIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            {q || status !== "all" || unit
              ? "Tidak ada pegawai yang cocok"
              : "Belum ada pegawai"}
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            {q || status !== "all" || unit
              ? "Coba ubah kata kunci pencarian atau reset filter."
              : "Tambahkan pegawai yang menjadi bawahan Anda agar dapat membuat dialog kinerja."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <Table>
            <TableHeader className="bg-surface-muted/60">
              <TableRow className="border-outline hover:bg-transparent">
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Nama
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  NIP / NPP
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Unit Kerja &amp; Jabatan
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
