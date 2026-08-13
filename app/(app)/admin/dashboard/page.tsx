import {
  Users,
  ChatCircleDots,
  CheckCircle,
  Hourglass,
  ShieldCheck,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { RoleTag } from "@/components/role-tag";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function AdminDashboardPage() {
  const session = await requireRole("ADMIN");

  const [userCount, activeUserCount, dialogCount, inProgressCount, doneCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.dialogKinerja.count(),
      prisma.dialogKinerja.count({
        where: { status: { not: "selesai" } },
      }),
      prisma.dialogKinerja.count({ where: { status: "selesai" } }),
    ]);

  const recentDialogs = await prisma.dialogKinerja.findMany({
    select: {
      id: true,
      periode_tahun: true,
      status: true,
      updated_at: true,
      pegawai: { select: { nama_pegawai: true, npp: true } },
      atasan: { select: { nama_pegawai: true } },
    },
    orderBy: { updated_at: "desc" },
    take: 5,
  });

  const stats = [
    {
      label: "Pengguna Aktif",
      value: activeUserCount,
      hint: `dari ${userCount} total pengguna`,
      icon: Users,
    },
    {
      label: "Dialog Kinerja",
      value: dialogCount,
      hint: "total semua periode",
      icon: ChatCircleDots,
    },
    {
      label: "Berjalan",
      value: inProgressCount,
      hint: "belum selesai",
      icon: Hourglass,
    },
    {
      label: "Selesai",
      value: doneCount,
      hint: "validasi lengkap",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            {greeting()}, {session.nama}
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Pantau pengguna dan dialog kinerja di seluruh organisasi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleTag role={session.role} />
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted">
            <ShieldCheck size={14} weight="fill" />
            Super User
          </span>
        </div>
      </header>

      <section
        aria-label="Ringkasan sistem"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, hint, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-3 rounded-lg border border-outline bg-surface p-5"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                <Icon size={18} weight="bold" />
              </span>
              <span className="text-2xl font-semibold leading-8 text-ink">
                {value}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="text-xs leading-4 text-ink-muted">{hint}</span>
            </div>
          </div>
        ))}
      </section>

      <section aria-label="Dialog terbaru" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Dialog Kinerja Terbaru</h2>
          <Link
            href="/admin/monitoring"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
          >
            Monitoring Dialog Kinerja
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
        {recentDialogs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ChatCircleDots size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              Belum ada dialog kinerja
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Dialog kinerja yang dibuat atasan akan tampil di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-outline bg-surface">
            <ul className="divide-y divide-outline">
              {recentDialogs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-ink">
                      {d.pegawai?.nama_pegawai}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {d.pegawai?.npp} · Tahun {d.periode_tahun} · Atasan:{" "}
                      {d.atasan?.nama_pegawai}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-md bg-surface-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}