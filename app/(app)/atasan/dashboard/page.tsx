import {
  ArrowRight,
  ChartLineUp,
  CheckCircle,
  ChatCircleDots,
  Hourglass,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { RoleTag } from "@/components/role-tag";
import { DialogList } from "@/components/dialog-list";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function AtasanDashboardPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { unit_kerja: true },
  });

  const [pegawaiCount, dialogs] = await Promise.all([
    prisma.user.count({
      where: user?.unit_kerja
        ? { role: "PEGAWAI", unit_kerja: user.unit_kerja }
        : { role: "PEGAWAI" },
    }),
    prisma.dialogKinerja.findMany({
      where: { id_atasan: session.id },
      select: {
        id: true,
        id_pegawai: true,
        periode_tahun: true,
        status: true,
        is_valid_pegawai: true,
        is_valid_atasan: true,
        updated_at: true,
        pegawai: {
          select: {
            npp: true,
            nama_pegawai: true,
            nama_jabatan: true,
            unit_kerja: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    }),
  ]);

  const drafts = dialogs.filter((d) => d.status === "draft_atasan");

  const stats = [
    {
      label: "Pegawai",
      value: pegawaiCount,
      hint: "bawahan di unit kerja",
      icon: Users,
    },
    {
      label: "Dialog Kinerja",
      value: dialogs.length,
      hint: "total periode berjalan",
      icon: ChatCircleDots,
    },
    {
      label: "Menunggu Anda",
      value: dialogs.filter((d) => d.status === "menunggu_atasan").length,
      hint: "perlu tindakan atasan",
      icon: Hourglass,
    },
    {
      label: "Selesai",
      value: dialogs.filter((d) => d.status === "selesai").length,
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
            Kelola dialog kinerja pegawai Anda di sini.
          </p>
        </div>
        <RoleTag role={session.role} />
      </header>

      <section
        aria-label="Ringkasan kinerja"
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

      <section aria-label="Daftar dialog kinerja" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">
            Dialog Kinerja Pegawai
          </h2>
          <Link
            href="/atasan/dialog"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
          >
            Kelola Dialog Kinerja
            <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ChartLineUp size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              Belum ada dialog draft
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Mulai dialog kinerja untuk pegawai Anda; dialog yang sudah
              dikirim akan masuk ke riwayat.
            </p>
          </div>
        ) : (
          <DialogList dialogs={drafts} />
        )}
      </section>
    </div>
  );
}
