import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";
import {
  ArrowLeftIcon,
  BankIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

const TAHOMA = { fontFamily: "Tahoma, 'Segoe UI', Verdana, sans-serif" };

export default function LoginPage() {
  return (
    <main style={TAHOMA} className="flex min-h-screen">
      {/* ---------- LEFT: brand / motif panel ---------- */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-strong lg:block">
        <Image
          src="/images/n/gedung-1-side.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-linear-to-br from-primary-strong/75 via-[#a30d24]/60 to-[#6f0814]/85" />

        {/* decorative duality rings — cyan + violet, echoes landing page motif */}
        <svg
          className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 opacity-40"
          viewBox="0 0 300 300"
          aria-hidden
        >
          <circle cx="120" cy="140" r="90" fill="none" stroke="#12A9B0" strokeWidth="1.5" />
          <circle cx="170" cy="170" r="90" fill="none" stroke="#6B4FC7" strokeWidth="1.5" />
        </svg>

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
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                KPK HR Portal
              </p>
            </div>
          </div>

          <div className="max-w-sm">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/60">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#12A9B0]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#6B4FC7]" />
              </span>
              Dua suara, satu dialog
            </p>
            <h1 className="text-2xl font-bold leading-snug">
              Integritas dalam Kinerja
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Platform evaluasi kinerja yang transparan, akuntabel, dan
              terstruktur untuk mendukung profesionalisme pegawai KPK.
            </p>
          </div>

          <p className="text-xs text-white/60">
            &copy; 2026 Komisi Pemberantasan Korupsi. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* ---------- RIGHT: form panel ---------- */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-primary-strong"
          >
            <ArrowLeftIcon size={16} weight="bold" />
            Kembali
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
            Masuk ke Akun Anda
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-outline-strong">
            Silakan masukkan NPP dan kata sandi Anda untuk melanjutkan.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-4 text-center text-xs text-outline-strong">
            &copy; 2026 Tim Magang Biro SDM. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}