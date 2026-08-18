"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  WarningIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import {
  updateProfilePreferencesAction,
  type ProfilePreferencesState,
} from "@/lib/actions/profile";
import type { UserProfileData } from "@/lib/queries/profile";
import type { Role } from "@/lib/auth/session";

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus disabled:opacity-60";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

export function ProfilePreferencesForm({
  user,
  allowedRoles,
}: {
  user: UserProfileData;
  allowedRoles: Role[];
}) {
  const [defaultRole, setDefaultRole] = useState<Role>(user.default_role);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ProfilePreferencesState>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});

    const formData = new FormData();
    formData.set("default_role", defaultRole);

    try {
      const res = await updateProfilePreferencesAction({}, formData);
      setState(res);
    } catch (err) {
      console.error(err);
      setState({
        error: "Terjadi kesalahan saat menyimpan pengaturan preferensi.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Pengaturan Preferensi Login */}
      <div className="overflow-hidden rounded-lg border border-outline bg-surface">
        <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-ink">
            Pengaturan Peran Utama saat Login
          </h2>
          <p className="text-xs leading-4 text-ink-muted">
            Tentukan halaman beranda yang terbuka secara otomatis setelah Anda masuk.
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="default_role" className={LABEL_CLASSES}>
                Peran Utama saat Login
              </label>
              <select
                id="default_role"
                name="default_role"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value as Role)}
                disabled={pending || allowedRoles.length <= 1}
                className={INPUT_CLASSES}
              >
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {role === "ADMIN"
                      ? "Administrator (Admin)"
                      : role === "ATASAN"
                        ? "Pejabat Penilai (Atasan)"
                        : "Pegawai Negeri (Pegawai)"}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-5 text-ink-muted">
                Jika memiliki lebih dari satu peran, Anda tetap dapat berganti peran secara langsung melalui menu &quot;Ganti Peran&quot; di navigasi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline">
              <button
                type="submit"
                disabled={pending || defaultRole === user.default_role}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
                ) : (
                  <>
                    Simpan Preferensi
                    <ArrowRightIcon size={16} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
