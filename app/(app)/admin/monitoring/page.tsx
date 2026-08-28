import Link from "next/link";
import {
  MonitorPlayIcon,
  MagnifyingGlassIcon,
  UserIcon,
  FileTextIcon,
  ArrowSquareOutIcon,
  UsersIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { CapaianBadge } from "@/components/shared/capaian-badge";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { getPageParams } from "@/lib/utils/pagination";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Monitoring Dialog Kinerja - Admin",
};

export default async function AdminMonitoringPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const { page, skip, existingParams } = getPageParams(sp, ["q", "unit"]);

  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const unit = typeof sp.unit === "string" ? sp.unit.trim() : "";

  const whereUser: Record<string, unknown> = {
    is_active: true,
    as_pegawai: true,
  };

  if (q) {
    whereUser.OR = [
      { nama_pegawai: { contains: q } },
      { npp: { contains: q } },
      { nama_jabatan: { contains: q } },
      { unit_kerja: { contains: q } },
    ];
  }

  if (unit) {
    whereUser.unit_kerja = unit;
  }

  const [pegawaiList, totalPegawai, allUnits, totalAllDialogs, totalSelesaiDialogs] =
    await Promise.all([
      prisma.user.findMany({
        where: whereUser,
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
          atasan: {
            select: {
              nama_pegawai: true,
              nama_jabatan: true,
            },
          },
          dialogAsPegawai: {
            orderBy: { id: "desc" },
            select: {
              id: true,
              periode_tahun: true,
              triwulan: true,
              status: true,
              aspek: {
                select: {
                  tanggung_jawab_pegawai: true,
                  item: { select: { is_tercapai: true } },
                },
              },
              reviu: {
                orderBy: { id: "desc" },
                take: 1,
                select: {
                  status: true,
                  is_tercapai: true,
                  is_tidak_tercapai: true,
                },
              },
            },
          },
        },
        orderBy: { nama_pegawai: "asc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.user.count({ where: whereUser }),
      prisma.user.findMany({
        where: { is_active: true, unit_kerja: { not: null } },
        select: { unit_kerja: true },
        distinct: ["unit_kerja"],
      }),
      prisma.dialogKinerja.count(),
      prisma.dialogKinerja.count({ where: { status: "selesai" } }),
    ]);

  const totalPages = Math.ceil(totalPegawai / PAGE_SIZE);
  const units = allUnits
    .map((u) => u.unit_kerja)
    .filter((u): u is string => Boolean(u))
    .sort();

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Monitoring Dialog Kinerja Pegawai
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Pantau perkembangan dan riwayat dialog kinerja seluruh pegawai per individu secara terpusat.
          </p>
        </div>
      </header>

      {/* Ringkasan Metrik Global */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <UsersIcon size={20} weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink-muted">Total Pegawai</span>
            <span className="text-xl font-bold text-ink">{totalPegawai} Pegawai</span>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-indigo-soft text-status-indigo">
            <FileTextIcon size={20} weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink-muted">Total Dokumen Dialog</span>
            <span className="text-xl font-bold text-ink">{totalAllDialogs} Dialog</span>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircleIcon size={20} weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink-muted">Selesai Terevaluasi</span>
            <span className="text-xl font-bold text-emerald-800">{totalSelesaiDialogs} Dialog</span>
          </div>
        </div>
      </div>

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

        <div className="flex items-center gap-2.5">
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
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
          >
            Terapkan
          </button>
          {q || unit ? (
            <Link
              href="/admin/monitoring"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-outline px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      {/* Tabel Monitoring (1 Baris per Pegawai) */}
      {pegawaiList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-primary">
            <MonitorPlayIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Tidak ada pegawai yang ditemukan
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Coba ubah kata kunci pencarian atau reset filter unit kerja.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline bg-surface shadow-xs">
          <table className="w-full text-left">
            <thead className="border-b border-outline bg-surface-muted/50">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                <th className="px-5 py-3.5">Pegawai</th>
                <th className="px-5 py-3.5">Jabatan & Unit Kerja</th>
                <th className="px-5 py-3.5">Atasan Penilai</th>
                <th className="px-5 py-3.5 text-center">Riwayat Dialog</th>
                <th className="px-5 py-3.5">Capaian Terkini</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              {pegawaiList.map((p) => {
                const totalDialog = p.dialogAsPegawai.length;
                const latestDialog = p.dialogAsPegawai[0];
                const latestReviu = latestDialog?.reviu?.[0];
                const filledCount = latestDialog
                  ? latestDialog.aspek.filter(
                      (a) =>
                        (a.tanggung_jawab_pegawai?.trim() ?? "") !== "" ||
                        a.item.length > 0,
                    ).length
                  : 0;

                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-surface-muted/40"
                  >
                    {/* Pegawai */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted font-bold text-xs">
                          <UserIcon size={16} weight="bold" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-ink">
                            {p.nama_pegawai}
                          </span>
                          <span className="text-xs text-ink-muted font-mono">
                            NPP: {p.npp}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan & Unit Kerja */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-ink">
                        <span className="font-medium text-ink">
                          {p.nama_jabatan ?? "—"}
                        </span>
                        <span className="text-ink-muted">
                          {p.unit_kerja ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Atasan Penilai */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-ink">
                        {p.atasan?.nama_pegawai ?? "Belum ditentukan"}
                      </span>
                    </td>

                    {/* Riwayat Dialog */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink">
                        <FileTextIcon size={13} weight="bold" className="text-primary" />
                        {totalDialog} Dokumen
                      </span>
                    </td>

                    {/* Capaian Terkini */}
                    <td className="px-5 py-4">
                      {latestDialog ? (
                        <CapaianBadge
                          statusDialog={latestDialog.status}
                          filledAspekCount={filledCount}
                          reviu={latestReviu}
                          items={latestDialog.aspek.flatMap((a) => a.item)}
                        />
                      ) : (
                        <span className="text-xs text-ink-muted italic">
                          Belum ada dialog
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/monitoring/${p.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-soft px-3 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-faint"
                      >
                        <span>Lihat Riwayat</span>
                        <ArrowSquareOutIcon size={14} weight="bold" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalPegawai}
        basePath="/admin/monitoring"
        existingParams={existingParams}
      />
    </div>
  );
}
