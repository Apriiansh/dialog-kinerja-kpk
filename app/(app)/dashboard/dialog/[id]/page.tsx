import {
  ChartBar,
  Gauge,
  PencilSimple,
  PaperPlaneTilt,
  TrendUp,
  UserFocus,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { DIALOG_SECTIONS } from "@/lib/dialog-sections";
import { StatusBadge } from "@/components/status-badge";
import { DeleteDialogButton } from "@/components/delete-dialog-button";
import { submitDialog } from "@/app/(app)/actions";

const SECTION_ICONS = [ChartBar, Gauge, UserFocus, TrendUp] as const;

export default async function DialogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("ATASAN");

  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: Number(id), id_atasan: session.id },
    include: {
      pegawai: {
        select: {
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
        },
      },
      aspek: { select: { id: true, jenis_aspek: true, tanggung_jawab_atasan: true } },
    },
  });
  if (!dialog) notFound();

  const byType = new Map(dialog.aspek.map((a) => [a.jenis_aspek, a]));
  const draft = dialog.status === "draft_atasan";

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Detail Dialog Kinerja
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {dialog.pegawai.nama_pegawai}
            {dialog.pegawai.nama_jabatan ? ` · ${dialog.pegawai.nama_jabatan}` : ""}
            {dialog.pegawai.unit_kerja ? ` · ${dialog.pegawai.unit_kerja}` : ""} ·{" "}
            Periode {dialog.periode_tahun}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={dialog.status} />
          {draft ? (
            <>
              <Link
                href={`/dashboard/dialog/${dialog.id}/edit`}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary-strong transition-colors hover:bg-primary-faint"
              >
                <PencilSimple size={12} weight="bold" />
                Edit
              </Link>
              <DeleteDialogButton dialogId={dialog.id} />
              <form action={submitDialog.bind(null, dialog.id)}>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                >
                  <PaperPlaneTilt size={12} weight="bold" />
                  Kirim
                </button>
              </form>
            </>
          ) : null}
        </div>
      </header>

      <section aria-label="Ringkasan dialog" className="flex flex-col gap-6">
        {DIALOG_SECTIONS.map(({ no, title, desc, fields }, index) => {
          const Icon = SECTION_ICONS[index];
          return (
            <div key={no} className="rounded-lg border border-outline bg-surface">
              <div className="flex items-start gap-3 border-b border-outline px-6 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
                  <Icon size={18} weight="bold" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-semibold text-ink">
                    {no}. {title}
                  </h2>
                  <p className="text-xs leading-4 text-ink-muted">{desc}</p>
                </div>
              </div>
              <div className="flex flex-col gap-5 px-6 py-5">
                {fields.map(({ jenis, label }) => {
                  const value = byType.get(jenis)?.tanggung_jawab_atasan;
                  return (
                    <div key={jenis} className="flex flex-col gap-1.5">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted">
                        {label}
                      </h3>
                      {value ? (
                        <p className="whitespace-pre-wrap rounded-md bg-surface-muted/60 px-3.5 py-2.5 text-sm leading-6 text-ink">
                          {value}
                        </p>
                      ) : (
                        <p className="text-sm italic leading-6 text-ink-muted">
                          Belum diisi.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
