import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, BankIcon, KeyIcon } from "@phosphor-icons/react/dist/ssr";
import { ForgotPasswordForm } from "./forgot-password-form";

const TAHOMA = { fontFamily: "Tahoma, 'Segoe UI', Verdana, sans-serif" };

export default function ForgotPasswordPage() {
  return (
    <main style={TAHOMA} className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-strong lg:block">
        <Image
          src="/images/n/gedung-1-side.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-strong/75 via-[#a30d24]/60 to-[#6f0814]/85" />

        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-kpk.png"
              alt="Logo KPK"
              width={280}
              height={83}
              priority
              className="h-10 w-auto"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold">Dialog Kinerja</p>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/70">
                Pemulihan Akses Akun
              </p>
            </div>
          </div>

          <div className="max-w-sm">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/60">
              <KeyIcon size={14} weight="bold" />
              Reset password aman
            </p>
            <h1 className="text-2xl font-bold leading-snug">
              Pulihkan akses akun Anda
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Masukkan NPP untuk menerima tautan reset password ke email yang
              terdaftar di sistem.
            </p>
          </div>

          <p className="text-xs text-white/60">
            &copy; 2026 Komisi Pemberantasan Korupsi. All Rights Reserved.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-primary-strong"
          >
            <ArrowLeftIcon size={16} weight="bold" />
            Kembali ke login
          </Link>

          <div className="mb-8 lg:hidden">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-strong text-white">
                <BankIcon size={18} weight="fill" />
              </span>
              <p className="text-sm font-bold text-ink">Dialog Kinerja</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Lupa kata sandi?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-outline-strong">
            Kami akan mengirim tautan reset password ke email yang terdaftar
            pada akun Anda.
          </p>

          <div className="mt-8">
            <ForgotPasswordForm />
          </div>

          <p className="mt-4 text-center text-xs text-outline-strong">
            &copy; 2026 Tim Magang Biro SDM. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
