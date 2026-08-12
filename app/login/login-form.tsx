"use client";

import { Warning, ArrowRight } from "@phosphor-icons/react";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialLoginState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md bg-error-container px-4 py-3 text-sm leading-5 text-on-error-container"
        >
          <Warning size={18} weight="fill" className="mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

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
            maxLength={15}
            pattern="[0-9]{15}"
            title="max 15 digit"
            placeholder="Masukkan NPP Anda"
            className="h-11 rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 invalid:[&:not(:placeholder-shown)]:border-error focus:border-primary focus:shadow-focus"
          />
          <span className="text-xs leading-4 text-ink-muted">
            NPP max 15 digit angka.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-muted"
          >
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            className="h-11 rounded-md border border-outline bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
          />
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
