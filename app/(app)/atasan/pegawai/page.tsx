import {
  PlusIcon,
  Users,
  UserCircle,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PegawaiStatusToggle } from "@/components/pegawai-status-toggle";
import { PegawaiDeleteButton } from "@/components/pegawai-delete-button";
import { formatTanggal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AtasanPegawaiPage() {
  const session = await requireRole("ATASAN");

  const pegawai = await prisma.user.findMany({
    where: { id_atasan: session.id },
    select: {
      id: true,
      npp: true,
      nip: true,
      nama_pegawai: true,
      nama_jabatan: true,
      unit_kerja: true,
      tanggal_bergabung: true,
      is_active: true,
    },
    orderBy: [{ is_active: "desc" }, { nama_pegawai: "asc" }],
  });

  const activeCount = pegawai.filter((p) => p.is_active).length;

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
            <Users size={22} weight="bold" />
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
          <div className="hidden grid-cols-[1fr_140px_140px_110px_130px_150px] gap-4 border-b border-outline bg-surface-muted/60 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted lg:grid">
            <span>Nama / NPP</span>
            <span>Jabatan</span>
            <span>Unit Kerja</span>
            <span>Bergabung</span>
            <span>Status</span>
            <span className="text-right">Aksi</span>
          </div>
          <ul className="divide-y divide-outline">
            {pegawai.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 px-5 py-4 lg:grid lg:grid-cols-[1fr_140px_140px_110px_130px_150px] lg:items-center lg:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      p.is_active
                        ? "bg-surface-muted text-primary"
                        : "bg-surface-muted text-ink-muted/60"
                    }`}
                  >
                    <UserCircle size={20} weight="fill" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/atasan/pegawai/${p.id}/edit`}
                      className="truncate text-sm font-semibold text-ink transition-colors hover:text-primary"
                    >
                      {p.nama_pegawai}
                    </Link>
                    <span
                      className={`text-xs ${
                        p.is_active ? "text-ink-muted" : "text-ink-muted/60"
                      }`}
                    >
                      NPP {p.npp}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm ${p.is_active ? "text-ink" : "text-ink-muted/60"}`}
                >
                  {p.nama_jabatan ?? "—"}
                </span>
                <span
                  className={`text-sm ${p.is_active ? "text-ink" : "text-ink-muted/60"}`}
                >
                  {p.unit_kerja ?? "—"}
                </span>
                <span
                  className={`text-sm ${p.is_active ? "text-ink" : "text-ink-muted/60"}`}
                >
                  {p.tanggal_bergabung ? formatTanggal(p.tanggal_bergabung) : "—"}
                </span>
                <PegawaiStatusToggle
                  id={p.id}
                  nama={p.nama_pegawai}
                  isActive={p.is_active}
                />
                <div className="flex items-center justify-start gap-2 lg:justify-end">
                  <Link
                    href={`/atasan/pegawai/${p.id}/edit`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
                  >
                    <PencilSimple size={14} weight="bold" />
                    Edit
                  </Link>
                  {!p.is_active ? (
                    <PegawaiDeleteButton id={p.id} nama={p.nama_pegawai} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}