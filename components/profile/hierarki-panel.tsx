"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { pilihAtasan } from "@/lib/actions/hierarki";
import {
  error as showError,
  success as showSuccess,
} from "@/components/ui/toast";
import type { KandidatUser } from "@/lib/queries/hierarki";
import type { UserProfileData } from "@/lib/queries/profile";

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus disabled:opacity-60";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

export function HierarkiPanel({
  user,
  kandidatAtasan,
}: {
  user: UserProfileData;
  kandidatAtasan: KandidatUser[];
}) {
  const [atasanId, setAtasanId] = useState("");
  const [pendingAtasan, setPendingAtasan] = useState(false);

  async function handleSelectAtasan() {
    if (!atasanId) return;
    setPendingAtasan(true);
    try {
      const res = await pilihAtasan(atasanId);

      if (res.error) {
        showError(res.error);
      } else {
        showSuccess("Atasan berhasil dipilih");
        setAtasanId("");
      }
    } catch {
      showError("Terjadi kesalahan saat memilih atasan");
    } finally {
      setPendingAtasan(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-lg border border-outline bg-surface">
          <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
            <h2>Pilih Atasan</h2>
            <p>Tentukan atasan langsung. Perubahan langsung aktif</p>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={LABEL_CLASSES}>Atasan saat ini</span>
              {user.atasan ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">
                    {user.atasan.nama_pegawai}
                  </span>
                  <span className="text-xs text-ink-muted">
                    NPP {user.atasan.npp}
                    {user.atasan.nama_jabatan
                      ? ` . ${user.atasan.nama_jabatan}`
                      : ""}
                  </span>
                  {user.atasan.unit_kerja ? (
                    <span className="text-xs text-ink-muted">
                      {user.atasan.unit_kerja}
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-sm text-ink-muted">
                  Belum memiliki atasan langsung
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pilih_atasan" className={LABEL_CLASSES}>
                Ganti Atasan
              </label>
              <select
                id="pilih_atasan"
                value={atasanId}
                onChange={(e) => setAtasanId(e.target.value)}
                disabled={pendingAtasan || kandidatAtasan.length === 0}
                className={INPUT_CLASSES}
              >
                <option value="">— Pilih atasan —</option>
                {kandidatAtasan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_pegawai}
                    {k.nama_jabatan ? ` — ${k.nama_jabatan}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSelectAtasan}
                disabled={pendingAtasan || !atasanId}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAtasan ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
                ) : (
                  <>
                    Pilih Atasan
                    <ArrowRightIcon size={16} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
    </div>
  );
}
