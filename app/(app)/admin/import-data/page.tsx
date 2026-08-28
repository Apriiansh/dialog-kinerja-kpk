import {
  FileArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  GaugeIcon,
  UserFocusIcon,
  FileTextIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { AspekImportDialog } from "@/components/admin/aspek-import-dialog";
import { formatPeriode } from "@/lib/constants/triwulan";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impor Data Evaluasi - Admin Dialog Kinerja KPK",
};

export default async function AdminImportDataPage() {
  await requireRole("ADMIN");

  // Fetch recent staging records to display monitoring
  const [stagingItems, totalStaging, pendingCount, consumedCount] = await Promise.all([
    prisma.importStagingItem.findMany({
      take: 20,
      orderBy: { imported_at: "desc" },
      include: {
        importer: { select: { nama_pegawai: true } },
      },
    }),
    prisma.importStagingItem.count(),
    prisma.importStagingItem.count({ where: { is_consumed: false } }),
    prisma.importStagingItem.count({ where: { is_consumed: true } }),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <FileTextIcon size={14} weight="bold" />
            Integrasi Batch
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Impor Data Evaluasi Kinerja
          </h1>
          <p className="text-sm text-ink-muted max-w-2xl">
            Unggah data evaluasi berkas Excel dari sistem eksternal untuk aspek SKP, Gap Asesmen, atau Perilaku secara batch. Data akan otomatis mengisi formulir dialog saat atasan memulai dialog kinerja.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <AspekImportDialog />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-5 shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <FileArrowUpIcon size={24} weight="duotone" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Total Data Staging
            </p>
            <p className="text-2xl font-extrabold text-ink">{totalStaging}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-5 shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ClockIcon size={24} weight="duotone" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Antrean (Belum Dibuat Dialog)
            </p>
            <p className="text-2xl font-extrabold text-amber-700">{pendingCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-outline bg-surface p-5 shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircleIcon size={24} weight="duotone" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Sudah Masuk ke Dialog
            </p>
            <p className="text-2xl font-extrabold text-emerald-700">{consumedCount}</p>
          </div>
        </div>
      </div>

      {/* 3 Aspect Information Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          Pedoman Format Data per Aspek
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Aspek A */}
          <div className="flex flex-col justify-between rounded-xl border border-outline bg-surface p-5 shadow-2xs space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                  A
                </span>
                <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <ChartBarIcon size={16} className="text-blue-600" weight="duotone" />
                  Sasaran Kinerja (SKP)
                </h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Data target KPI/SKP dari sistem HRIS. Sistem memfilter target dengan capaian di bawah 100% agar pegawai dan atasan dapat menyusun rencana tindak lanjut perbaikan.
              </p>
            </div>
            <div className="rounded-lg bg-surface-muted/60 p-3 text-[11px] font-mono text-ink space-y-1">
              <span className="text-ink-muted block text-[10px] uppercase font-sans font-bold">Kolom Utama:</span>
              <p>• NPP / NIP</p>
              <p>• Sasaran Kinerja / KPI</p>
              <p>• Target & Realisasi (% Capaian)</p>
            </div>
          </div>

          {/* Aspek B */}
          <div className="flex flex-col justify-between rounded-xl border border-outline bg-surface p-5 shadow-2xs space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs">
                  B
                </span>
                <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <GaugeIcon size={16} className="text-emerald-600" weight="duotone" />
                  Evaluasi Gap Asesmen
                </h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Hasil asesmen manajemen kompetensi. Menampilkan selisih antara level aktual pegawai dan level standar jabatan yang disyaratkan lembaga.
              </p>
            </div>
            <div className="rounded-lg bg-surface-muted/60 p-3 text-[11px] font-mono text-ink space-y-1">
              <span className="text-ink-muted block text-[10px] uppercase font-sans font-bold">Kolom Utama:</span>
              <p>• NPP / NIP</p>
              <p>• Nama Kompetensi</p>
              <p>• Level Saat Ini, Target, & Gap</p>
            </div>
          </div>

          {/* Aspek C */}
          <div className="flex flex-col justify-between rounded-xl border border-outline bg-surface p-5 shadow-2xs space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700 font-bold text-xs">
                  C
                </span>
                <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
                  <UserFocusIcon size={16} className="text-purple-600" weight="duotone" />
                  Evaluasi Perilaku
                </h3>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Evaluasi perilaku kerja pegawai dengan predikat resmi dan konversi persentase: <strong>Sangat Baik (150%)</strong>, <strong>Baik (100%)</strong>, <strong>Butuh Perbaikan (75%)</strong>, <strong>Kurang (50%)</strong>, dan <strong>Sangat Kurang (25%)</strong>.
              </p>
            </div>
            <div className="rounded-lg bg-surface-muted/60 p-3 text-[11px] font-mono text-ink space-y-1">
              <span className="text-ink-muted block text-[10px] uppercase font-sans font-bold">Kolom Utama:</span>
              <p>• NPP / NIP</p>
              <p>• Dimensi / Aspek Perilaku</p>
              <p>• Nilai (Predikat Kinerja) & Catatan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staging Data Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">
            Riwayat Antrean Data Staging Terakhir
          </h2>
          <span className="text-xs text-ink-muted">
            Menampilkan 20 data terbaru
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-outline bg-surface shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-outline bg-surface-muted/60">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3">NPP</th>
                  <th className="px-4 py-3">Aspek</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Narasi yang Disiapkan</th>
                  <th className="px-4 py-3">Status Staging</th>
                  <th className="px-4 py-3 text-right">Diunggah Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {stagingItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                      Belum ada data staging yang diimpor. Klik tombol &quotImpor Data Evaluasi&quot di atas untuk memulai.
                    </td>
                  </tr>
                ) : (
                  stagingItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-muted/30">
                      <td className="px-4 py-3 font-mono font-bold text-ink">
                        {item.npp}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.jenis_aspek === "SKP"
                              ? "bg-blue-50 text-blue-700"
                              : item.jenis_aspek === "GAP_ASESMEN"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {item.jenis_aspek}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink font-medium">
                        {formatPeriode(item.triwulan, item.periode_tahun)}
                      </td>
                      <td className="px-4 py-3 text-ink max-w-md truncate">
                        {item.narasi}
                      </td>
                      <td className="px-4 py-3">
                        {item.is_consumed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <CheckCircleIcon size={12} weight="fill" />
                            Diterapkan ke Dialog #{item.id_dialog}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            <ClockIcon size={12} weight="bold" />
                            Menunggu Dialog Dibuat
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-ink-muted">
                        {item.importer?.nama_pegawai ?? "Admin"} ·{" "}
                        {item.imported_at.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
