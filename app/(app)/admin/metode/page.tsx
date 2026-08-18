import {
  PlusIcon,
  ListChecksIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { AdminMetodeStatusToggle } from "@/components/admin/metode-status-toggle";
import { AdminMetodeDeleteButton } from "@/components/admin/metode-delete-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminMetodePage() {
  await requireRole("ADMIN");

  const metodeList = await prisma.masterMetodePengembangan.findMany({
    select: {
      id: true,
      nama_metode: true,
      is_active: true,
      _count: { select: { dialogItems: true } },
    },
    orderBy: [{ is_active: "desc" }, { nama_metode: "asc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Metode Pengembangan
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {metodeList.filter((m) => m.is_active).length} metode aktif dari
            total {metodeList.length}.
          </p>
        </div>
        <Link
          href="/admin/metode/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
        >
          <PlusIcon size={16} weight="bold" />
          Tambah Metode
        </Link>
      </header>

      {metodeList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ListChecksIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada metode pengembangan
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Tambahkan metode pengembangan pertama untuk dipakai sebagai pilihan
            pada dialog kinerja.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline bg-surface">
          <Table>
            <TableHeader className="bg-surface-muted/60">
              <TableRow className="border-outline hover:bg-transparent">
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Nama Metode
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Digunakan
                </TableHead>
                <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Status
                </TableHead>
                <TableHead className="h-11 px-5 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metodeList.map((m) => (
                <TableRow
                  key={m.id}
                  className="border-outline hover:bg-surface-muted/40"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex min-w-0 flex-col">
                      <Link
                        href={`/admin/metode/${m.id}/edit`}
                        className={`truncate text-sm font-semibold text-ink transition-colors hover:text-primary ${m.is_active ? "" : "text-ink-muted/60"}`}
                      >
                        {m.nama_metode}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell
                    className={`px-5 py-4 text-sm ${m.is_active ? "text-ink" : "text-ink-muted/60"}`}
                  >
                    {m._count.dialogItems} item dialog
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <AdminMetodeStatusToggle
                      id={m.id}
                      nama={m.nama_metode}
                      isActive={m.is_active}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/metode/${m.id}/edit`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
                      >
                        <PencilSimpleIcon size={14} weight="bold" />
                        Edit
                      </Link>
                      <AdminMetodeDeleteButton
                          id={m.id}
                          nama={m.nama_metode}
                          digunakan={m._count.dialogItems}
                        />
                    </div>
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