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
                <div className="relative w-full min-h-[540px] md:min-h-[620px] lg:min-h-[660px] flex items-center">
                  {/* Background Sunset Photo */}
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    className="object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
                    sizes="100vw"
                  />

                  {/* Cinematic Sunset Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/45" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40" />

                  {/* Content Container with Framer Motion text animation on slide change */}
                  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
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
                                staggerChildren: 0.12,
                                delayChildren: 0.05,
                              },
                            },
                            exit: { opacity: 0, transition: { duration: 0.2 } },
                          }}
                          className="max-w-3xl space-y-6"
                        >
                          {/* Location Tag */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: -12 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.4, ease: "easeOut" },
                              },
                            }}
                          >
                            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-md bg-black/50 border border-white/20 backdrop-blur-md text-xs sm:text-sm text-amber-300 font-semibold tracking-wide">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" />
                              <span>{slide.locationTag}</span>
                            </div>
                          </motion.div>

                          {/* Title */}
                          <motion.h1
                            variants={{
                              hidden: { opacity: 0, y: 16 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.5, ease: "easeOut" },
                              },
                            }}
                            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-md"
                          >
                            {slide.title}
                          </motion.h1>

                          {/* Subtitle / Typewriter */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 14 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.5, ease: "easeOut" },
                              },
                            }}
                            className="text-base sm:text-2xl font-bold text-amber-400 min-h-[2rem]"
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
                              hidden: { opacity: 0, y: 14 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { duration: 0.5, ease: "easeOut" },
                              },
                            }}
                            className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow"
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
                            className="pt-2"
                          >
                            <Link
                              href={isLoggedIn ? userHomePath : "/login"}
                              className="inline-flex items-center gap-3 h-12 px-7 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-700 text-white text-base font-bold shadow-xl shadow-black/40 border border-red-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <span>
                                {isLoggedIn
                                  ? "Buka Dashboard Kinerja"
                                  : "Masuk ke Sistem Dialog Kinerja"}
                              </span>
                              <ArrowRight className="w-5 h-5" weight="bold" />
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
        <div className="hidden sm:flex absolute bottom-8 right-8 z-20 items-center gap-3">
          <button
            onClick={() => api?.scrollPrev()}
            className="w-11 h-11 rounded-xl bg-black/60 hover:bg-red-700 text-white border border-white/20 hover:border-red-500 flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
            aria-label="Slide sebelumnya"
          >
            <CaretLeft className="w-6 h-6" weight="bold" />
          </button>
          <button
            onClick={() => api?.scrollNext()}
            className="w-11 h-11 rounded-xl bg-black/60 hover:bg-red-700 text-white border border-white/20 hover:border-red-500 flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
            aria-label="Slide berikutnya"
          >
            <CaretRight className="w-6 h-6" weight="bold" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-8 z-20 flex items-center gap-2.5">
          {Array.from({ length: count || slides.length }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 transition-all duration-400 rounded-full ${
                current === index
                  ? "w-10 bg-amber-400 shadow-md shadow-amber-500/50"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Ke slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
