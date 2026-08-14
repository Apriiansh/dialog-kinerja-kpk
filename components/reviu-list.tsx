import Link from "next/link";
import { formatTanggal } from "@/lib/format";
import { ReviuStatusBadge } from "@/components/reviu-status-badge";
import { TindakLanjutBadge } from "@/components/tindak-lanjut-badge";
import { tindakLanjutLabel } from "@/lib/status-reviu";

interface ReviuListRow {
  id: number;
  status: "draft_pegawai" | "menunggu_atasan" | "menunggu_validasi" | "selesai";
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
  rencana_tindak_lanjut: string | null;
  tanggal_next_reviu: Date | null;
}

export function ReviuList({
  reviu,
  href,
}: {
  reviu: ReviuListRow[];
  href?: (id: number) => string;
}) {
  if (reviu.length === 0) return null;

  return (
    <section
      aria-label="Reviu dialog kinerja"
      className="flex flex-col gap-3"
    >
      <h2 className="text-sm font-semibold text-ink">
        Reviu Dialog Kinerja
      </h2>
      {reviu.map((r) => {
        const target = href?.(r.id);
        return (
          <div
            key={r.id}
            className="overflow-hidden rounded-lg border border-outline bg-surface"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline bg-surface-muted/60 px-5 py-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted">
                Reviu #{r.id}
              </span>
              <div className="flex items-center gap-2">
                <ReviuStatusBadge status={r.status} />
                <TindakLanjutBadge
                  is_tercapai={r.is_tercapai}
                  is_tidak_tercapai={r.is_tidak_tercapai}
                />
              </div>
            </div>

            <dl className="flex flex-col divide-y divide-outline">
              <div className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                  Status Tindak Lanjut
                </dt>
                <dd className="text-sm leading-5 text-ink">
                  {tindakLanjutLabel(r.is_tercapai, r.is_tidak_tercapai)}
                </dd>
              </div>
              {r.penjelasan_tercapai?.trim() ? (
                <div className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Penjelasan Tercapai
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm leading-5 text-ink">
                    {r.penjelasan_tercapai}
                  </dd>
                </div>
              ) : null}
              {r.penjelasan_tidak_tercapai?.trim() ? (
                <div className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Penjelasan Tidak Tercapai
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm leading-5 text-ink">
                    {r.penjelasan_tidak_tercapai}
                  </dd>
                </div>
              ) : null}
              {r.rencana_tindak_lanjut?.trim() ? (
                <div className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Rencana Tindak Lanjut
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm leading-5 text-ink">
                    {r.rencana_tindak_lanjut}
                  </dd>
                </div>
              ) : null}
              <div className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                  Tanggal Reviu Berikutnya
                </dt>
                <dd className="text-sm leading-5 text-ink">
                  {r.tanggal_next_reviu
                    ? formatTanggal(r.tanggal_next_reviu)
                    : "—"}
                </dd>
              </div>
            </dl>

            {target ? (
              <div className="border-t border-outline bg-surface-muted/30 px-5 py-2.5">
                <Link
                  href={target}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
                >
                  Buka detail reviu →
                </Link>
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
