import Link from "next/link";
import {
  PlusIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminUnitTree } from "@/components/admin/unit-tree";

export const dynamic = "force-dynamic";

export default async function AdminStrukturOrganisasiPage() {
  await requireRole("ADMIN");

  const units = await prisma.unitKerja.findMany({
    orderBy: [{ level: "asc" }, { nama_unit: "asc" }],
    select: {
      id: true,
      nama_unit: true,
      jenis: true,
      kepala_jabatan: true,
      level: true,
      is_active: true,
      parent_id: true,
      _count: { select: { users: true, children: true } },
    },
  });

  const total = units.length;
  const activeCount = units.filter((u) => u.is_active).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Struktur Organisasi
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {activeCount} unit aktif dari total {total}.
          </p>
        </div>
        <Link
          href="/admin/struktur-organisasi/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
        >
          <PlusIcon size={16} weight="bold" />
          Tambah Unit
        </Link>
      </header>

      {units.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <TreeStructureIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada unit organisasi
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Tambahkan unit pertama untuk membangun struktur organisasi.
          </p>
        </div>
      ) : (
        <AdminUnitTree
          units={units.map((u) => ({
            id: u.id,
            nama_unit: u.nama_unit,
            jenis: u.jenis,
            kepala_jabatan: u.kepala_jabatan,
            level: u.level,
            is_active: u.is_active,
            parent_id: u.parent_id,
            childCount: u._count.children,
            userCount: u._count.users,
          }))}
        />
      )}
    </div>
  );
}
