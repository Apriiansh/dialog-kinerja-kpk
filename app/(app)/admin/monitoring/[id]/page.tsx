import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  UserIcon,
  CheckCircleIcon,
  HourglassIcon,
  FileTextIcon,
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { StatusBadge } from "@/components/shared/status-badge";
import { CapaianBadge } from "@/components/shared/capaian-badge";
import { formatPeriode } from "@/lib/constants/triwulan";
import { formatTanggal } from "@/lib/utils/format";
import { countFilledAspek } from "@/lib/utils/capaian";
import z from "zod";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { nama_pegawai: true },
  });
  return {
    title: user
      ? `Riwayat Dialog: ${user.nama_pegawai} - Monitoring Admin`
      : "Monitoring Pegawai",
  };
}

export default async function AdminPegawaiMonitoringPage({
  params,
}: PageProps) {
  const { id } = await params;
  await requireRole("ADMIN");

  const pegawaiId = id;
  if (!z.string().uuid().safeParse(pegawaiId).success) {
    notFound();
  }

  const pegawai = await prisma.user.findUnique({
    where: { id: pegawaiId },
    include: {
      atasan: {
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
      dialogAsPegawai: {
        orderBy: { created_at: "asc" },
        include: {
          atasan: {
            select: {
              nama_pegawai: true,
              nama_jabatan: true,
            },
          },
          dialog_induk: {
            select: {
              id: true,
              periode_tahun: true,
              triwulan: true,
            },
          },
          dialog_lanjutan: {
            select: { id: true },
          },
          aspek: {
            include: {
              item: {
                select: {
                  id: true,
                  is_tercapai: true,
                  dialog_evaluasi: true,
                },
              },
            },
          },
          reviu: {
            orderBy: { created_at: "asc" as const },
            select: {
              id: true,
              status: true,
              is_tercapai: true,
              is_tidak_tercapai: true,
              tanggal_next_evaluasi: true,
            },
          },
        },
      },
    },
  });

  if (!pegawai) notFound();

  const totalDialogs = pegawai.dialogAsPegawai.length;
  const selesaiCount = pegawai.dialogAsPegawai.filter(
    (d) => d.status === "selesai",
  ).length;
  const berjalanCount = totalDialogs - selesaiCount;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/monitoring"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Kembali ke Daftar Monitoring
        </Link>

        {/* Header Profil Pegawai */}
        <header className="flex flex-col gap-4 rounded-xl border border-outline bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                <UserIcon size={24} weight="bold" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold text-ink">
                    {pegawai.nama_pegawai}
                  </h1>
                  <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                    NPP: {pegawai.npp}
                  </span>
                  {pegawai.nip ? (
                    <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                      NIP: {pegawai.nip}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-ink-muted">
                  {pegawai.nama_jabatan ?? "Jabatan belum diatur"} ·{" "}
                  {pegawai.unit_kerja ?? "Unit Kerja belum diatur"}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                  {pegawai.atasan ? (
                    <span>
                      Atasan Langsung:{" "}
                      <strong className="font-semibold text-ink">
                        {pegawai.atasan.nama_pegawai}
                      </strong>
                    </span>
                  ) : null}
                  {pegawai.tanggal_bergabung ? (
                    <span>
                      Tgl Bergabung:{" "}
                      <strong className="font-semibold text-ink">
                        {formatTanggal(pegawai.tanggal_bergabung)}
                      </strong>
                    </span>
                  ) : null}
                  {pegawai.masa_kerja_unit_terakhir ? (
                    <span>
                      Masa Kerja Unit:{" "}
                      <strong className="font-semibold text-ink">
                        {pegawai.masa_kerja_unit_terakhir}
                      </strong>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Stat Ringkasan */}
            <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline bg-surface-soft px-3 py-1.5 text-xs font-semibold text-ink">
                  <FileTextIcon size={16} className="text-primary" weight="bold" />
                  {totalDialogs} Total Dialog
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <CheckCircleIcon size={16} weight="bold" />
                  {selesaiCount} Selesai
                </span>
                {berjalanCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                    <HourglassIcon size={16} weight="bold" />
                    {berjalanCount} Berjalan
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Daftar Dialog Kinerja Pegawai */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Daftar Riwayat Dialog Kinerja
            </h2>
            <p className="text-xs text-ink-muted">
              Seluruh tahapan dialog dan evaluasi kinerja yang dimiliki oleh pegawai ini.
            </p>
          </div>
          <span className="text-xs font-medium text-ink-muted">
            Menampilkan {totalDialogs} dokumen
          </span>
        </div>

        {totalDialogs === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-outline bg-surface p-12 text-center">
            <FileTextIcon size={32} className="text-ink-muted/50" />
            <h3 className="text-sm font-semibold text-ink">
              Belum Ada Dialog Kinerja
            </h3>
            <p className="text-xs text-ink-muted">
              Pegawai ini belum memiliki dokumen dialog kinerja dari atasan.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {pegawai.dialogAsPegawai.map((dialog, index) => {
              const sequenceNum = index + 1;
              const filledCount = countFilledAspek(dialog.aspek);
              const totalItems = dialog.aspek.reduce(
                (acc, curr) => acc + curr.item.length,
                0,
              );
              const latestReviu = dialog.reviu.at(-1);

              return (
                <li
                  key={dialog.id}
                  className="flex flex-col gap-4 rounded-xl border border-outline bg-surface p-5 transition-all hover:border-outline-strong hover:shadow-xs md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-2.5">
                    {/* Header baris */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base font-bold text-ink">
                        Dialog Ke-{sequenceNum} ({formatPeriode(dialog.triwulan, dialog.periode_tahun)})
                      </span>
                      <StatusBadge status={dialog.status} />
                      <CapaianBadge
                        statusDialog={dialog.status}
                        filledAspekCount={filledCount}
                        reviu={latestReviu}
                        items={dialog.aspek.flatMap((a) => a.item)}
                      />
                      {dialog.id_dialog_induk ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                          <ArrowsClockwiseIcon size={12} weight="bold" />
                          Lanjutan dari {formatPeriode(dialog.dialog_induk!.triwulan, dialog.dialog_induk!.periode_tahun)}
                        </span>
                      ) : null}
                    </div>

                    {/* Metadata baris */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                      <span>
                        Atasan:{" "}
                        <strong className="font-semibold text-ink">
                          {dialog.atasan.nama_pegawai}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Total Rencana:{" "}
                        <strong className="font-semibold text-ink">
                          {totalItems} Target Kegiatan
                        </strong>
                      </span>
                      {latestReviu?.tanggal_next_evaluasi ? (
                        <>
                          <span>•</span>
                          <span>
                            Jadwal Evaluasi Berikutnya:{" "}
                            <strong className="font-semibold text-ink">
                              {formatTanggal(latestReviu.tanggal_next_evaluasi)}
                            </strong>
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Tombol aksi */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/admin/monitoring/dialog/${dialog.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                    >
                      <span>Lihat Detail Dokumen</span>
                      <ArrowSquareOutIcon size={14} weight="bold" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
