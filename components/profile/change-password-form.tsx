"use client";

import { useState } from "react";
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  WarningIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/lib/actions/profile";

const INPUT_CLASSES =
  "h-11 w-full rounded-md border border-outline bg-surface pl-3.5 pr-11 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus disabled:opacity-60";
const LABEL_CLASSES =
  "text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ChangePasswordState>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    try {
      const res = await changePasswordAction({}, formData);
      setState(res);
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error(err);
      setState({
        error: "Terjadi kesalahan saat memproses perubahan kata sandi.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-outline bg-surface">
      <div className="border-b border-outline bg-surface-muted/50 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink">
          Ganti Kata Sandi
        </h2>
        <p className="text-xs leading-4 text-ink-muted">
          Gunakan minimal 6 karakter untuk menjaga keamanan akun Anda.
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
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentPassword" className={LABEL_CLASSES}>
              Kata Sandi Saat Ini <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi saat ini"
                disabled={pending}
                className={INPUT_CLASSES}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-muted transition-colors hover:text-ink"
                aria-label={
                  showCurrent
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showCurrent ? (
                  <EyeSlashIcon size={18} weight="bold" />
                ) : (
                  <EyeIcon size={18} weight="bold" />
                )}
              </button>
            </div>
            {state.fieldErrors?.currentPassword ? (
              <p className="text-xs font-medium text-error">
                {state.fieldErrors.currentPassword}
              </p>
            ) : null}
          </div>

          {/* New Password & Confirm Password */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className={LABEL_CLASSES}>
                Kata Sandi Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  disabled={pending}
                  className={INPUT_CLASSES}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-muted transition-colors hover:text-ink"
                  aria-label={
                    showNew
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showNew ? (
                    <EyeSlashIcon size={18} weight="bold" />
                  ) : (
                    <EyeIcon size={18} weight="bold" />
                  )}
                </button>
              </div>
              {state.fieldErrors?.newPassword ? (
                <p className="text-xs font-medium text-error">
                  {state.fieldErrors.newPassword}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className={LABEL_CLASSES}>
                Konfirmasi Kata Sandi Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  disabled={pending}
                  className={INPUT_CLASSES}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-muted transition-colors hover:text-ink"
                  aria-label={
                    showConfirm
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showConfirm ? (
                    <EyeSlashIcon size={18} weight="bold" />
                  ) : (
                    <EyeIcon size={18} weight="bold" />
                  )}
                </button>
              </div>
              {state.fieldErrors?.confirmPassword ? (
                <p className="text-xs font-medium text-error">
                  {state.fieldErrors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline">
            <button
              type="submit"
              disabled={pending || !currentPassword || !newPassword || !confirmPassword}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
              ) : (
                <>
                  Simpan Kata Sandi Baru
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
