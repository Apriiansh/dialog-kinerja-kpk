import {
  PlusIcon,
  UsersIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PegawaiStatusToggle } from "@/components/pegawai-status-toggle";
import {
  aktifkanPegawai,
  deletePegawai,
  nonaktifkanPegawai,
} from "@/lib/actions/pegawai-admin";
import { PegawaiDetailModal } from "@/components/pegawai-detail-modal";
import { mapPegawaiDetail } from "@/lib/pegawai-detail-map";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      masa_kerja_unit_terakhir: true,
      is_admin: true,
      as_pegawai: true,
      is_active: true,
      atasan: { select: { nama_pegawai: true } },
      _count: { select: { bawahan: true } },
      bawahan: {
        select: {
          id: true,
          npp: true,
          nip: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
          tanggal_bergabung: true,
          masa_kerja_unit_terakhir: true,
          is_admin: true,
          as_pegawai: true,
          is_active: true,
          atasan: { select: { nama_pegawai: true } },
          _count: { select: { bawahan: true } },
          bawahan: {
            select: {
              id: true,
              npp: true,
              nip: true,
              nama_pegawai: true,
              nama_jabatan: true,
              unit_kerja: true,
              tanggal_bergabung: true,
              masa_kerja_unit_terakhir: true,
              is_admin: true,
              as_pegawai: true,
              is_active: true,
              atasan: { select: { nama_pegawai: true } },
              _count: { select: { bawahan: true } },
            },
          },
        },
      },
    },
    orderBy: [{ is_active: "desc" }, { nama_pegawai: "asc" }],
  });

  const rows = pegawai.map((p) => ({
    p,
    detail: mapPegawaiDetail(p, (id) => `/atasan/pegawai/${id}/edit`),
  }));

  const activeCount = rows.filter((r) => r.p.is_active).length;

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
                  Nama / NPP
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ p, detail }) => (
                <TableRow
                  key={p.id}
                  className="border-outline hover:bg-surface-muted/40"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                        <UserCircleIcon size={20} weight="fill" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <PegawaiDetailModal
                          user={detail}
                          onToggleStatus={{
                            activate: aktifkanPegawai.bind(null, p.id),
                            deactivate: nonaktifkanPegawai.bind(null, p.id),
                            deactivateConfirm: `Nonaktifkan ${p.nama_pegawai}? Pegawai tidak dapat masuk sampai diaktifkan kembali.`,
                            successMessage: "Status pegawai berhasil diubah",
                            errorMessage:
                              "Terjadi kesalahan saat mengubah status. Silakan coba lagi.",
                          }}
                          onDelete={{
                            action: deletePegawai.bind(null, p.id),
                            confirmMessage: `Hapus permanen ${p.nama_pegawai}? Tindakan ini tidak dapat dibatalkan.`,
                            successMessage: "Pegawai berhasil dihapus",
                            errorMessage:
                              "Terjadi kesalahan saat menghapus. Silakan coba lagi.",
                          }}
                        >
                          {p.nama_pegawai}
                        </PegawaiDetailModal>
                        <span
                          className={`text-xs ${p.is_active ? "text-ink-muted" : "text-ink-muted/60"
                            }`}
                        >
                          NPP {p.npp}
                        </span>
                        <span className="truncate text-xs text-ink-muted">
                          {[p.nama_jabatan, p.unit_kerja]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <PegawaiStatusToggle
                      id={p.id}
                      nama={p.nama_pegawai}
                      isActive={p.is_active}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}