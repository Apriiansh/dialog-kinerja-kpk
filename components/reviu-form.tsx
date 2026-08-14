"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, WarningIcon } from "@phosphor-icons/react";
import { createReviu, saveReviu } from "@/lib/actions/reviu";
import type { StatusTindakLanjut } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Field } from "@/components/ui/field";

interface ReviuFormProps {
  dialogId?: number;
  reviuId?: number;
  initial?: {
    status_tindaklanjut: StatusTindakLanjut;
    penjelasan: string;
    rencana_tindak_lanjut?: string | null;
    tanggal_next_reviu?: string;
  };
}

export function ReviuForm({ dialogId, reviuId, initial }: ReviuFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusTindakLanjut>(
    initial?.status_tindaklanjut ?? "TERCAPAI",
  );
  const [penjelasan, setPenjelasan] = useState(initial?.penjelasan ?? "");
  const [rencana, setRencana] = useState(initial?.rencana_tindak_lanjut ?? "");
  const [tanggal, setTanggal] = useState(initial?.tanggal_next_reviu ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const isEdit = reviuId !== undefined;

  async function submit(mode: "draft" | "submit") {
    setError(undefined);
    setPending(true);

    const input = {
      status_tindaklanjut: status,
      penjelasan,
      rencana_tindak_lanjut: rencana,
      tanggal_next_reviu: tanggal,
    };

    const result = isEdit
      ? await saveReviu(reviuId, mode, input)
      : await createReviu(dialogId!, mode, input);

    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-outline bg-surface px-5 py-6 sm:px-6">
      {error ? (
        <Banner tone="error" icon={<WarningIcon size={18} weight="fill" />}>
          {error}
        </Banner>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
          Status Tindak Lanjut
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {(
            [
              { value: "TERCAPAI", label: "Tercapai" },
              { value: "TIDAK_TERCAPAI", label: "Tidak Tercapai" },
            ] as const
          ).map((option) => {
            const active = status === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary-soft/40 text-primary-strong"
                    : "border-outline text-ink hover:border-outline-strong"
                }`}
              >
                <input
                  type="radio"
                  name="status_tindaklanjut"
                  value={option.value}
                  checked={active}
                  onChange={() => setStatus(option.value)}
                  disabled={pending}
                  className="h-4 w-4 accent-[#1e3a8a]"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <Field
        htmlFor="penjelasan"
        label="Penjelasan"
        required
        hint={
          status === "TIDAK_TERCAPAI"
            ? "Deskripsi penyebab tidak tercapai."
            : "Penjelasan singkat hasilnya."
        }
      >
        <textarea
          id="penjelasan"
          value={penjelasan}
          onChange={(e) => setPenjelasan(e.target.value)}
          disabled={pending}
          rows={4}
          className="w-full resize-y rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm leading-5 text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
          placeholder="Tulis penjelasan tindak lanjutâ€¦"
        />
      </Field>

      {status === "TIDAK_TERCAPAI" ? (
        <Field
          htmlFor="rencana_tindak_lanjut"
          label="Rencana dan Tindak Lanjut ke Depan"
          required
        >
          <textarea
            id="rencana_tindak_lanjut"
            value={rencana}
            onChange={(e) => setRencana(e.target.value)}
            disabled={pending}
            rows={4}
            className="w-full resize-y rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm leading-5 text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
            placeholder="Rencana dan tindak lanjut ke depan yang akan dilakukan"
          />
        </Field>
      ) : null}

      <Field
        htmlFor="tanggal_next_reviu"
        label="Tanggal Reviu Berikutnya"
        required={status === "TIDAK_TERCAPAI"}
        hint={
          status === "TERCAPAI"
            ? "Tidak wajib diisi apabila sasaran sudah tercapai."
            : undefined
        }
      >
        <input
          id="tanggal_next_reviu"
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          disabled={pending}
          className="w-full rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-outline pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={pending}
          onClick={() => submit("draft")}
        >
          Simpan Draft
        </Button>
        <Button
          type="button"
          size="md"
          loading={pending}
          disabled={
            !penjelasan.trim() ||
            (status === "TIDAK_TERCAPAI" && !tanggal)
          }
          onClick={() => submit("submit")}
          leadingIcon={<ArrowRightIcon size={16} weight="bold" />}
        >
          Kirim ke Atasan
        </Button>
      </div>
    </div>
  );
}
