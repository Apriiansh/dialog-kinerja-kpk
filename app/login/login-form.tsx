"use client";

import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction, type LoginState } from "./actions";
import { error as showError } from "@/components/ui/toast";

const initialLoginState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.error && state.error !== lastErrorRef.current) {
      lastErrorRef.current = state.error;
      showError(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="npp"
            className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
          >
            NPP
          </label>
          <input
            id="npp"
            name="npp"
            type="text"
            required
            autoComplete="username"
            inputMode="numeric"
            maxLength={7}
            pattern="[0-9]{7}"
            title="NPP terdiri dari 7 digit angka"
            placeholder="Masukkan NPP Anda"
            className="h-11 rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 invalid:[&:not(:placeholder-shown)]:border-error focus:border-primary focus:shadow-focus"
          />
          <span className="text-xs leading-4 text-ink-muted">
            NPP terdiri dari 7 digit angka.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
          >
            Kata Sandi
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              className="h-11 w-full rounded-md border border-outline bg-surface pr-11 pl-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
            />
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-ink-muted transition-colors hover:text-ink"
            >
              {showPassword ? <EyeSlash size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
        ) : (
          <>
            Masuk
            <ArrowRight size={16} weight="bold" />
          </>
        )}
      </button>
    </form>
  );
}
