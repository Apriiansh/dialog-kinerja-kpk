"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  WarningIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import {
  updateUserProfileDataAction,
  type UpdateProfileState,
} from "@/lib/actions/profile";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import {
  toDateInput,
  parseDateInput,
  parseDurasi,
  formatDurasiKeHariIni,
} from "@/lib/utils/format";
import type { UserProfileData } from "@/lib/queries/profile";

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus disabled:opacity-60";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

export function EditProfileForm({ user }: { user: UserProfileData }) {
  const [namaPegawai, setNamaPegawai] = useState(user.nama_pegawai ?? "");
  const [nip, setNip] = useState(user.nip ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [namaJabatan, setNamaJabatan] = useState(user.nama_jabatan ?? "");
  const [unitKerja, setUnitKerja] = useState(user.unit_kerja ?? "");
  const [tanggalBergabung, setTanggalBergabung] = useState(
    user.tanggal_bergabung ? toDateInput(user.tanggal_bergabung) : "",
  );
  const [masaKerjaInput, setMasaKerjaInput] = useState(() => {
    const durasi = user.masa_kerja_unit_terakhir ?? "";
    const date = parseDurasi(durasi);
    return date ? toDateInput(date) : "";
  });

  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UpdateProfileState>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});

    const formData = new FormData();
    formData.set("nama_pegawai", namaPegawai);
    formData.set("nip", nip);
    formData.set("email", email);
    formData.set("nama_jabatan", namaJabatan);
    formData.set("unit_kerja", unitKerja);
    formData.set("tanggal_bergabung", tanggalBergabung);
    formData.set("masa_kerja_unit_terakhir", masaKerjaInput);

    try {
      const res = await updateUserProfileDataAction({}, formData);
      setState(res);
      if (res.success) {
        showSuccess("Data berhasil disimpan", "Profil kepegawaian Anda telah diperbarui.");
      } else if (res.error) {
        showError(res.error);
      }
    } catch (err) {
      console.error(err);
      const msg = "Terjadi kesalahan saat menyimpan perubahan. Silakan coba lagi.";
      setState({ error: msg });
      showError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-outline bg-surface">
      <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink">
          Perbarui Data Kepegawaian
        </h2>
        <p className="text-xs leading-4 text-ink-muted">
          Ubah data identitas, jabatan, dan riwayat penugasan Anda.
        </p>
      </div>

      <div className="p-6">
        {state.success ? (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-md bg-status-green-soft px-4 py-3 text-sm leading-5 text-status-green"
          >
            <CheckCircleIcon size={18} weight="bold" className="mt-0.5 shrink-0" />
            <span>{state.message}</span>
          </div>
        ) : null}

        {state.error ? (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-md bg-error-container px-4 py-3 text-sm leading-5 text-on-error-container"
          >
            <WarningIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="npp" className={LABEL_CLASSES}>
                NPP (Nomor Pokok Pegawai)
              </label>
              <input
                id="npp"
                type="text"
                value={user.npp}
                disabled
                className="h-11 w-full rounded-md border border-outline bg-surface-muted px-3.5 text-sm text-ink-muted cursor-not-allowed"
              />
              <span className="text-xs text-ink-muted">
                NPP dikelola langsung oleh Administrator.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="nip" className={LABEL_CLASSES}>
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                id="nip"
                name="nip"
                type="text"
                maxLength={18}
                inputMode="numeric"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Nomor induk pegawai (jika ada)"
                disabled={pending}
                className={INPUT_CLASSES}
              />
              {state.fieldErrors?.nip ? (
                <p className="text-xs font-medium text-error">
                  {state.fieldErrors.nip}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nama_pegawai" className={LABEL_CLASSES}>
                Nama Lengkap <span className="text-error">*</span>
              </label>
              <input
                id="nama_pegawai"
                name="nama_pegawai"
                type="text"
                value={namaPegawai}
                onChange={(e) => setNamaPegawai(e.target.value)}
                placeholder="Nama lengkap beserta gelar"
                disabled={pending}
                className={INPUT_CLASSES}
              />
              {state.fieldErrors?.nama_pegawai ? (
                <p className="text-xs font-medium text-error">
                  {state.fieldErrors.nama_pegawai}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={LABEL_CLASSES}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: user@kpk.go.id"
                disabled={pending}
                className={INPUT_CLASSES}
              />
              {state.fieldErrors?.email ? (
                <p className="text-xs font-medium text-error">
                  {state.fieldErrors.email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nama_jabatan" className={LABEL_CLASSES}>
                Jabatan
              </label>
              <input
                id="nama_jabatan"
                name="nama_jabatan"
                type="text"
                value={namaJabatan}
                onChange={(e) => setNamaJabatan(e.target.value)}
                placeholder="Contoh: Analis SDM Aparatur"
                disabled={pending}
                className={INPUT_CLASSES}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="unit_kerja" className={LABEL_CLASSES}>
                Unit Kerja
              </label>
              <input
                id="unit_kerja"
                name="unit_kerja"
                type="text"
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                placeholder="Contoh: Biro Sumber Daya Manusia"
                disabled={pending}
                className={INPUT_CLASSES}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="tanggal_bergabung" className={LABEL_CLASSES}>
                Tanggal Bergabung
              </label>
              <input
                id="tanggal_bergabung"
                name="tanggal_bergabung"
                type="date"
                value={tanggalBergabung}
                onChange={(e) => setTanggalBergabung(e.target.value)}
                disabled={pending}
                className={INPUT_CLASSES}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="masa_kerja_unit_terakhir" className={LABEL_CLASSES}>
                Masa Kerja Unit Terakhir
              </label>
              <input
                id="masa_kerja_unit_terakhir"
                name="masa_kerja_unit_terakhir"
                type="date"
                value={masaKerjaInput}
                onChange={(e) => setMasaKerjaInput(e.target.value)}
                disabled={pending}
                className={INPUT_CLASSES}
              />
              {(() => {
                const date = parseDateInput(masaKerjaInput);
                if (!date) return null;
                return (
                  <p className="text-xs text-ink-muted">
                    Durasi terhitung: {formatDurasiKeHariIni(date)}
                  </p>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline">
            <button
              type="submit"
              disabled={pending  || !namaPegawai.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
              ) : (
                <>
                  Simpan Perubahan
                  <ArrowRightIcon size={16} weight="bold" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
