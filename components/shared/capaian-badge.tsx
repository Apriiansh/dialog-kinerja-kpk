import type { StatusDialog } from "@/generated/prisma/enums";
import {
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  ClockIcon,
  FileTextIcon,
} from "@phosphor-icons/react/dist/ssr";

interface CapaianBadgeProps {
  statusDialog: StatusDialog;
  filledAspekCount: number;
  totalAspekCount?: number;
  reviu?: {
    status: string;
    is_tercapai: boolean;
    is_tidak_tercapai: boolean;
  } | null;
  items?: { is_tercapai: boolean | null }[];
}

export function CapaianBadge({
  statusDialog,
  filledAspekCount,
  totalAspekCount = 4,
  reviu,
  items = [],
}: CapaianBadgeProps) {
  const isSelesaiOrValidasi =
    statusDialog === "selesai" || statusDialog === "menunggu_validasi";

  if (!isSelesaiOrValidasi) {
    // Fase 1: Perencanaan Target (Draft / Menunggu Pegawai / Menunggu Atasan)
    const isLengkap = filledAspekCount >= totalAspekCount;
    if (isLengkap) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircleIcon size={14} weight="bold" />
          Rencana Target Lengkap
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
        <FileTextIcon size={14} weight="bold" />
        ({filledAspekCount}/{totalAspekCount}) Rencana Evaluasi
      </span>
    );
  }

  // Fase 2: Hasil Evaluasi Capaian
  // Hitung dari items jika tersedia untuk menentukan proporsi
  const evaluated = items.filter((i) => i.is_tercapai !== null);
  const tercapaiCount = evaluated.filter((i) => i.is_tercapai === true).length;
  const tidakTercapaiCount = evaluated.filter((i) => i.is_tercapai === false).length;
  const majorityAchieved = tercapaiCount >= tidakTercapaiCount;

  let type: "tercapai" | "tidak_tercapai_sebagian" | "tercapai_sebagian" | "tidak_tercapai" | "menunggu" = "menunggu";

  if (evaluated.length > 0) {
    if (tercapaiCount > 0 && tidakTercapaiCount === 0) {
      type = "tercapai";
    } else if (tercapaiCount > 0 && tidakTercapaiCount > 0) {
      type = majorityAchieved ? "tidak_tercapai_sebagian" : "tercapai_sebagian";
    } else if (tercapaiCount === 0 && tidakTercapaiCount > 0) {
      type = "tidak_tercapai";
    }
  } else if (
    reviu &&
    (reviu.status === "selesai" || reviu.status === "menunggu_validasi")
  ) {
    if (reviu.is_tercapai && !reviu.is_tidak_tercapai) {
      type = "tercapai";
    } else if (reviu.is_tercapai && reviu.is_tidak_tercapai) {
      type = "tidak_tercapai_sebagian";
    } else if (!reviu.is_tercapai && reviu.is_tidak_tercapai) {
      type = "tidak_tercapai";
    }
  }

  if (type === "tercapai") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircleIcon size={14} weight="bold" />
        Tercapai Penuh
      </span>
    );
  }

  if (type === "tidak_tercapai_sebagian") {
    // Mayoritas tercapai, sebagian kecil tidak tercapai
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
        <WarningIcon size={14} weight="bold" />
        Tidak Tercapai Sebagian
      </span>
    );
  }

  if (type === "tercapai_sebagian") {
    // Mayoritas tidak tercapai, sebagian kecil tercapai
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
        <WarningIcon size={14} weight="bold" />
        Tercapai Sebagian
      </span>
    );
  }

  if (type === "tidak_tercapai") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <XCircleIcon size={14} weight="bold" />
        Tidak Tercapai
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      <ClockIcon size={14} weight="bold" />
      Menunggu Evaluasi
    </span>
  );
}
