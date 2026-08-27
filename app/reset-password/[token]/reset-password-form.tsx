"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeSlashIcon, LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}

      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-bold uppercase tracking-[0.08em] text-[#8C8478]"
        >
          Password Baru
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8C8478]">
            <LockSimpleIcon size={18} weight="bold" />
          </span>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Masukkan password baru"
            className="h-12 border-[#DCD5C9] bg-white pl-11 pr-11 text-sm placeholder:text-[#8C8478]"
          />
          <button
            type="button"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-3.5 flex items-center justify-center text-[#8C8478] transition-colors hover:text-[#1B1712]"
          >
            {showPassword ? <EyeSlashIcon size={18} weight="bold" /> : <EyeIcon size={18} weight="bold" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirm_password"
          className="text-xs font-bold uppercase tracking-[0.08em] text-[#8C8478]"
        >
          Konfirmasi Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8C8478]">
            <LockSimpleIcon size={18} weight="bold" />
          </span>
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Ulangi password baru"
            className="h-12 border-[#DCD5C9] bg-white pl-11 pr-11 text-sm placeholder:text-[#8C8478]"
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
            title={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute inset-y-0 right-3.5 flex items-center justify-center text-[#8C8478] transition-colors hover:text-[#1B1712]"
          >
            {showConfirmPassword ? <EyeSlashIcon size={18} weight="bold" /> : <EyeIcon size={18} weight="bold" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        loading={pending}
        className="h-12 rounded-full bg-[#C8102E] text-sm font-bold text-white hover:bg-[#A80D26]"
      >
        Simpan Password Baru
      </Button>
    </form>
  );
}
