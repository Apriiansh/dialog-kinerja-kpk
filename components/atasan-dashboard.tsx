import {
  BuildingsIcon,
  BriefcaseIcon,
  ChartLineUpIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { RoleTag } from "@/components/role-tag";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export async function AtasanDashboard() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { npp: true, nama_jabatan: true, unit_kerja: true },
  });

  const profile = [
    { label: "NPP", value: user?.npp ?? session.npp, icon: IdentificationCardIcon },
    { label: "Jabatan", value: user?.nama_jabatan ?? "—", icon: BriefcaseIcon },
    { label: "Unit Kerja", value: user?.unit_kerja ?? "—", icon: BuildingsIcon },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            {greeting()}, {session.nama}
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Pantau dan kelola dialog kinerja Anda di sini.
          </p>
        </div>
        <RoleTag role={session.role} />
      </header>

      <section aria-label="Ringkasan profil" className="rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline px-6 py-4">
          <h2 className="text-sm font-semibold text-ink">Data Kepegawaian</h2>
        </div>
        <dl className="grid gap-6 px-6 py-5 sm:grid-cols-3">
          {profile.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                <Icon size={18} weight="bold" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                  {label}
                </dt>
                <dd className="truncate text-sm font-medium text-ink">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Daftar dialog kinerja" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-ink">Dialog Kinerja</h2>
          <span className="text-xs font-medium text-ink-muted">0 aktif</span>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <ChartLineUpIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Belum ada dialog kinerja
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Dialog kinerja yang Anda buat atau terima akan muncul di sini beserta
            status prosesnya.
          </p>
        </div>
      </section>
    </div>
  );
}