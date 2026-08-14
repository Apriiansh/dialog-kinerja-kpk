import Link from "next/link";
import {
  ArrowsClockwiseIcon,
  PencilSimpleIcon,
  SealCheckIcon,
  HourglassIcon,
  CheckCircleIcon,
  AlarmIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/session";
import {
  getPegawaiReviuList,
  getPegawaiSelesaiDialogOptions,
} from "@/lib/reviu-queries";
import { NewReviuButton } from "@/components/new-reviu-button";
import { ReviuStatusBadge } from "@/components/reviu-status-badge";
import { TindakLanjutBadge } from "@/components/tindak-lanjut-badge";
import { UnduhWordLink } from "@/components/unduh-word-link";
import { formatTanggal, toDateInput } from "@/lib/format";
import type { StatusReviu } from "@/generated/prisma/enums";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "Reviu Dialog Kinerja - Dialog Kinerja KPK",
};

const CTA: Record<
  StatusReviu,
  { label: string; href: (id: number) => string; variant: "primary" | "plain" }
> = {
  draft_pegawai: {
    label: "Lanjutkan",
    href: (id) => `/pegawai/reviu/${id}/edit`,
    variant: "primary",
  },
  menunggu_atasan: {
    label: "Lihat Detail",
    href: (id) => `/pegawai/reviu/${id}`,
    variant: "plain",
  },
  menunggu_validasi: {
    label: "Validasi",
    href: (id) => `/pegawai/reviu/${id}`,
    variant: "primary",
  },
  selesai: {
    label: "Lihat Detail",
    href: (id) => `/pegawai/reviu/${id}`,
    variant: "plain",
  },
};

const VALID_STATUSES: StatusReviu[] = [
  "draft_pegawai",
  "menunggu_atasan",
  "menunggu_validasi",
  "selesai",
];

const FILTERS: { key: StatusReviu | "semua"; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "draft_pegawai", label: "Draft" },
  { key: "menunggu_atasan", label: "Menunggu Atasan" },
  { key: "menunggu_validasi", label: "Menunggu Validasi" },
  { key: "selesai", label: "Selesai" },
];

export default async function PegawaiReviuListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireRole("PEGAWAI");
  const sp = await searchParams;
  const rawStatus = typeof sp.status === "string" ? sp.status : undefined;
  const activeStatus: StatusReviu | "semua" =
    rawStatus && (VALID_STATUSES as string[]).includes(rawStatus)
      ? (rawStatus as StatusReviu)
      : "semua";

  const [reviuList, selesaiDialogs] = await Promise.all([
    getPegawaiReviuList(session.id),
    getPegawaiSelesaiDialogOptions(session.id),
  ]);

  const today = new Date();
  const todayInput = toDateInput(today);

  const seenDialogIds = new Set<number>();
  const reminders: {
    dialogId: number;
    periodeTahun: number;
    tanggal: Date;
  }[] = [];
  for (const r of reviuList) {
    if (seenDialogIds.has(r.dialog.id)) continue;
    seenDialogIds.add(r.dialog.id);
    if (
      r.status === "selesai" &&
      r.tanggal_next_reviu &&
      toDateInput(r.tanggal_next_reviu) <= todayInput
    ) {
      reminders.push({
        dialogId: r.dialog.id,
        periodeTahun: r.dialog.periode_tahun,
        tanggal: r.tanggal_next_reviu,
      });
    }
  }
  reminders.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

  const visible =
    activeStatus === "semua"
      ? reviuList
      : reviuList.filter((r) => r.status === activeStatus);

  const stats = [
    {
      key: "draft_pegawai" as const,
      label: "Draft",
      count: reviuList.filter((r) => r.status === "draft_pegawai").length,
      icon: PencilSimpleIcon,
      className: "bg-surface-soft text-primary",
    },
    {
      key: "menunggu_atasan" as const,
      label: "Menunggu Atasan",
      count: reviuList.filter((r) => r.status === "menunggu_atasan").length,
      icon: HourglassIcon,
      className: "bg-status-blue-soft text-status-blue",
    },
    {
      key: "menunggu_validasi" as const,
      label: "Menunggu Validasi",
      count: reviuList.filter((r) => r.status === "menunggu_validasi").length,
      icon: SealCheckIcon,
      className: "bg-status-indigo-soft text-status-indigo",
    },
    {
      key: "selesai" as const,
      label: "Selesai",
      count: reviuList.filter((r) => r.status === "selesai").length,
      icon: CheckCircleIcon,
      className: "bg-status-green-soft text-status-green",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Reviu Dialog Kinerja
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Formulir reviu hasil dialog kinerja sebagai tindak lanjut, dibuat
            setelah dialog kinerja selesai.
          </p>
        </div>
        <NewReviuButton dialogs={selesaiDialogs} />
      </header>

      {reminders.length > 0 ? (
        <section
          aria-label="Pengingat reviu dialog kinerja"
          className="rounded-lg border border-status-amber/40 bg-status-amber-soft px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-status-amber/15 text-status-amber">
              <AlarmIcon size={18} weight="bold" />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="text-sm font-semibold text-ink">
                Saatnya melakukan reviu dialog kinerja
              </h2>
              <ul className="flex flex-col gap-1.5">
                {reminders.map((r) => (
                  <li key={`${r.dialogId}-${toDateInput(r.tanggal)}`}>
                    <Link
                      href={`/pegawai/reviu/new?dialog=${r.dialogId}`}
                      className="group inline-flex flex-wrap items-center gap-x-1.5 text-sm leading-5 text-ink"
                    >
                      <span className="font-medium text-ink">
                        Dialog Kinerja Tahun {r.periodeTahun}
                      </span>
                      <span className="text-ink-muted">— tanggal</span>
                      <strong className="font-semibold text-status-amber">
                        {formatTanggal(r.tanggal)}
                      </strong>
                      <span className="text-primary transition-colors group-hover:text-primary-strong">
                        sudah tiba. Buat reviu sekarang →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section aria-label="Ringkasan status reviu" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, label, count, icon: Icon, className }) => (
          <Link
            key={key}
            href={`/pegawai/reviu?status=${key}`}
            className={`flex items-center gap-3.5 rounded-lg border bg-surface px-5 py-4 transition-all hover:border-outline-strong hover:shadow-ambient ${activeStatus === key
                ? "border-primary ring-1 ring-primary/20"
                : "border-outline"
              }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${className}`}
            >
              <Icon size={20} weight="bold" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-2xl font-semibold leading-8 text-ink">
                {count}
              </span>
              <span className="truncate text-xs font-medium text-ink-muted">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section aria-label="Daftar reviu" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map(({ key, label }) => {
              const active = key === activeStatus;
              return (
                <Link
                  key={key}
                  href={
                    key === "semua"
                      ? "/pegawai/reviu"
                      : `/pegawai/reviu?status=${key}`
                  }
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${active
                      ? "bg-primary text-on-primary shadow-xs"
                      : "border border-outline text-ink-muted hover:border-primary hover:text-primary"
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <span className="text-xs font-medium text-ink-muted">
            Menampilkan {visible.length} dari {reviuList.length} reviu
          </span>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
              <ArrowsClockwiseIcon size={22} weight="bold" />
            </span>
            <h3 className="text-base font-semibold text-ink">
              {activeStatus === "semua"
                ? "Belum ada reviu dialog kinerja"
                : `Tidak ada reviu berstatus "${FILTERS.find((f) => f.key === activeStatus)?.label}"`}
            </h3>
            <p className="max-w-sm text-sm leading-5 text-ink-muted">
              Reviu dibuat dari dialog kinerja yang telah selesai. Gunakan
              tombol &quot;Buat Reviu&quot; untuk memilih dialog kinerja yang
              sudah selesai.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((r) => {
              const cta = CTA[r.status];
              return (
                <li key={r.id}>
                  <div className="flex flex-col gap-4 rounded-lg border border-outline bg-surface p-5 transition-colors hover:border-outline-strong hover:shadow-ambient sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-ink">
                          Dialog Kinerja Tahun {r.dialog.periode_tahun}
                        </span>
                        <ReviuStatusBadge status={r.status} />
                        <TindakLanjutBadge
                          is_tercapai={r.is_tercapai}
                          is_tidak_tercapai={r.is_tidak_tercapai}
                        />
                      </div>
                      <span className="truncate text-xs leading-4 text-ink-muted">
                        Atasan Penilai:{" "}
                        <strong className="font-medium text-ink">
                          {r.dialog.atasan.nama_pegawai}
                        </strong>
                        {r.dialog.atasan.nama_jabatan
                          ? ` (${r.dialog.atasan.nama_jabatan})`
                          : ""}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-outline/50 pt-3 sm:border-t-0 sm:pt-0">
                      {r.status === "selesai" ? (
                        <>
                          <Link
                            href={`/pegawai/reviu/${r.id}?cetak=1`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-outline bg-white px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
                          >
                            <DownloadSimpleIcon size={14} weight="bold" />
                            Unduh PDF
                          </Link>
                          <UnduhWordLink
                            href={`/api/unduh/reviu/${r.id}/word`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-outline bg-white px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted"
                          />
                        </>
                      ) : null}
                      <Link
                        href={cta.href(r.id)}
                        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${cta.variant === "primary"
                            ? "bg-primary text-on-primary hover:bg-primary-strong shadow-xs"
                            : "border border-outline bg-white text-ink hover:border-outline-strong hover:bg-surface-muted"
                          }`}
                      >
                        {cta.label}
                      </Link>
                    </div>
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
