"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { TypewriterText } from "@/components/typewriter-text";
import { ArrowRightIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

interface LandingHeroProps {
  isLoggedIn: boolean;
  userRole?: string;
  userHomePath?: string;
}

const slides = [
  {
    id: 1,
    image: "/images/gedung-kpk-1.jpg",
    locationTag: "Gedung Merah Putih KPK · Jakarta Selatan",
    title: "Sistem Dialog Kinerja KPK",
    subtitle: "Penyelarasan Kinerja, Integritas, dan Capaian Target Lembaga",
    description:
      "Aplikasi resmi pengelolaan dan evaluasi capaian kinerja pegawai di lingkungan Komisi Pemberantasan Korupsi yang terpadu, objektif, dan akuntabel.",
    typewriter: true,
  },
  {
    id: 2,
    image: "/images/gedung-kpk-2.jpg",
    locationTag: "Pusat Edukasi Antikorupsi · Gedung KPK C1",
    title: "Reviu & Bimbingan Kinerja Berkala",
    subtitle: "Komunikasi Dua Arah yang Konstruktif Antara Atasan dan Pegawai",
    description:
      "Mendorong pemantauan berkala realisasi SKP, identifikasi tantangan kerja secara dini, serta pemberian arahan pembinaan yang berkesinambungan.",
    typewriter: false,
  },
  {
    id: 3,
    image: "/images/gedung-kpk-3.jpg",
    locationTag: "Kawasan Terpadu Komisi Pemberantasan Korupsi",
    title: "Rencana Pengembangan Individu (IDP)",
    subtitle: "Akselerasi Kompetensi dan Aspirasi Karir Pegawai",
    description:
      "Memetakan tindak lanjut kesenjangan kompetensi hasil asesmen dan merencanakan pengembangan karir jangka pendek (1–2 tahun) maupun jangka menengah (3–5 tahun).",
    typewriter: false,
  },
];

export function LandingHeroCarousel({
  isLoggedIn,
  userHomePath = "/login",
}: LandingHeroProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full relative bg-[#15120D] overflow-hidden border-b border-[#DCD5C9] dark:border-white/10">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 6000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="m-0">
          {slides.map((slide, index) => {
            const isActive = current === index;

            return (
              <CarouselItem key={slide.id} className="p-0 relative w-full">
                <div className="relative w-full min-h-[520px] sm:min-h-[560px] md:min-h-[600px] lg:min-h-[640px] flex items-center">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    className="object-cover object-center"
                    sizes="100vw"
                  />

                  {/* Warm ink overlay — not blue/slate */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#15120D]/95 via-[#15120D]/78 to-[#15120D]/35" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15120D]/90 via-transparent to-transparent" />

                  {/* Duality motif — thin outlined circles, corner accent only */}
                  <svg
                    className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 opacity-25 hidden sm:block"
                    viewBox="0 0 200 200"
                    aria-hidden
                  >
                    <circle cx="80" cy="95" r="60" fill="none" stroke="#12A9B0" strokeWidth="1.5" />
                    <circle cx="115" cy="115" r="60" fill="none" stroke="#6B4FC7" strokeWidth="1.5" />
                  </svg>

                  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 pb-20 sm:pb-24 w-full">
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          key={`slide-content-${current}`}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={{
                            hidden: { opacity: 0 },
                            visible: {
                              opacity: 1,
                              transition: { staggerChildren: 0.1, delayChildren: 0.05 },
                            },
                            exit: { opacity: 0, transition: { duration: 0.2 } },
                          }}
                          className="max-w-3xl space-y-4 sm:space-y-5 md:space-y-6"
                        >
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: -10 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
                            }}
                          >
                            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-md text-[11px] sm:text-xs md:text-sm text-[#5FD1D8] font-semibold tracking-wide">
                              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#C8102E] animate-pulse shrink-0" />
                              <span className="truncate">{slide.locationTag}</span>
                            </div>
                          </motion.div>

                          <motion.h1
                            variants={{
                              hidden: { opacity: 0, y: 14 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                            }}
                            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.14] break-words"
                          >
                            {slide.title}
                          </motion.h1>

                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 12 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                            }}
                            className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-[#B39CF0] min-h-[2.5rem] sm:min-h-[2.2rem] flex items-center leading-snug"
                          >
                            {slide.typewriter ? (
                              <TypewriterText
                                phrases={[
                                  "Penyelarasan Sasaran Kinerja Pegawai (SKP)",
                                  "Evaluasi Gap Asesmen & Perilaku Kerja",
                                  "Perencanaan Aspirasi Karir & IDP Terpadu",
                                ]}
                                typingSpeed={50}
                                deletingSpeed={25}
                                pauseTime={2400}
                              />
                            ) : (
                              <span>{slide.subtitle}</span>
                            )}
                          </motion.div>

                          <motion.p
                            variants={{
                              hidden: { opacity: 0, y: 12 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                            }}
                            className="text-xs sm:text-base md:text-lg text-[#D8D2C6] leading-relaxed font-normal max-w-2xl"
                          >
                            {slide.description}
                          </motion.p>

                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 8 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
                            }}
                            className="pt-1 sm:pt-2"
                          >
                            <Link
                              href={isLoggedIn ? userHomePath : "/login"}
                              className="inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-full bg-[#C8102E] hover:bg-[#A80D26] text-white text-xs sm:text-sm md:text-base font-bold transition-[transform,background] hover:-translate-y-0.5 cursor-pointer"
                            >
                              <span>
                                {isLoggedIn ? "Buka Dashboard Kinerja" : "Masuk ke Sistem Dialog Kinerja"}
                              </span>
                              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" weight="bold" />
                            </Link>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <div className="hidden sm:flex absolute bottom-6 sm:bottom-8 right-4 sm:right-8 z-20 items-center gap-2 sm:gap-3">
          <button
            onClick={() => api?.scrollPrev()}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-[#C8102E] text-white border border-white/15 flex items-center justify-center transition-colors backdrop-blur-md"
            aria-label="Slide sebelumnya"
          >
            <CaretLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-[#C8102E] text-white border border-white/15 flex items-center justify-center transition-colors backdrop-blur-md"
            aria-label="Slide berikutnya"
          >
            <CaretRightIcon className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
          </button>
        </div>

        <div className="absolute bottom-5 sm:bottom-8 left-4 sm:left-8 z-20 flex items-center gap-2 sm:gap-2.5">
          {Array.from({ length: count || slides.length }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 transition-all duration-400 rounded-full ${
                current === index
                  ? "w-8 sm:w-10 bg-[#C8102E]"
                  : "w-2 sm:w-2.5 bg-white/35 hover:bg-white/60"
              }`}
              aria-label={`Ke slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}