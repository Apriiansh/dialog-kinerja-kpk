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
import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
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
    <div className="w-full relative bg-slate-950 overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 6000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="m-0">
          {slides.map((slide, index) => {
            const isActive = current === index;

            return (
              <CarouselItem key={slide.id} className="p-0 relative w-full">
                <div className="relative w-full min-h-[520px] sm:min-h-[560px] md:min-h-[600px] lg:min-h-[640px] flex items-center">
                  {/* Background Sunset Photo */}
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    className="object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
                    sizes="100vw"
                  />

                  {/* Sunset / Dusk Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-black/30" />

                  {/* Content Container */}
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
                              transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.05,
                              },
                            },
                            exit: { opacity: 0, transition: { duration: 0.2 } },
                          }}
                          className="max-w-3xl space-y-4 sm:space-y-5 md:space-y-6"
                        >
                          {/* Location Tag */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: -10 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.4, ease: "easeOut" },
                              },
                            }}
                          >
                            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-md bg-black/60 border border-white/20 backdrop-blur-md text-[11px] sm:text-xs md:text-sm text-amber-300 font-semibold tracking-wide">
                              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse shadow-xs shadow-red-500 shrink-0" />
                              <span className="truncate">{slide.locationTag}</span>
                            </div>
                          </motion.div>

                          {/* Title */}
                          <motion.h1
                            variants={{
                              hidden: { opacity: 0, y: 14 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.5, ease: "easeOut" },
                              },
                            }}
                            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.18] sm:leading-[1.12] drop-shadow-md break-words"
                          >
                            {slide.title}
                          </motion.h1>

                          {/* Subtitle / Typewriter */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 12 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.5, ease: "easeOut" },
                              },
                            }}
                            className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-amber-400 min-h-[2.5rem] sm:min-h-[2.2rem] flex items-center leading-snug"
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

                          {/* Description */}
                          <motion.p
                            variants={{
                              hidden: { opacity: 0, y: 12 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.5, ease: "easeOut" },
                              },
                            }}
                            className="text-xs sm:text-base md:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow"
                          >
                            {slide.description}
                          </motion.p>

                          {/* CTA Button */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, scale: 0.95 },
                              visible: {
                                opacity: 1,
                                scale: 1,
                                transition: { duration: 0.4, ease: "easeOut" },
                              },
                            }}
                            className="pt-1 sm:pt-2"
                          >
                            <Link
                              href={isLoggedIn ? userHomePath : "/login"}
                              className="inline-flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 rounded-xl bg-[#d61a20] hover:bg-[#a51318] text-white text-xs sm:text-sm md:text-base font-bold shadow-xl shadow-black/40 border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                              <span>
                                {isLoggedIn
                                  ? "Buka Dashboard Kinerja"
                                  : "Masuk ke Sistem Dialog Kinerja"}
                              </span>
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" weight="bold" />
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

        {/* Carousel Navigation Buttons */}
        <div className="hidden sm:flex absolute bottom-6 sm:bottom-8 right-4 sm:right-8 z-20 items-center gap-2 sm:gap-3">
          <button
            onClick={() => api?.scrollPrev()}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black/60 hover:bg-red-700 text-white border border-white/20 hover:border-red-500 flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
            aria-label="Slide sebelumnya"
          >
            <CaretLeft className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black/60 hover:bg-red-700 text-white border border-white/20 hover:border-red-500 flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
            aria-label="Slide berikutnya"
          >
            <CaretRight className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-5 sm:bottom-8 left-4 sm:left-8 z-20 flex items-center gap-2 sm:gap-2.5">
          {Array.from({ length: count || slides.length }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 transition-all duration-400 rounded-full ${
                current === index
                  ? "w-8 sm:w-10 bg-amber-400 shadow-md shadow-amber-500/50"
                  : "w-2 sm:w-2.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Ke slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
