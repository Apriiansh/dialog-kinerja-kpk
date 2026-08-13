"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FloppyDiskIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import {
  saveDialogForm,
  type AspekInput,
} from "@/lib/actions/pegawai";
import { ASPEK_DESC, ASPEK_LABEL, ASPEK_ORDER } from "@/lib/aspek";
import type { JenisAspek } from "@/generated/prisma/enums";

interface MetodeOption {
  id: number;
  nama_metode: string;
}

interface ItemDraft {
  id?: number;
  dialog_evaluasi: string;
  kompetensi_dikembangkan: string;
  id_metode_pengembangan: string;
  metode_pengembangan_lainnya: string;
  waktu_pelaksanaan: string;
}

interface AspekDraft {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string;
  items: ItemDraft[];
}

interface ExistingAspek {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string | null;
  item: {
    id: number;
    dialog_evaluasi: string | null;
    kompetensi_dikembangkan: string | null;
    id_metode_pengembangan: number | null;
    metode_pengembangan_lainnya: string | null;
    waktu_pelaksanaan: Date | null;
  }[];
}

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus";
const TEXTAREA_CLASSES =
  "w-full rounded-md border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

function emptyItem(): ItemDraft {
  return {
    dialog_evaluasi: "",
    kompetensi_dikembangkan: "",
    id_metode_pengembangan: "",
    metode_pengembangan_lainnya: "",
    waktu_pelaksanaan: "",
  };
}

function toDateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DialogForm({
  dialogId,
  periodeTahun,
  deskripsiKinerja,
  atasanNama,
  aspek,
  metodeList,
}: {
  dialogId: number;
  periodeTahun: number;
  deskripsiKinerja: string | null;
  atasanNama: string;
  aspek: ExistingAspek[];
  metodeList: MetodeOption[];
}) {
  const [drafts, setDrafts] = useState<AspekDraft[]>(() =>
    ASPEK_ORDER.map((jenis) => {
      const existing = aspek.find((a) => a.jenis_aspek === jenis);
      return {
        jenis_aspek: jenis,
        tanggung_jawab_pegawai: existing?.tanggung_jawab_pegawai ?? "",
        items: (existing?.item ?? []).map((item) => ({
          id: item.id,
          dialog_evaluasi: item.dialog_evaluasi ?? "",
          kompetensi_dikembangkan: item.kompetensi_dikembangkan ?? "",
          id_metode_pengembangan: item.id_metode_pengembangan
            ? String(item.id_metode_pengembangan)
            : "",
          metode_pengembangan_lainnya: item.metode_pengembangan_lainnya ?? "",
          waktu_pelaksanaan: toDateInputValue(item.waktu_pelaksanaan),
        })),
      };
    }),
  );
  const [pending, setPending] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const isLainnya = useMemo(() => {
    const names = new Map(metodeList.map((m) => [m.id, m.nama_metode]));
    return (id: string) => {
      const name = names.get(Number(id));
      return name ? name.toLowerCase().includes("lainnya") : false;
    };
  }, [metodeList]);

  function updateAspek(jenis: JenisAspek, patch: Partial<AspekDraft>) {
    setDrafts((prev) =>
      prev.map((d) => (d.jenis_aspek === jenis ? { ...d, ...patch } : d)),
    );
  }

  function updateItem(
    jenis: JenisAspek,
    index: number,
    patch: Partial<ItemDraft>,
  ) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.jenis_aspek !== jenis) return d;
        const items = d.items.map((item, i) =>
          i === index ? { ...item, ...patch } : item,
        );
        return { ...d, items };
      }),
    );
  }

  function addItem(jenis: JenisAspek) {
    updateAspek(jenis, {
      items: [
        ...drafts.find((d) => d.jenis_aspek === jenis)!.items,
        emptyItem(),
      ],
    });
  }

  function removeItem(jenis: JenisAspek, index: number) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.jenis_aspek === jenis
          ? { ...d, items: d.items.filter((_, i) => i !== index) }
          : d,
      ),
    );
  }

  async function handleSubmit(mode: "draft" | "submit") {
    setError(undefined);
    setNotice(undefined);
    setPending(mode);

    const payload: AspekInput[] = drafts.map((d) => ({
      jenis_aspek: d.jenis_aspek,
      tanggung_jawab_pegawai: d.tanggung_jawab_pegawai,
      items: d.items.map((item) => ({
        id: item.id,
        dialog_evaluasi: item.dialog_evaluasi,
        kompetensi_dikembangkan: item.kompetensi_dikembangkan,
        id_metode_pengembangan: item.id_metode_pengembangan
          ? Number(item.id_metode_pengembangan)
          : null,
        metode_pengembangan_lainnya: item.metode_pengembangan_lainnya,
        waktu_pelaksanaan: item.waktu_pelaksanaan,
      })),
    }));

    const result = await saveDialogForm(dialogId, mode, payload);

    if (result?.error) {
      setError(result.error);
      setPending(null);
      return;
    }

    if (mode === "draft") {
      setPending(null);
      setNotice("Draft dialog berhasil disimpan.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/pegawai/dialog/${dialogId}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon size={16} weight="bold" />
          Kembali ke Detail
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.01em] text-ink">
            Isi Dialog Kinerja Tahun {periodeTahun}
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            Atasan: {atasanNama} · Lengkapi kelima aspek evaluasi di bawah ini.
          </p>
        </div>

        {deskripsiKinerja?.trim() ? (
          <div className="rounded-lg border border-outline bg-surface px-5 py-4">
            <span className={LABEL_CLASSES}>Deskripsi Kinerja (dari Atasan)</span>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-ink">
              {deskripsiKinerja}
            </p>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md bg-error-container px-4 py-3 text-sm leading-5 text-on-error-container"
        >
          <WarningIcon size={18} weight="fill" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md bg-status-green-soft px-4 py-3 text-sm leading-5 text-status-green"
        >
          <FloppyDiskIcon size={18} weight="bold" className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {drafts.map((draft, aspekIndex) => (
          <section
            key={draft.jenis_aspek}
            aria-labelledby={`aspek-${draft.jenis_aspek}`}
            className="rounded-lg border border-outline bg-surface"
          >
            <div className="flex flex-col gap-0.5 border-b border-outline px-5 py-3.5">
              <h2
                id={`aspek-${draft.jenis_aspek}`}
                className="text-sm font-semibold text-ink"
              >
                {aspekIndex + 1}. {ASPEK_LABEL[draft.jenis_aspek]}
              </h2>
              <p className="text-xs leading-4 text-ink-muted">
                {ASPEK_DESC[draft.jenis_aspek]}
              </p>
            </div>

            <div className="flex flex-col gap-5 px-5 py-4">
              <button
                type="button"
                onClick={() => addItem(draft.jenis_aspek)}
                disabled={pending !== null}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-outline px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <PlusIcon size={14} weight="bold" />
                Tambah Rincian
              </button>

              {draft.items.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {draft.items.map((item, itemIndex) => (
                    <fieldset
                      key={itemIndex}
                      className="flex flex-col gap-3 rounded-md border border-outline bg-surface-muted/40 px-4 py-3.5"
                    >
                      <legend className="px-1 text-xs font-semibold text-ink-muted">
                        Rincian #{itemIndex + 1}
                      </legend>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${draft.jenis_aspek}-${itemIndex}-tujuan`}
                          className={LABEL_CLASSES}
                        >
                          Tujuan / Evaluasi
                        </label>
                        <input
                          id={`${draft.jenis_aspek}-${itemIndex}-tujuan`}
                          type="text"
                          value={item.dialog_evaluasi}
                          onChange={(e) =>
                            updateItem(draft.jenis_aspek, itemIndex, {
                              dialog_evaluasi: e.target.value,
                            })
                          }
                          placeholder="Tujuan evaluasi atau aspirasi"
                          className={INPUT_CLASSES}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor={`${draft.jenis_aspek}-${itemIndex}-kompetensi`}
                          className={LABEL_CLASSES}
                        >
                          Kompetensi yang Dikembangkan
                        </label>
                        <input
                          id={`${draft.jenis_aspek}-${itemIndex}-kompetensi`}
                          type="text"
                          value={item.kompetensi_dikembangkan}
                          onChange={(e) =>
                            updateItem(draft.jenis_aspek, itemIndex, {
                              kompetensi_dikembangkan: e.target.value,
                            })
                          }
                          placeholder="Nama kompetensi"
                          className={INPUT_CLASSES}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`${draft.jenis_aspek}-${itemIndex}-metode`}
                            className={LABEL_CLASSES}
                          >
                            Metode Pengembangan
                          </label>
                          <select
                            id={`${draft.jenis_aspek}-${itemIndex}-metode`}
                            value={item.id_metode_pengembangan}
                            onChange={(e) =>
                              updateItem(draft.jenis_aspek, itemIndex, {
                                id_metode_pengembangan: e.target.value,
                              })
                            }
                            className={INPUT_CLASSES}
                          >
                            <option value="">— Pilih Metode —</option>
                            {metodeList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nama_metode}
                              </option>
                            ))}
                          </select>
                        </div>

                        {isLainnya(item.id_metode_pengembangan) ? (
                          <div className="flex flex-col gap-1.5">
                            <label
                              htmlFor={`${draft.jenis_aspek}-${itemIndex}-metode-lain`}
                              className={LABEL_CLASSES}
                            >
                              Sebutkan Metode Lainnya
                            </label>
                            <input
                              id={`${draft.jenis_aspek}-${itemIndex}-metode-lain`}
                              type="text"
                              value={item.metode_pengembangan_lainnya}
                              onChange={(e) =>
                                updateItem(draft.jenis_aspek, itemIndex, {
                                  metode_pengembangan_lainnya: e.target.value,
                                })
                              }
                              placeholder="Nama metode lainnya"
                              className={INPUT_CLASSES}
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`${draft.jenis_aspek}-${itemIndex}-waktu`}
                            className={LABEL_CLASSES}
                          >
                            Waktu Pelaksanaan
                          </label>
                          <input
                            id={`${draft.jenis_aspek}-${itemIndex}-waktu`}
                            type="date"
                            value={item.waktu_pelaksanaan}
                            onChange={(e) =>
                              updateItem(draft.jenis_aspek, itemIndex, {
                                waktu_pelaksanaan: e.target.value,
                              })
                            }
                            className={INPUT_CLASSES}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(draft.jenis_aspek, itemIndex)
                        }
                        disabled={pending !== null}
                        className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-error transition-colors hover:bg-error-container disabled:opacity-50"
                      >
                        <TrashIcon size={14} weight="bold" />
                        Hapus Rincian
                      </button>
                    </fieldset>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${draft.jenis_aspek}-tj`}
                  className={LABEL_CLASSES}
                >
                  Tanggung Jawab Pegawai
                </label>
                <textarea
                  id={`${draft.jenis_aspek}-tj`}
                  rows={3}
                  value={draft.tanggung_jawab_pegawai}
                  onChange={(e) =>
                    updateAspek(draft.jenis_aspek, {
                      tanggung_jawab_pegawai: e.target.value,
                    })
                  }
                  placeholder="Langkah atau komitmen yang akan Anda lakukan"
                  className={TEXTAREA_CLASSES}
                />
              </div>

              
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => handleSubmit("draft")}
          disabled={pending !== null}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-outline-strong px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "draft" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-muted/40 border-t-ink-muted" />
          ) : (
            <FloppyDiskIcon size={16} weight="bold" />
          )}
          Simpan Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("submit")}
          disabled={pending !== null}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "submit" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
          ) : (
            <>
              Kirim ke Atasan
              <ArrowRightIcon size={16} weight="bold" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}