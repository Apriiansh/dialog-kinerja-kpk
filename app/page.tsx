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
      className="min-h-screen flex flex-col bg-[#F6F3EE] dark:bg-[#15120D] text-[#1B1712] dark:text-[#F2EEE7] transition-colors duration-200 selection:bg-[#C8102E] selection:text-white overflow-x-hidden scroll-smooth"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-[#F6F3EE]/80 dark:bg-[#15120D]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#F6F3EE]/60 dark:supports-[backdrop-filter]:bg-[#15120D]/60">
        <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="relative h-8 w-6.5 sm:h-10 sm:w-8 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/images/logo-kpk-badge.png"
                alt="Logo KPK"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#C8102E] dark:text-[#FF7A86] uppercase leading-none">
                KPK
              </span>
              <span className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-[#1B1712] dark:text-white leading-tight">
                Dialog Kinerja
              </span>
            </div>
          </Link>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-[#5A544A] dark:text-[#C9C2B6]">
            {[
              { href: "#aspek", label: "Aspek Evaluasi" },
              { href: "#alur", label: "Alur Pengesahan" },
              { href: "#tentang", label: "Tentang" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-md hover:bg-[#1B1712]/5 dark:hover:bg-white/5 hover:text-[#C8102E] dark:hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />

            {isLoggedIn ? (
              <Link
                href={userHomePath}
                className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-[#C8102E] hover:bg-[#A80D26] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-4 rounded-lg bg-[#C8102E] hover:bg-[#A80D26] text-white text-xs font-semibold transition-colors cursor-pointer"
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
      <footer className="border-t border-[#DCD5C9]/60 dark:border-white/5 bg-[#F6F3EE] dark:bg-[#15120D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 sm:py-10">
            {/* Left: Brand */}
            <div className="flex items-center gap-2.5">
              <div className="relative h-7 w-5.5 shrink-0">
                <Image
                  src="/images/logo-kpk-badge.png"
                  alt="Logo KPK"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider text-[#1B1712] dark:text-white uppercase leading-none">
                  KPK
                </p>
                <p className="text-[10px] font-medium text-[#8C8478] dark:text-[#6B6560] leading-tight">
                  Dialog Kinerja
                </p>
              </div>
            </div>

            {/* Center: Nav */}
            <nav className="flex items-center gap-4 text-[11px] sm:text-xs font-medium text-[#8C8478] dark:text-[#6B6560]">
              <a href="#aspek" className="hover:text-[#1B1712] dark:hover:text-white transition-colors">Aspek Evaluasi</a>
              <span className="w-px h-3 bg-[#DCD5C9] dark:bg-white/10" />
              <a href="#alur" className="hover:text-[#1B1712] dark:hover:text-white transition-colors">Alur Pengesahan</a>
              <span className="w-px h-3 bg-[#DCD5C9] dark:bg-white/10" />
              <a href="#tentang" className="hover:text-[#1B1712] dark:hover:text-white transition-colors">Tentang</a>
            </nav>

            {/* Right: Login link */}
            <Link
              href="/login"
              className="text-[11px] sm:text-xs font-semibold text-[#C8102E] dark:text-[#FF7A86] hover:underline"
            >
              Masuk →
            </Link>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#DCD5C9]/60 dark:border-white/5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-[#A09889] dark:text-[#5A544A]">
            <p>© {new Date().getFullYear()} Komisi Pemberantasan Korupsi RI</p>
            <p>Gedung Merah Putih KPK, Jakarta Selatan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}