import Link from "next/link";
import { formatTanggal } from "@/lib/utils/format";
import { ReviuStatusBadge } from "@/components/reviu/status-badge";
import { TindakLanjutBadge } from "@/components/shared/tindak-lanjut-badge";
import { UnduhWordLink } from "@/components/shared/unduh-word-link";
import { tindakLanjutLabel } from "@/lib/constants/reviu-status";
import React from "react";

interface ReviuListRow {
  id: number;
  status: "draft_pegawai" | "menunggu_atasan" | "menunggu_validasi" | "selesai";
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
  rencana_tindak_lanjut: string | null;
  tanggal_next_evaluasi: Date | null;
}

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3 sm:grid sm:grid-cols-[220px_1fr] sm:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm leading-5 text-ink">{value}</dd>
    </div>
  );
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
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
              <DetailRow
               label="Status Tindak Lanjut"
               value={tindakLanjutLabel(r.is_tercapai, r.is_tidak_tercapai)}
              />
              {r.penjelasan_tercapai?.trim() ? (
                <DetailRow 
                  label="Penjelasan Tercapai"
                  value={r.penjelasan_tercapai}
                />
              ) : null}
              {r.penjelasan_tidak_tercapai?.trim() ? (
               <DetailRow 
                  label="Penjelasan Tidak Tercapai"
                  value={r.penjelasan_tidak_tercapai}
                />
              ) : null}
              {r.rencana_tindak_lanjut?.trim() ? (
                <DetailRow
                  label="Rencana Tindak Lanjut"
                  value={r.rencana_tindak_lanjut}
                />
              ) : null}
              <DetailRow 
                label="Tanggal Evaluasi Berikutnya"
                value={r.tanggal_next_evaluasi ? formatTanggal(r.tanggal_next_evaluasi) : "—"}
              />
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline bg-surface-muted/30 px-5 py-2.5">
              {target ? (
                <Link
                  href={target}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
                >
                  Buka detail reviu →
                </Link>
              ) : <div />}
              {r.status === "selesai" ? (
                <UnduhWordLink href={`/api/unduh/reviu/${r.id}/docx`} />
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}


