"use client";

import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  IdentificationBadgeIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
            className="text-xs font-bold uppercase tracking-[0.08em] text-[#8C8478]"
          >
            Nomor Pokok Pegawai (NPP)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8C8478]">
              <IdentificationBadgeIcon size={18} weight="bold" />
            </span>
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
              placeholder="Masukkan NPP"
              className="h-12 w-full rounded-lg border border-[#DCD5C9] bg-white pl-11 pr-3.5 text-sm text-[#1B1712] outline-none transition-[border-color,box-shadow] placeholder:text-[#8C8478] invalid:[&:not(:placeholder-shown)]:border-[#C8102E] focus:border-[#C8102E] focus:shadow-[0_0_0_3px_rgba(200,16,46,0.12)]"
            />
          </div>
          <span className="text-xs leading-4 text-[#8C8478]">
            NPP terdiri dari 7 digit angka.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase tracking-[0.08em] text-[#8C8478]"
            >
              Kata Sandi
            </label>
            
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8C8478]">
              <LockSimpleIcon size={18} weight="bold" />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              className="h-12 w-full rounded-lg border border-[#DCD5C9] bg-white pl-11 pr-11 text-sm text-[#1B1712] outline-none transition-[border-color,box-shadow] placeholder:text-[#8C8478] focus:border-[#C8102E] focus:shadow-[0_0_0_3px_rgba(200,16,46,0.12)]"
            />
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              title={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-3.5 flex items-center justify-center text-[#8C8478] transition-colors hover:text-[#1B1712]"
            >
              {showPassword ? <EyeSlashIcon size={18} weight="bold" /> : <EyeIcon size={18} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#C8102E] px-4 text-sm font-bold text-white transition-[transform,background] hover:-translate-y-0.5 hover:bg-[#A80D26] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <>
            Masuk
            <ArrowRightIcon size={16} weight="bold" />
          </>
        )}
      </button>
    </form>
  );
}