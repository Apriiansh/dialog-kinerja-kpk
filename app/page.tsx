import Link from "next/link";
import Image from "next/image";
import { getSession, homePathForRole } from "@/lib/auth/session";
import { LandingHeroCarousel } from "@/components/landing-carousel";
import { LandingSections } from "@/components/landing-sections";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = Boolean(session?.id);
  const userHomePath = session?.role ? homePathForRole(session.role) : "/login";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#070B14] text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200 selection:bg-[#d61a20] selection:text-white overflow-x-hidden scroll-smooth">
      {/* Top Red-Amber Accent Line */}
      <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#9e1318] via-amber-500 to-[#d61a20]" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B101E]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 sm:h-20 items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Left: KPK Logo & Official Branding */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0">
            <div className="relative h-9 w-7.5 sm:h-12 sm:w-10 shrink-0 drop-shadow-xs transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/images/logo-kpk-badge.png"
                alt="Logo Komisi Pemberantasan Korupsi"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-xs font-bold tracking-wider text-[#d61a20] dark:text-red-400 uppercase truncate">
                Komisi Pemberantasan Korupsi
              </span>
              <span className="text-sm sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                DIALOG KINERJA
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 hidden lg:block">
                Sistem Terintegrasi Pengelolaan Capaian & IDP Pegawai
              </span>
            </div>
          </Link>

          {/* Middle: Navigation Anchor Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#aspek" className="hover:text-[#d61a20] dark:hover:text-white transition-colors">
              Aspek Evaluasi (A–D)
            </a>
            <a href="#alur" className="hover:text-[#d61a20] dark:hover:text-white transition-colors">
              Alur Pengesahan
            </a>
            <a href="#tentang" className="hover:text-[#d61a20] dark:hover:text-white transition-colors">
              Tentang Sistem
            </a>
          </nav>

          {/* Right: Theme Toggle & Login CTA */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <ThemeToggle />

            {isLoggedIn ? (
              <Link
                href={userHomePath}
                className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-5 rounded-lg sm:rounded-xl bg-[#d61a20] hover:bg-[#a51318] text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
              >
                <span>Dashboard ({session.nama.split(" ")[0]})</span>
                <span className="hidden sm:inline">→</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-6 rounded-lg sm:rounded-xl bg-[#d61a20] hover:bg-[#a51318] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-red-950/20 hover:scale-[1.02] cursor-pointer"
              >
                <span>Masuk ke Sistem</span>
                <span className="hidden sm:inline">→</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-hidden">
        {/* CAROUSEL DIRECTLY BELOW HEADER */}
        <section className="w-full">
          <LandingHeroCarousel
            isLoggedIn={isLoggedIn}
            userRole={session?.role}
            userHomePath={userHomePath}
          />
        </section>

        {/* 5 ASPEK & ALUR SECTIONS WITH ABSTRACT BACKGROUNDS */}
        <LandingSections
          isLoggedIn={isLoggedIn}
          userHomePath={userHomePath}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05080F] text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 items-start">
            {/* Col 1: Instansi */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-7.5 sm:h-11 sm:w-9 shrink-0">
                  <Image
                    src="/images/logo-kpk-badge.png"
                    alt="Logo KPK"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    KOMISI PEMBERANTASAN KORUPSI
                  </h5>
                  <p className="text-xs text-slate-500 font-medium">Republik Indonesia</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Gedung Merah Putih KPK, Jl. Kuningan Persada Kav. 4, Setiabudi, Jakarta Selatan 12950
              </p>
            </div>

            {/* Col 2: Info Aplikasi */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Tentang Sistem
              </h5>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Aplikasi Dialog Kinerja KPK digunakan untuk memfasilitasi dialog kerja berkala, evaluasi kesenjangan kompetensi, dan penyusunan rencana pengembangan karir pegawai di lingkungan KPK RI.
              </p>
            </div>

            {/* Col 3: Akses Cepat */}
            <div className="space-y-2 md:text-right">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Bantuan & Layanan
              </h5>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                Hubungi Biro SDM / Pengelola Kinerja untuk bantuan administrasi akun.
              </p>
              <div className="pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-[#d61a20] dark:text-red-400 hover:underline font-bold"
                >
                  <span>Halaman Login Pegawai, Atasan, & Admin</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500 gap-2 font-normal">
            <p>© {new Date().getFullYear()} Komisi Pemberantasan Korupsi Republik Indonesia.</p>
            <p className="font-mono text-[11px] text-slate-400">SISTEM DIALOG KINERJA v2.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
