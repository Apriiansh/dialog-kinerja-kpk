import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ReviuForm } from "@/components/reviu-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buat Reviu - Dialog Kinerja KPK",
};

export default async function NewReviuPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("PEGAWAI");
  const sp = await searchParams;
  const rawDialogId = typeof sp.dialog === "string" ? Number(sp.dialog) : NaN;

  const selesaiDialogs = await prisma.dialogKinerja.findMany({
    where: { id_pegawai: session.id, status: "selesai" },
    select: {
      id: true,
      periode_tahun: true,
      atasan: { select: { nama_pegawai: true, nama_jabatan: true } },
    },
    orderBy: { updated_at: "desc" },
  });

  let selectedDialogId: number | null = null;
  if (!Number.isNaN(rawDialogId)) {
    const exists = selesaiDialogs.some((d) => d.id === rawDialogId);
    if (!exists) notFound();
    selectedDialogId = rawDialogId;
  }

  const selected = selesaiDialogs.find((d) => d.id === selectedDialogId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/pegawai/reviu"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Kembali ke Reviu
        </Link>
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
          Buat Reviu Hasil Dialog Kinerja
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          Reviu dibuat sebagai tindak lanjut dari dialog kinerja yang telah
          selesai.
        </p>
      </div>

      {selectedDialogId === null ? (
        selesaiDialogs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ArrowsClockwiseIcon size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              Belum ada dialog yang selesai
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Reviu hanya dapat dibuat untuk dialog kinerja yang telah selesai
              divalidasi.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-ink">
              Pilih dialog kinerja yang sudah selesai
            </span>
            <ul className="flex flex-col gap-3">
              {selesaiDialogs.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/pegawai/reviu/new?dialog=${d.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-outline bg-surface px-5 py-4 transition-colors hover:border-outline-strong hover:shadow-ambient"
                  >
                    <span className="text-sm font-semibold text-ink">
                      Dialog Kinerja Tahun {d.periode_tahun}
                    </span>
                    <span className="text-xs leading-4 text-ink-muted">
                      Atasan Penilai:{" "}
                      <strong className="font-medium text-ink">
                        {d.atasan.nama_pegawai}
                      </strong>
                      {d.atasan.nama_jabatan
                        ? ` (${d.atasan.nama_jabatan})`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-outline bg-surface px-5 py-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Dialog Kinerja Tahun {selected?.periode_tahun}
            </span>
            <p className="mt-1 text-sm leading-5 text-ink">
              Atasan Penilai: {selected?.atasan.nama_pegawai}
              {selected?.atasan.nama_jabatan
                ? ` (${selected?.atasan.nama_jabatan})`
                : ""}
            </p>
          </div>

          <ReviuForm dialogId={selectedDialogId} />
        </div>
      )}

    </div>
  );
}
