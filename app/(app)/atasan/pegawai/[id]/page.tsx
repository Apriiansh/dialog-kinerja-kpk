import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { formatTanggal } from "@/lib/utils/format";
import { formatPeriode } from "@/lib/constants/triwulan";
import { UserDetailView, type UserDetailData } from "@/components/shared/user-detail-view";
import {
  PegawaiTrendCard,
  type CarryOverItem,
} from "@/components/dashboard/pegawai-trend-card";
import type { ChartDatum } from "@/components/dashboard/charts";
import {
  aktifkanPegawai,
  nonaktifkanPegawai,
  deletePegawai,
} from "@/lib/actions/pegawai-admin";

export const dynamic = "force-dynamic";

export default async function AtasanPegawaiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("ATASAN");
  const { id } = await params;
  const numericId = Number(id);
  if (isNaN(numericId)) notFound();

  const user = await prisma.user.findFirst({
    where: {
      id: numericId,
      id_atasan: session.id,
    },
      select: {
        id: true,
        npp: true,
        email: true,
        email_verified_at: true,
        nip: true,
      nama_pegawai: true,
      nama_jabatan: true,
      unit_kerja: true,
      tanggal_bergabung: true,
      masa_kerja_unit_terakhir: true,
      is_admin: true,
      as_pegawai: true,
      is_active: true,
      default_role: true,
      atasan: {
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
        },
      },
      bawahan: {
        select: {
          id: true,
          npp: true,
          nama_pegawai: true,
          nama_jabatan: true,
          unit_kerja: true,
          is_active: true,
        },
        orderBy: { nama_pegawai: "asc" },
      },
        dialogAsPegawai: {
        where: { id_atasan: session.id },
        select: {
          id: true,
          periode_tahun: true,
          triwulan: true,
          status: true,
          deskripsi_kinerja: true,
          updated_at: true,
          aspek: {
            select: {
              jenis_aspek: true,
              item: {
                select: { id: true, dialog_evaluasi: true, is_tercapai: true },
              },
            },
          },
        },
        orderBy: [{ periode_tahun: "desc" }, { triwulan: "desc" }],
      },
    },
  });

  if (!user) notFound();

  // Analisis tren pencapaian evaluasi (rumus sama dengan dashboard pegawai):
  // % = tercapai / (tercapai + tidak tercapai), hanya item terisi yang sudah direviu.
  const periodMap = new Map<
    string,
    { year: number; triwulan: typeof user.dialogAsPegawai[number]["triwulan"]; tercapai: number; tidakTercapai: number }
  >();
  let totalDireviu = 0;
  let totalTercapai = 0;

  for (const d of user.dialogAsPegawai) {
    const reviewed = d.aspek
      .flatMap((a) => a.item)
      .filter(
        (it) =>
          (it.dialog_evaluasi?.trim() ?? "") !== "" && it.is_tercapai !== null,
      );
    if (reviewed.length === 0) continue;
    totalDireviu += reviewed.length;
    totalTercapai += reviewed.filter((it) => it.is_tercapai).length;

    const key = `${d.periode_tahun}-${d.triwulan}`;
    const entry =
      periodMap.get(key) ?? {
        year: d.periode_tahun,
        triwulan: d.triwulan,
        tercapai: 0,
        tidakTercapai: 0,
      };
    for (const it of reviewed) {
      if (it.is_tercapai) entry.tercapai += 1;
      else entry.tidakTercapai += 1;
    }
    periodMap.set(key, entry);
  }

  const trendData: ChartDatum[] = [...periodMap.values()]
    .sort((a, b) => a.year - b.year || a.triwulan.localeCompare(b.triwulan))
    .map((p) => ({
      label: `${p.triwulan} '${String(p.year).slice(2)}`,
      tooltipLabel: formatPeriode(p.triwulan, p.year),
      value: Math.round((p.tercapai / (p.tercapai + p.tidakTercapai)) * 100),
      hint: `${p.tercapai} tercapai · ${p.tidakTercapai} tidak tercapai`,
    }));

  // Carry-over: item belum tercapai dari dialog terakhir yang memiliki reviu.
  const latestWithReview = user.dialogAsPegawai.find((d) =>
    d.aspek.some((a) => a.item.some((it) => it.is_tercapai !== null)),
  );
  const carryOver: CarryOverItem[] = latestWithReview
    ? latestWithReview.aspek.flatMap((a) =>
        a.item
          .filter(
            (it) =>
              it.is_tercapai === false &&
              (it.dialog_evaluasi?.trim() ?? "") !== "",
          )
          .map((it) => ({
            jenis_aspek: a.jenis_aspek,
            evaluasi: it.dialog_evaluasi!.trim(),
          })),
      )
    : [];
  const carryOverPeriode = latestWithReview
    ? formatPeriode(latestWithReview.triwulan, latestWithReview.periode_tahun)
    : null;

  const userData: UserDetailData = {
    id: user.id,
    npp: user.npp,
    email: user.email,
    email_verified: Boolean(user.email_verified_at),
    nip: user.nip,
    nama_pegawai: user.nama_pegawai,
    nama_jabatan: user.nama_jabatan,
    unit_kerja: user.unit_kerja,
    tanggal_bergabung: user.tanggal_bergabung
      ? formatTanggal(user.tanggal_bergabung)
      : null,
    masa_kerja_unit_terakhir: user.masa_kerja_unit_terakhir,
    is_admin: user.is_admin,
    as_pegawai: user.as_pegawai,
    is_active: user.is_active,
    default_role: user.default_role,
    atasan: user.atasan,
    bawahan: user.bawahan,
    dialogs: user.dialogAsPegawai.map((d) => ({
      id: d.id,
      periode_tahun: d.periode_tahun,
      triwulan: d.triwulan,
      status: d.status,
      deskripsi_kinerja: d.deskripsi_kinerja,
      updated_at: d.updated_at ? formatTanggal(d.updated_at) : null,
    })),
  };

  async function handleToggleStatus(isActive: boolean) {
    "use server";
    if (isActive) {
      return await aktifkanPegawai(numericId);
    } else {
      return await nonaktifkanPegawai(numericId);
    }
  }

  async function handleDelete() {
    "use server";
    return await deletePegawai(numericId);
  }

  return (
    <>
      <UserDetailView
        user={userData}
        context="ATASAN"
        backHref="/atasan/pegawai"
        editHref={`/atasan/pegawai/${numericId}/edit`}
        isSelf={session.id === numericId}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      <PegawaiTrendCard
        pegawaiName={user.nama_pegawai}
        trendData={trendData}
        summary={{
          total: totalDireviu,
          tercapai: totalTercapai,
          tidakTercapai: totalDireviu - totalTercapai,
        }}
        carryOver={carryOver}
        carryOverPeriode={carryOverPeriode}
      />
    </>
  );
}
