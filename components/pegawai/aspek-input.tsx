import {
  dialogEvaluasiLabel,
  formatWaktuPelaksanaan,
  isEmptyItem,
  metodeLabel,
  type AspekPegawaiRow,
} from "@/lib/utils/dialog-display";

export function AspekPegawaiInput({ aspek }: { aspek: AspekPegawaiRow }) {
  const items = (aspek.item ?? []).filter((i) => !isEmptyItem(i));

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 ? (
        <ol className="flex flex-col divide-y divide-outline rounded-md border border-outline bg-surface-muted/40">
          {items.map((item, itemIndex) => (
            <li
              key={itemIndex}
              className="relative flex flex-col gap-2.5 px-4 py-3 pr-32 text-sm"
            >
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    {dialogEvaluasiLabel(aspek.jenis_aspek)}
                  </span>
                  <span className="whitespace-pre-wrap leading-5 text-ink">
                    {item.dialog_evaluasi?.trim() || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Kompetensi
                  </span>
                  <span className="whitespace-pre-wrap leading-5 text-ink">
                    {item.kompetensi_dikembangkan?.trim() || "—"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Metode Pengembangan
                  </span>
                  <span className="leading-5 text-ink">
                    {metodeLabel(item) || "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                    Waktu Pelaksanaan
                  </span>
                  <span className="leading-5 text-ink">
                    {formatWaktuPelaksanaan(item.waktu_pelaksanaan)}
                  </span>
                </div>
              </div>
              {item.is_tercapai === null ? (
                <span className="absolute right-3 top-3 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                  Belum dinilai
                </span>
              ) : item.is_tercapai ? (
                <span className="absolute right-3 top-3 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Tercapai
                </span>
              ) : (
                <span className="absolute right-3 top-3 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                  Tidak tercapai
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm leading-5 text-ink-muted">
          Belum ada rincian pengembangan.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
          Tanggung Jawab Pegawai
        </span>
        <p className="whitespace-pre-wrap text-sm leading-5 text-ink">
          {aspek.tanggung_jawab_pegawai?.trim() || "—"}
        </p>
      </div>
    </div>
  );
}
