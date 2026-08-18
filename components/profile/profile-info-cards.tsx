import { formatTanggal } from "@/lib/utils/format";
import type { UserProfileData } from "@/lib/queries/profile";

export function ProfileInfoCards({ user }: { user: UserProfileData }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Panel 1: Data Identitas & Penempatan */}
      <section className="overflow-hidden rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            Data Identitas &amp; Kepegawaian
          </h2>
        </div>

        <div className="p-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Nomor Pokok Pegawai (NPP)
              </dt>
              <dd className="text-sm font-semibold text-ink">{user.npp}</dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Nomor Induk Pegawai (NIP)
              </dt>
              <dd className="text-sm font-semibold text-ink">
                {user.nip ?? "—"}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Nama Lengkap
              </dt>
              <dd className="text-sm font-semibold text-ink">
                {user.nama_pegawai}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Jabatan
              </dt>
              <dd className="text-sm text-ink">
                {user.nama_jabatan ?? "—"}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Unit Kerja
              </dt>
              <dd className="text-sm text-ink">
                {user.unit_kerja ?? "—"}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Status Keaktifan
              </dt>
              <dd className="text-sm">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                    user.is_active
                      ? "bg-status-green-soft text-status-green"
                      : "bg-surface-muted text-ink-muted"
                  }`}
                >
                  {user.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Panel 2: Masa Kerja & Riwayat Penugasan */}
      <section className="overflow-hidden rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            Masa Kerja &amp; Penugasan
          </h2>
        </div>

        <div className="p-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Tanggal Bergabung
              </dt>
              <dd className="text-sm text-ink">
                {user.tanggal_bergabung
                  ? formatTanggal(user.tanggal_bergabung)
                  : "—"}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Masa Kerja di Unit Terakhir
              </dt>
              <dd className="text-sm text-ink">
                {user.masa_kerja_unit_terakhir ?? "—"}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                Aktivitas Dialog Kinerja
              </dt>
              <dd className="text-sm text-ink">
                {user._count.dialogAsPegawai} Dialog sebagai Pegawai
                {user._count.dialogAsAtasan > 0 ? ` · ${user._count.dialogAsAtasan} sebagai Atasan` : ""}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Panel 3: Hierarki Organisasi & Atasan Langsung */}
      <section className="overflow-hidden rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            Hierarki &amp; Penilai
          </h2>
        </div>

        <div className="grid divide-y divide-outline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="p-5 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Atasan Langsung (Pejabat  )
            </span>
            {user.atasan ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">
                  {user.atasan.nama_pegawai}
                </span>
                <span className="text-xs text-ink-muted">
                  NPP {user.atasan.npp}
                  {user.atasan.nama_jabatan ? ` · ${user.atasan.nama_jabatan}` : ""}
                </span>
                {user.atasan.unit_kerja ? (
                  <span className="text-xs text-ink-muted">
                    {user.atasan.unit_kerja}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-sm text-ink-muted">
                Tidak memiliki atasan langsung.
              </span>
            )}
          </div>

          <div className="p-5 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
              Pegawai Bawahan Langsung
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">
                {user._count.bawahan} Pegawai
              </span>
              <span className="text-xs text-ink-muted">
                {user._count.bawahan > 0
                  ? "Pegawai yang berada di bawah pembinaan dan penilaian Anda."
                  : "Tidak ada bawahan langsung yang terdaftar."}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
