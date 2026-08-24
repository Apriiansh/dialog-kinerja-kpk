import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth/session";
import { canEditReviu, getPegawaiReviu } from "@/lib/queries/reviu";
import { toDateInput } from "@/lib/utils/format";
import { ReviuForm } from "@/components/reviu/edit-form";
import { formatPeriode } from "@/lib/constants/triwulan";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Reviu - Dialog Kinerja KPK",
};

export default async function EditReviuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("PEGAWAI");
  const { id } = await params;
  const reviuId = Number(id);
  if (Number.isNaN(reviuId)) notFound();

  const reviu = await getPegawaiReviu(reviuId, session.id);
  if (!reviu) notFound();
  if (!canEditReviu(reviu.status)) {
    redirect(`/pegawai/reviu/${reviu.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/pegawai/reviu/${reviu.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Kembali ke Detail Reviu
        </Link>
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
          Edit Reviu Dialog Kinerja {formatPeriode(reviu.dialog.triwulan, reviu.dialog.periode_tahun)}
        </h1>
        <p className="text-sm leading-5 text-ink-muted">
          Atasan Penilai: {reviu.dialog.atasan.nama_pegawai}
          {reviu.dialog.atasan.nama_jabatan
            ? ` (${reviu.dialog.atasan.nama_jabatan})`
            : ""}
        </p>
      </div>

      <ReviuForm
        reviuId={reviu.id}
        aspek={reviu.dialog.aspek}
        isLanjutan={reviu.dialog.id_dialog_induk !== null}
        previousItemKeys={new Set(
          (reviu.dialog.dialog_induk?.aspek ?? []).flatMap((aspek) =>
            aspek.item.map(
              (item) =>
                `${item.dialog_evaluasi?.trim() ?? ""}|${item.kompetensi_dikembangkan?.trim() ?? ""}`,
            ),
          ),
        )}
        initial={{
          is_tercapai: reviu.is_tercapai,
          is_tidak_tercapai: reviu.is_tidak_tercapai,
          penjelasan_tercapai: reviu.penjelasan_tercapai,
          penjelasan_tidak_tercapai: reviu.penjelasan_tidak_tercapai,
          rencana_tindak_lanjut: reviu.rencana_tindak_lanjut,
          tanggal_next_evaluasi: toDateInput(reviu.tanggal_next_evaluasi),
        }}
      />
    </div>
  );
}
