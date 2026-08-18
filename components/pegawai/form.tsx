"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { PegawaiFormState } from "@/lib/actions/pegawai-admin";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import {
  formatDurasiKeHariIni,
  parseDateInput,
  parseDurasi,
  toDateInput,
} from "@/lib/utils/format";

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus disabled:opacity-60";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

export function PegawaiForm({
  backHref,
  backLabel,
  submitLabel,
  action,
  values: initialValues,
}: {
  backHref: string;
  backLabel: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<PegawaiFormState>;
  values?: Record<string, string>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, string>>(
    initialValues ?? {},
  );
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});

    const formData = new FormData(formRef.current!);
    const masaKerjaDate = parseDateInput(
      values.masa_kerja_unit_terakhir ?? "",
    );
    if (masaKerjaDate) {
      formData.set(
        "masa_kerja_unit_terakhir",
        formatDurasiKeHariIni(masaKerjaDate),
      );
    }
    let result: PegawaiFormState | undefined;
    try {
      result = await action(formData);
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: string }).digest).startsWith(
          "NEXT_REDIRECT",
        )
      ) {
        return;
      }
      console.error(err);
      showError("Terjadi kesalahan saat menyimpan. Silakan coba lagi.");
      return;
    } finally {
      setPending(false);
    }

    if (result?.error) {
      showError(result.error);
    }
    if (result?.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    }
    if (result?.values) {
      const nextValues = { ...result.values };
      const durasi = nextValues.masa_kerja_unit_terakhir;
      if (durasi) {
        const date = parseDurasi(durasi);
        nextValues.masa_kerja_unit_terakhir = date ? toDateInput(date) : durasi;
      }
      setValues(nextValues);
    }
    if (!result?.error && !result?.fieldErrors) {
      showSuccess("Data berhasil disimpan");
      router.refresh();
    }
  }

  function renderError(key: string) {
    return fieldErrors[key] ? (
      <p className="text-xs font-medium text-error">{fieldErrors[key]}</p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          {backLabel}
        </Link>
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
          {submitLabel}
        </h1>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-lg border border-outline bg-surface p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="npp" className={LABEL_CLASSES}>
              NPP <span className="text-error">*</span>
            </label>
            <input
              id="npp"
              name="npp"
              type="text"
              inputMode="numeric"
              maxLength={7}
              value={values.npp ?? ""}
              onChange={(e) => setField("npp", e.target.value)}
              placeholder="Contoh: 2000003"
              className={INPUT_CLASSES}
              disabled={pending}
              aria-invalid={!!fieldErrors.npp}
            />
            {renderError("npp")}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nip" className={LABEL_CLASSES}>
              NIP
            </label>
            <input
              id="nip"
              name="nip"
              type="text"
              inputMode="numeric"
              maxLength={18}
              value={values.nip ?? ""}
              onChange={(e) => setField("nip", e.target.value)}
              placeholder="Nomor induk pegawai (jika ada)"
              className={INPUT_CLASSES}
              disabled={pending}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nama_pegawai" className={LABEL_CLASSES}>
            Nama Pegawai <span className="text-error">*</span>
          </label>
          <input
            id="nama_pegawai"
            name="nama_pegawai"
            type="text"
            value={values.nama_pegawai ?? ""}
            onChange={(e) => setField("nama_pegawai", e.target.value)}
            placeholder="Nama lengkap"
            className={INPUT_CLASSES}
            disabled={pending}
            aria-invalid={!!fieldErrors.nama_pegawai}
          />
          {renderError("nama_pegawai")}
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
              value={values.tanggal_bergabung ?? ""}
              onChange={(e) => setField("tanggal_bergabung", e.target.value)}
              className={INPUT_CLASSES}
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nama_jabatan" className={LABEL_CLASSES}>
              Jabatan
            </label>
            <input
              id="nama_jabatan"
              name="nama_jabatan"
              type="text"
              value={values.nama_jabatan ?? ""}
              onChange={(e) => setField("nama_jabatan", e.target.value)}
              placeholder="Contoh: Analis"
              className={INPUT_CLASSES}
              disabled={pending}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="unit_kerja" className={LABEL_CLASSES}>
              Unit Kerja
            </label>
            <input
              id="unit_kerja"
              name="unit_kerja"
              type="text"
              value={values.unit_kerja ?? ""}
              onChange={(e) => setField("unit_kerja", e.target.value)}
              placeholder="Contoh: Direktorat X"
              className={INPUT_CLASSES}
              disabled={pending}
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
              value={values.masa_kerja_unit_terakhir ?? ""}
              onChange={(e) =>
                setField("masa_kerja_unit_terakhir", e.target.value)
              }
              className={INPUT_CLASSES}
              disabled={pending}
            />
            {(() => {
              const date = parseDateInput(
                values.masa_kerja_unit_terakhir ?? "",
              );
              if (!date) return null;
              return (
                <p className="text-xs text-ink-muted">
                  Durasi terhitung: {formatDurasiKeHariIni(date)}
                </p>
              );
            })()}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={LABEL_CLASSES}>
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password ?? ""}
            onChange={(e) => setField("password", e.target.value)}
            placeholder="Minimal 6 karakter"
            className={INPUT_CLASSES}
            disabled={pending}
            aria-invalid={!!fieldErrors.password}
          />
          {renderError("password")}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Link
            href={backHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-outline-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
            ) : (
              <>
                {submitLabel}
                <ArrowRightIcon size={16} weight="bold" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}