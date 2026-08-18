import { formatTanggal } from "@/lib/utils/format";
import type { PegawaiDetail } from "@/components/pegawai/detail-modal";

export interface PegawaiDetailRow {
  id: number;
  npp: string;
  nip: string | null;
  nama_pegawai: string;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  masa_kerja_unit_terakhir: string | null;
  tanggal_bergabung: Date | null;
  is_admin: boolean;
  as_pegawai: boolean;
  is_active: boolean;
  atasan: { nama_pegawai: string } | null;
  _count: { bawahan: number };
  bawahan?: PegawaiDetailRow[];
}

export function mapPegawaiDetail(
  row: PegawaiDetailRow,
  editHrefFor: (id: number) => string,
): PegawaiDetail {
  return {
    id: row.id,
    npp: row.npp,
    nip: row.nip,
    nama_pegawai: row.nama_pegawai,
    tanggal_bergabung: row.tanggal_bergabung
      ? formatTanggal(row.tanggal_bergabung)
      : null,
    nama_jabatan: row.nama_jabatan,
    unit_kerja: row.unit_kerja,
    masa_kerja_unit_terakhir: row.masa_kerja_unit_terakhir,
    is_admin: row.is_admin,
    as_pegawai: row.as_pegawai,
    is_active: row.is_active,
    atasan: row.atasan?.nama_pegawai ?? null,
    bawahan: row._count.bawahan,
    editHref: editHrefFor(row.id),
    bawahanList: (row.bawahan ?? []).map((b) =>
      mapPegawaiDetail(b, editHrefFor),
    ),
  };
}