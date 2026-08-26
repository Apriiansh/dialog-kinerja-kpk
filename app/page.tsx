import Link from "next/link";
import Image from "next/image";
import { getSession, homePathForRole } from "@/lib/auth/session";
import { LandingHeroCarousel } from "@/components/landing-carousel";
import { LandingSections } from "@/components/landing-sections";
import { ThemeToggle } from "@/components/theme-toggle";

const TAHOMA = { fontFamily: "Tahoma, 'Segoe UI', Verdana, sans-serif" };

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = Boolean(session?.id);
  const userHomePath = session?.role ? homePathForRole(session.role) : "/login";

  return (
    <div
      style={TAHOMA}
      className="min-h-screen flex flex-col bg-background dark:bg-[#15120D] text-ink dark:text-[#F2EEE7] transition-colors duration-200 selection:bg-primary-strong selection:text-white overflow-x-hidden scroll-smooth"
    >
      {/* Top accent line — institutional red, no amber */}
      <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#7A0B1F] via-[#C8102E] to-[#7A0B1F]" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-outline dark:border-white/10 bg-background/95 dark:bg-[#15120D]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6 lg:px-8 gap-6">
          {/* Left: KPK Logo & Branding */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="relative h-8 w-6.5 shrink-0">
              <Image
                src="/images/logo-kpk-badge.png"
                alt="Logo Komisi Pemberantasan Korupsi"
                fill
                sizes="32px"
                priority
                className="object-contain"
              />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-ink dark:text-white truncate">
              Dialog Kinerja
            </span>
          </Link>

          {/* Middle: Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-muted dark:text-[#C9C2B6]">
            <a href="#aspek" className="hover:text-ink dark:hover:text-white transition-colors">
              Aspek Evaluasi
            </a>
            <a href="#alur" className="hover:text-ink dark:hover:text-white transition-colors">
              Alur Pengesahan
            </a>
            <a href="#tentang" className="hover:text-ink dark:hover:text-white transition-colors">
              Tentang Sistem
            </a>
          </nav>

          {/* Right: Theme Toggle & Login CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />

            {isLoggedIn ? (
              <Link
                href={userHomePath}
                className="inline-flex items-center h-9 px-4 rounded-full bg-primary-strong hover:bg-[#A80D26] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center h-9 px-4 rounded-full bg-primary-strong hover:bg-[#A80D26] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-hidden">
        <section className="w-full">
          <LandingHeroCarousel
            isLoggedIn={isLoggedIn}
            userRole={session?.role}
            userHomePath={userHomePath}
          />
        </section>

        <LandingSections isLoggedIn={isLoggedIn} userHomePath={userHomePath} />
      </main>

      {/* Footer */}
      <footer className="border-t border-outline dark:border-white/10 bg-surface-soft dark:bg-[#100D09] text-ink-muted dark:text-[#A89F91]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Left: identity + address */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="relative h-7 w-5.5 shrink-0">
                  <Image src="/images/logo-kpk-badge.png" alt="Logo KPK" fill sizes="28px" className="object-contain" />
                </div>
                <span className="text-base font-bold text-ink dark:text-[#F2EEE7]">
                  Dialog Kinerja
                </span>
              </div>

              <p className="text-sm leading-relaxed max-w-sm">
                Memfasilitasi dialog kerja berkala, evaluasi kesenjangan
                kompetensi, dan rencana pengembangan karir pegawai di
                lingkungan KPK RI.
              </p>

              <p className="text-xs leading-relaxed max-w-sm text-outline-strong">
                Gedung Merah Putih KPK, Jl. Kuningan Persada Kav. 4, Setiabudi,
                Jakarta Selatan 12950
              </p>
            </div>

            {/* Right: two plain link lists */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-8 lg:justify-items-end lg:text-right">
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-[0.08em] text-ink dark:text-[#F2EEE7]">
                  Bantuan
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/login" className="hover:text-primary-strong dark:hover:text-[#FF7A86] transition-colors">
                      Masuk ke Sistem
                    </Link>
                  </li>
                  <li>Biro SDM KPK</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-[0.08em] text-ink dark:text-[#F2EEE7]">
                  Sistem Terkait
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="https://idp.kpk.go.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary-strong dark:hover:text-[#FF7A86] transition-colors"
                    >
                      idp.kpk.go.id
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://hris.kpk.go.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary-strong dark:hover:text-[#FF7A86] transition-colors"
                    >
                      hris.kpk.go.id
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-outline dark:border-white/10 flex items-center justify-center text-xs">
            <p>© {new Date().getFullYear()} Komisi Pemberantasan Korupsi Republik Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}