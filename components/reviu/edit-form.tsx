"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createReviu, saveReviu } from "@/lib/actions/reviu";
import { Button } from "@/components/ui/button";
import { error as showError } from "@/components/ui/toast";
import { Field } from "@/components/ui/field";
import { ASPEK_ORDER, ASPEK_LABEL } from "@/lib/constants/aspek";
import type { JenisAspek } from "@/generated/prisma/enums";

export interface ReviuAspekItem {
  id: number;
  dialog_evaluasi: string | null;
  kompetensi_dikembangkan: string | null;
  is_tercapai: boolean | null;
}

export interface ReviuAspekRow {
  id: number;
  jenis_aspek: JenisAspek;
  item: ReviuAspekItem[];
}

interface ReviuFormProps {
  dialogId?: number;
  reviuId?: number;
  aspek?: ReviuAspekRow[];
  isLanjutan?: boolean;
  previousItemKeys?: Set<string>;
  initial?: {
    is_tercapai: boolean;
    is_tidak_tercapai: boolean;
    penjelasan_tercapai?: string | null;
    penjelasan_tidak_tercapai?: string | null;
    rencana_tindak_lanjut?: string | null;
    tanggal_next_reviu?: string;
  };
}

interface CapaianState {
  tercapai: boolean;
}

function buildInitialCapaian(aspek: ReviuAspekRow[] | undefined) {
  const map: Record<number, CapaianState> = {};
  for (const group of aspek ?? []) {
    for (const item of group.item) {
      map[item.id] = { tercapai: item.is_tercapai ?? false };
    }
  }
  return map;
}

export function ReviuForm({
  dialogId,
  reviuId,
  aspek,
  isLanjutan = false,
  previousItemKeys,
  initial,
}: ReviuFormProps) {
  const [capaian, setCapaian] = useState(() => buildInitialCapaian(aspek));
  const [penjelasanTercapai, setPenjelasanTercapai] = useState(
    initial?.penjelasan_tercapai ?? "",
  );
  const [penjelasanTidakTercapai, setPenjelasanTidakTercapai] = useState(
    initial?.penjelasan_tidak_tercapai ?? "",
  );
  const [rencana, setRencana] = useState(initial?.rencana_tindak_lanjut ?? "");
  const [tanggal, setTanggal] = useState(initial?.tanggal_next_reviu ?? "");
  const [pending, setPending] = useState(false);

  const isEdit = reviuId !== undefined;
  const groups = [...(aspek ?? [])].sort(
    (a, b) =>
      ASPEK_ORDER.indexOf(a.jenis_aspek) - ASPEK_ORDER.indexOf(b.jenis_aspek),
  );
  const allItems = groups.flatMap((group) => group.item);
  const anyTidakTercapai = allItems.some(
    (item) => !capaian[item.id]?.tercapai,
  );

  function toggleItem(id: number) {
    setCapaian((previous) => ({
      ...previous,
      [id]: {
        ...(previous[id] ?? { tercapai: false }),
        tercapai: !previous[id]?.tercapai,
      },
    }));
  }

  async function submit(mode: "draft" | "submit") {
    setPending(true);
    const itemCapaian = allItems.map((item) => ({
      id: item.id,
      is_tercapai: capaian[item.id]?.tercapai ?? false,
    }));
    const input = {
      is_tercapai: allItems.length > 0 && !anyTidakTercapai,
      is_tidak_tercapai: anyTidakTercapai,
      penjelasan_tercapai: penjelasanTercapai,
      penjelasan_tidak_tercapai: penjelasanTidakTercapai,
      rencana_tindak_lanjut: rencana,
      tanggal_next_reviu: tanggal,
      itemCapaian,
    };

    const result = isEdit
      ? await saveReviu(reviuId, mode, input)
      : await createReviu(dialogId!, mode, input);
    if (result?.error) {
      showError(result.error);
      setPending(false);
    }
  }

  const validToSubmit =
    allItems.length > 0 &&
    penjelasanTercapai.trim().length > 0 &&
    (!anyTidakTercapai ||
      (penjelasanTidakTercapai.trim().length > 0 &&
        rencana.trim().length > 0 &&
        tanggal.trim().length > 0));

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-outline bg-surface px-5 py-6 sm:px-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Hasil Capaian Item Evaluasi
        </span>
        <p className="text-sm leading-5 text-ink">
          Centang <strong>Tercapai</strong> untuk item evaluasi yang berhasil
          dicapai. Item yang tidak dicentang dianggap belum tercapai.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border border-outline bg-surface-muted/60 px-4 py-3 text-sm text-ink-muted">
          Dialog kinerja ini belum memiliki item evaluasi.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">
                {ASPEK_LABEL[group.jenis_aspek]}
              </span>
              <span className="text-xs leading-4 text-ink-muted">
                {group.item.length} item evaluasi
              </span>
            </div>
            {group.item.length === 0 ? (
              <div className="rounded-md border border-dashed border-outline px-4 py-3 text-xs text-ink-muted">
                Tidak ada item pada aspek ini.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {group.item.map((item) => {
                  const state = capaian[item.id] ?? { tercapai: false };
                  return (
                    <li
                      key={item.id}
                      className={`flex flex-col gap-2.5 rounded-md border px-4 py-3 transition-colors ${
                        state.tercapai
                          ? "border-primary/40 bg-primary-soft/30"
                          : "border-outline bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-5 text-ink">
                            {item.dialog_evaluasi?.trim()
                              ? item.dialog_evaluasi
                              : `Item evaluasi #${item.id}`}
                          </p>
                          {isLanjutan && previousItemKeys?.has(
                            `${item.dialog_evaluasi?.trim() ?? ""}|${item.kompetensi_dikembangkan?.trim() ?? ""}`,
                          ) ? (
                            <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              Dari evaluasi sebelumnya
                            </span>
                          ) : null}
                          {item.kompetensi_dikembangkan?.trim() ? (
                            <p className="mt-0.5 text-xs leading-4 text-ink-muted">
                              Kompetensi: {item.kompetensi_dikembangkan}
                            </p>
                          ) : null}
                        </div>
                        <label
                          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            state.tercapai
                              ? "border-primary bg-primary text-white"
                              : "border-outline text-ink hover:border-outline-strong"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={state.tercapai}
                            onChange={() => toggleItem(item.id)}
                            disabled={pending}
                            className="h-3.5 w-3.5 accent-white"
                          />
                          Tercapai
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}

      <div className="flex flex-col gap-4">
        <Field htmlFor="penjelasan_tercapai" label="Penjelasan singkat hasilnya (Tercapai)" required>
          <textarea
            id="penjelasan_tercapai"
            value={penjelasanTercapai}
            onChange={(event) => setPenjelasanTercapai(event.target.value)}
            disabled={pending}
            rows={4}
            className="w-full resize-y rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm leading-5 text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
            placeholder="Jelaskan singkat hasil yang telah tercapai"
          />
        </Field>

        <Field
          htmlFor="penjelasan_tidak_tercapai"
          label="Penjelasan singkat hasilnya (Tidak Tercapai)"
          required={anyTidakTercapai}
          hint={
            anyTidakTercapai
              ? "Wajib diisi karena masih ada item yang belum tercapai."
              : "Tidak wajib diisi apabila semua item sudah tercapai."
          }
        >
          <textarea
            id="penjelasan_tidak_tercapai"
            value={penjelasanTidakTercapai}
            onChange={(event) => setPenjelasanTidakTercapai(event.target.value)}
            disabled={pending}
            rows={4}
            className="w-full resize-y rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm leading-5 text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
            placeholder="Jelaskan penyebab item belum tercapai"
          />
        </Field>

        {anyTidakTercapai ? (
          <>
            <Field
              htmlFor="rencana_tindak_lanjut"
              label="Rencana dan Tindak Lanjut ke Depan (Tidak Tercapai)"
              required
              hint="Wajib diisi karena masih ada item yang belum tercapai."
            >
              <textarea
                id="rencana_tindak_lanjut"
                value={rencana}
                onChange={(event) => setRencana(event.target.value)}
                disabled={pending}
                rows={4}
                className="w-full resize-y rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm leading-5 text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
                placeholder="Rencana dan tindak lanjut ke depan yang akan dilakukan"
              />
            </Field>
            <Field
              htmlFor="tanggal_next_reviu"
              label="Tanggal Reviu Berikutnya"
              required
              hint="Kapan reviu berikutnya akan dilakukan."
            >
              <input
                id="tanggal_next_reviu"
                type="date"
                value={tanggal}
                onChange={(event) => setTanggal(event.target.value)}
                disabled={pending}
                className="w-full rounded-md border border-outline bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60"
              />
            </Field>
          </>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-outline pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="default"
          disabled={pending}
          onClick={() => submit("draft")}
        >
          Simpan Draft
        </Button>
        <Button
          type="button"
          size="default"
          loading={pending}
          disabled={!validToSubmit || pending}
          onClick={() => submit("submit")}
        >
          <ArrowRightIcon size={16} weight="bold" />
          Kirim ke Atasan
        </Button>
      </div>
    </div>
  );
}
