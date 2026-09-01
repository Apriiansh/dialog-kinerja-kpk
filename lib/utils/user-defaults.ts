import type { Role } from "@/lib/auth/session";
import { parseDurasi, toDateInput } from "@/lib/utils/format";

function durasiKeTanggal(value: string | null): string {
  if (!value) return "";
  return toDateInput(parseDurasi(value));
}

export function pegawaiFormDefaults(user?: {
  npp: string;
  email: string | null;
  nip: string | null;
  nama_pegawai: string;
  tanggal_bergabung: Date | null;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  masa_kerja_unit_terakhir: string | null;
}): Record<string, string> {
  if (!user) return {};
  return {
    npp: user.npp,
    email: user.email ?? "",
    nip: user.nip ?? "",
    nama_pegawai: user.nama_pegawai,
    tanggal_bergabung: toDateInput(user.tanggal_bergabung),
    nama_jabatan: user.nama_jabatan ?? "",
    unit_kerja: user.unit_kerja ?? "",
    masa_kerja_unit_terakhir: durasiKeTanggal(user.masa_kerja_unit_terakhir),
  };
}

export function adminUserFormDefaults(user: {
  npp: string;
  email: string | null;
  nip: string | null;
  nama_pegawai: string;
  tanggal_bergabung: Date | null;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  unit_kerja_id: number | null;
  masa_kerja_unit_terakhir: string | null;
  default_role: Role;
  is_admin: boolean;
  as_pegawai: boolean;
  id_atasan: number | null;
}): Record<string, string> {
  return {
    npp: user.npp,
    email: user.email ?? "",
    nip: user.nip ?? "",
    nama_pegawai: user.nama_pegawai,
    tanggal_bergabung: toDateInput(user.tanggal_bergabung),
    nama_jabatan: user.nama_jabatan ?? "",
    unit_kerja: user.unit_kerja ?? "",
    unit_kerja_id: user.unit_kerja_id ? String(user.unit_kerja_id) : "",
    masa_kerja_unit_terakhir: durasiKeTanggal(user.masa_kerja_unit_terakhir),
    default_role: user.default_role,
    is_admin: user.is_admin ? "1" : "",
    as_pegawai: user.as_pegawai ? "1" : "",
    id_atasan: user.id_atasan ? String(user.id_atasan) : "",
  };
}
