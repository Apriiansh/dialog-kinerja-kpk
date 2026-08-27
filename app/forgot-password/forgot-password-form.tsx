"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { IdentificationBadgeIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      formRef.current?.reset();
    }
  }, [state.message]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      {state.error ? <Banner tone="error">{state.error}</Banner> : null}
      {state.message ? <Banner tone="success">{state.message}</Banner> : null}

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
          <Input
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
            className="h-12 border-[#DCD5C9] bg-white pl-11 pr-3.5 text-sm placeholder:text-[#8C8478] invalid:[&:not(:placeholder-shown)]:border-[#C8102E]"
          />
        </div>
        <p className="text-xs leading-4 text-[#8C8478]">
          Masukkan NPP untuk menerima tautan reset password ke email terdaftar.
        </p>
      </div>

      <Button
        type="submit"
        loading={pending}
        className="h-12 rounded-full bg-[#C8102E] text-sm font-bold text-white hover:bg-[#A80D26]"
      >
        Kirim Tautan Reset
        <ArrowRightIcon size={16} weight="bold" />
      </Button>

      <p className="text-center text-xs text-[#8C8478]">
        Ingat password Anda?{" "}
        <Link href="/login" className="font-semibold text-[#C8102E] hover:text-[#A80D26]">
          Kembali ke login
        </Link>
      </p>
    </form>
  );
}
