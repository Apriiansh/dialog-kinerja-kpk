"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { assertActiveActor } from "@/lib/auth/guards";
import type {
  JenisAspek,
  StatusDialog,
} from "@/generated/prisma/enums";

export interface DialogLiveItem {
  id: number;
  dialog_evaluasi: string | null;
  kompetensi_dikembangkan: string | null;
  is_tercapai: boolean | null;
  metode_pengembangan_lainnya: string | null;
  waktu_pelaksanaan: Date | null;
  metode: { nama_metode: string } | null;
}

export interface DialogLiveAspekRow {
  id: number;
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string | null;
  tanggung_jawab_atasan: string | null;
  item: DialogLiveItem[];
}

export interface DialogLiveState {
  status: StatusDialog;
  aspek: DialogLiveAspekRow[];
}

export async function getDialogLiveState(
  dialogId: number,
): Promise<DialogLiveState | null> {
  const session = await getSession();
  if (!session?.id) return null;

  const err = await assertActiveActor(session.id);
  if (err) return null;

  const dialog = await prisma.dialogKinerja.findFirst({
    where: {
      id: dialogId,
      OR: [{ id_atasan: session.id }, { id_pegawai: session.id }],
    },
    select: {
      status: true,
      aspek: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          jenis_aspek: true,
          tanggung_jawab_pegawai: true,
          tanggung_jawab_atasan: true,
          item: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              dialog_evaluasi: true,
              kompetensi_dikembangkan: true,
              is_tercapai: true,
              metode_pengembangan_lainnya: true,
              waktu_pelaksanaan: true,
              metode: { select: { nama_metode: true } },
            },
          },
        },
      },
    },
  });
  if (!dialog) return null;

  return {
    status: dialog.status,
    aspek: dialog.aspek.map((aspek) => ({
      id: aspek.id,
      jenis_aspek: aspek.jenis_aspek,
      tanggung_jawab_pegawai: aspek.tanggung_jawab_pegawai,
      tanggung_jawab_atasan: aspek.tanggung_jawab_atasan,
      item: aspek.item.map((item) => ({
        id: item.id,
        dialog_evaluasi: item.dialog_evaluasi,
        kompetensi_dikembangkan: item.kompetensi_dikembangkan,
        is_tercapai: item.is_tercapai,
        metode_pengembangan_lainnya: item.metode_pengembangan_lainnya,
        waktu_pelaksanaan: item.waktu_pelaksanaan,
        metode: item.metode,
      })),
    })),
  };
}
