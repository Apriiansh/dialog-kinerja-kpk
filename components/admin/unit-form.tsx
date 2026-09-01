"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { AdminUnitFormState } from "@/lib/actions/admin-unit";
import {
  error as showError,
  success as showSuccess,
} from "@/components/ui/toast";

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus disabled:opacity-60";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

type ParentOption = { id: number; nama_unit: string; depth: number };

export function AdminUnitForm({
  backHref,
  backLabel,
  submitLabel,
  action,
  values: initialValues,
  parentOptions,
}: {
  backHref: string;
  backLabel: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<AdminUnitFormState>;
  values?: Record<string, string>;
  parentOptions: ParentOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, string>>({
    is_active: "1",
    ...initialValues,
  });
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }
  function toggleCheckbox(key: string, checked: boolean) {
    setValues((prev) => ({ ...prev, [key]: checked ? "1" : "" }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});
    const formData = new FormData(formRef.current!);
    let result: AdminUnitFormState | undefined;
    try {
      result = await action(formData);
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        return;
      }
      showError("Terjadi kesalahan saat menyimpan.");
      return;
    } finally {
      setPending(false);
    }
    if (result?.error) showError(result.error);
    if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    if (result?.values) setValues(result.values);
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
        <div>
          <label htmlFor="nama_unit" className={LABEL_CLASSES}>
            Nama Unit <span className="text-error">*</span>
          </label>
          <input
            id="nama_unit"
            name="nama_unit"
            type="text"
            maxLength={255}
            value={values.nama_unit ?? ""}
            onChange={(e) => setField("nama_unit", e.target.value)}
            placeholder="Contoh: Biro SDM"
            className={INPUT_CLASSES}
            disabled={pending}
            aria-invalid={!!fieldErrors.nama_unit}
          />
          {renderError("nama_unit")}
        </div>

        <div>
          <label htmlFor="jenis" className={LABEL_CLASSES}>
            Jenis
          </label>
          <input
            id="jenis"
            name="jenis"
            type="text"
            maxLength={100}
            value={values.jenis ?? ""}
            onChange={(e) => setField("jenis", e.target.value)}
            placeholder="Contoh: biro / direktorat / bagian / kelompok_jf"
            className={INPUT_CLASSES}
            disabled={pending}
          />
        </div>

        <div>
          <label htmlFor="kepala_jabatan" className={LABEL_CLASSES}>
            Kepala Jabatan
          </label>
          <input
            id="kepala_jabatan"
            name="kepala_jabatan"
            type="text"
            maxLength={150}
            value={values.kepala_jabatan ?? ""}
            onChange={(e) => setField("kepala_jabatan", e.target.value)}
            placeholder="Contoh: Kepala Biro SDM"
            className={INPUT_CLASSES}
            disabled={pending}
          />
        </div>

        <div>
          <label htmlFor="parent_id" className={LABEL_CLASSES}>
            Unit Induk
          </label>
          <select
            id="parent_id"
            name="parent_id"
            value={values.parent_id ?? ""}
            onChange={(e) => setField("parent_id", e.target.value)}
            className={INPUT_CLASSES}
            disabled={pending}
          >
            <option value="">— Tidak ada (unit tingkat atas) —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {"— ".repeat(p.depth)}
                {p.nama_unit}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="is_active"
            value="1"
            checked={values.is_active === "1"}
            onChange={(e) => toggleCheckbox("is_active", e.target.checked)}
            disabled={pending}
            className="mt-0.5 h-4 w-4 rounded border-outline-strong accent-primary"
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">Aktif</span>
            <span className="text-xs font-normal leading-5 text-ink-muted">
              Unit aktif bisa digunakan untuk menautkan pengguna.
            </span>
          </span>
        </label>

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
