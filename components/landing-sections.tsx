"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TargetIcon,
  ChartLineUpIcon,
  ShieldCheckIcon,
  CompassIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
  UserCheckIcon,
  SealCheckIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";

interface LandingSectionsProps {
  isLoggedIn: boolean;
  userHomePath: string;
}

// Duality color coding: red = institutional core (SKP), cyan/violet alternate
// for the rest — never more than two accent hues touching at once.
const aspekList = [
  {
    code: "A",
    label: "SKP",
    title: "Sasaran Kinerja Pegawai (SKP)",
    icon: TargetIcon,
    accent: "#C8102E",
    summary:
      "Penetapan dan evaluasi target kinerja terukur kuantitatif maupun kualitatif sesuai penugasan unit kerja.",
    detail: "Mencakup capaian indikator kinerja utama, target output, mutu, dan waktu penyelesaian tugas.",
    badge: "Aspek A",
  },
  {
    code: "B",
    label: "GAP ASESMEN",
    title: "Evaluasi Gap Asesmen",
    icon: ChartLineUpIcon,
    accent: "#12A9B0",
    summary:
      "Tindak lanjut objektif hasil asesmen kompetensi untuk memetakan kesenjangan kemampuan pegawai.",
    detail: "Fokus pada penguatan kompetensi teknis, manajerial, dan sosio-kultural yang perlu ditingkatkan.",
    badge: "Aspek B",
  },
  {
    code: "C",
    label: "PERILAKU",
    title: "Evaluasi Perilaku Kerja",
    icon: ShieldCheckIcon,
    accent: "#6B4FC7",
    summary:
      "Pengukuran internalisasi nilai-nilai dasar Core Values ASN BerAKHLAK dan Kode Etik Insan KPK.",
    detail: "Menilai integritas, profesionalisme, kepemimpinan, orientasi pelayanan, serta kerja sama tim.",
    badge: "Aspek C",
  },
  {
    code: "D.1",
    label: "KARIR PENDEK",
    title: "Aspirasi Karir Jangka Pendek (1–2 Thn)",
    icon: CompassIcon,
    accent: "#12A9B0",
    summary:
      "Perumusan rencana penugasan taktis, pelatihan teknis, sertifikasi, serta perluasan lingkup kerja.",
    detail: "Akselerasi kesiapan tugas dalam 12–24 bulan ke depan dengan bimbingan atasan langsung.",
    badge: "Aspek D.1",
  },
  {
    code: "D.2",
    label: "KARIR MENENGAH",
    title: "Aspirasi Karir Jangka Menengah (3–5 Thn)",
    icon: RocketLaunchIcon,
    accent: "#6B4FC7",
    summary:
      "Proyeksi kesiapan pegawai untuk jenjang karir lanjutan, rotasi strategis, atau jalur spesialisasi.",
    detail: "Menyelaraskan talenta pegawai dengan peta suksesi dan kebutuhan strategis kelembagaan KPK.",
    badge: "Aspek D.2",
  },
];

const alurSteps = [
  {
    step: "01",
    title: "Atasan Menyusun Dialog",
    role: "Atasan Langsung",
    icon: FileTextIcon,
    description:
      "Memilih pegawai, menyusun indikator tanggung jawab, target kerja, dan arahan pembinaan. Dapat mengisi bersamaan saat pegawai bekerja.",
  },
  {
    step: "02",
    title: "Pegawai Mengisi & Submit",
    role: "Pegawai Dinilai",
    icon: UserCheckIcon,
    description:
      "Melengkapi 4 aspek evaluasi (SKP, Gap Asesmen, Perilaku, & Karir) dengan item-item evaluasi, lalu mengirim ke atasan.",
  },
  {
    step: "03",
    title: "Reviu, TTD & Validasi",
    role: "Atasan & Pegawai",
    icon: ClockCounterClockwiseIcon,
    description:
      "Atasan menilai, menandatangani, dan menyetujui. Pegawai memvalidasi serta menandatangani. Dialog terkunci dan siap di-export.",
  },
  {
    step: "04",
    title: "Reviu Tindak Lanjut",
    role: "Pegawai & Atasan",
    icon: CheckCircleIcon,
    description:
      "Pegawai mencatat capaian, rencana tindak lanjut, dan jadwal evaluasi berikutnya. Atasan menyetujui reviu.",
  },
  {
    step: "05",
    title: "Evaluasi Lanjutan (TW1/TW3)",
    role: "Siklus 6-Bulan",
    icon: SealCheckIcon,
    description:
      "Evaluasi yang belum tercapai otomatis diteruskan ke dialog periode berikutnya. Siklus berulang: TW1 Perencanaan & Evaluasi, TW3 Monitoring Progres.",
  },
];

export function LandingSections({ isLoggedIn, userHomePath }: LandingSectionsProps) {
  return (
    <>
      {/* SECTION 1: ASPEK EVALUASI */}
      <section
        id="aspek"
        className="relative py-16 sm:py-24 bg-background dark:bg-[#15120D] text-ink dark:text-[#F2EEE7] overflow-hidden border-b border-outline dark:border-white/10"
      >
        {/* Signature motif — thin overlapping rings, not a blur blob */}
        <svg
          className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 opacity-[0.07] hidden lg:block"
          viewBox="0 0 300 300"
          aria-hidden
        >
          <circle cx="120" cy="140" r="90" fill="none" stroke="#12A9B0" strokeWidth="1.5" />
          <circle cx="170" cy="170" r="90" fill="none" stroke="#6B4FC7" strokeWidth="1.5" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-5 lg:sticky lg:top-28 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#12A9B0]/40 bg-[#12A9B0]/10 text-[#0F8A90] dark:text-[#5FD1D8] text-xs font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-[#12A9B0]" />
                Instrumen Evaluasi
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                  4 Aspek Evaluasi (Aspek A – D)
                </h2>
                <p className="text-sm sm:text-base text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
                  Dialog Kinerja bukan sekadar formulir administratif, melainkan
                  instrumen pembinaan dua arah yang mengintegrasikan target
                  kuantitatif, kode etik insan KPK, serta aspirasi pengembangan
                  karir pegawai.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-outline dark:border-white/10 bg-white/60 dark:bg-white/3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-outline-strong">
                  <span>REGULASI KINERJA</span>
                  <span className="text-primary-strong dark:text-[#FF7A86]">PERBAN KPK RI</span>
                </div>
                <div className="h-px bg-muted dark:bg-white/10" />
                <p className="text-xs text-ink dark:text-[#C9C2B6] leading-relaxed">
                  Setiap butir evaluasi mencantumkan komitmen pegawai dan
                  tanggung jawab pembinaan atasan secara eksplisit.
                </p>
              </div>

              <div className="pt-2 hidden lg:block">
                <a
                  href="#alur"
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary-strong dark:text-[#FF7A86] hover:underline group"
                >
                  <span>Lihat Mekanisme Alur Kerja</span>
                  <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>

            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              {aspekList.map((aspek, index) => {
                const IconComponent = aspek.icon;
                return (
                  <motion.div
                    key={aspek.code}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className="group relative p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/3 border border-outline dark:border-white/10 hover:border-accent transition-colors duration-150 flex gap-4 sm:gap-5 items-start"
                    style={{ ["--accent" as string]: aspek.accent }}
                  >
                    <div className="relative shrink-0 flex flex-col items-center gap-2">
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center"
                        style={{ backgroundColor: aspek.accent }}
                      >
                        <IconComponent size={22} weight="bold" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-outline-strong">
                        {aspek.code}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-bold">{aspek.title}</h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-outline dark:border-white/15 text-outline-strong">
                          {aspek.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-outline-strong dark:text-[#C9C2B6] leading-relaxed">
                        {aspek.summary}
                      </p>
                      <p className="text-[11px] sm:text-xs text-outline-strong font-medium pt-1 flex items-center gap-1.5">
                        <span
                          className="inline-block h-1 w-1 rounded-full"
                          style={{ backgroundColor: aspek.accent }}
                        />
                        {aspek.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ALUR & CTA */}
      <section
        id="alur"
        className="relative py-16 sm:py-24 bg-surface-soft dark:bg-[#100D09] text-ink dark:text-[#F2EEE7] overflow-hidden border-b border-outline dark:border-white/10"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#6B4FC7]/40 bg-[#6B4FC7]/10 text-[#5A3FA6] dark:text-[#B39CF0] text-xs font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6B4FC7]" />
              Siklus &amp; Mekanisme
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Siklus Alur Dialog &amp; Monitoring (2x Setahun)
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-[#C9C2B6]">
              Dilaksanakan secara berkala setiap 6 bulan: <strong>Triwulan I</strong>{" "}
              untuk perencanaan target tahun berjalan &amp; evaluasi tahun lalu,
              serta <strong>Triwulan III</strong> untuk monitoring progres IDP
              sebelum bergulir kembali ke TW1 berikutnya.
            </p>
          </motion.div>

          {/* Arc divider — signature element instead of a straight rule */}
          <svg viewBox="0 0 1200 32" preserveAspectRatio="none" className="w-full h-6" aria-hidden>
            <path
              d="M0,16 Q300,0 600,16 T1200,16"
              fill="none"
              stroke="#DCD5C9"
              strokeWidth="1.5"
              className="dark:stroke-white/10"
            />
          </svg>

          <div className="relative pl-8 sm:pl-10 space-y-0">
            {/* Vertical connector line */}
            <div className="absolute left-3 sm:left-4 top-3 bottom-3 w-px bg-outline dark:bg-white/10" />

            {alurSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
                  className="relative flex gap-4 sm:gap-5 pb-8 last:pb-0"
                >
                  {/* Step indicator */}
                  <div className="absolute -left-8 sm:-left-10 z-10 flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary-strong bg-background text-[10px] sm:text-xs font-bold text-primary-strong">
                    {step.step}
                  </div>

                  {/* Content card */}
                  <div className="group flex-1 p-4 sm:p-5 rounded-xl bg-white dark:bg-white/3 border border-outline dark:border-white/10 hover:border-primary-strong/40 transition-colors duration-150">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary-soft dark:bg-[#FF7A86]/10 flex items-center justify-center text-primary-strong dark:text-[#FF7A86]">
                        <StepIcon size={18} weight="bold" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-bold">{step.title}</h3>
                          <span className="text-[10px] sm:text-[11px] font-mono text-outline-strong shrink-0">
                            PIC: {step.role}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Siklus Berkelanjutan */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            <div className="lg:col-span-1 p-5 rounded-xl bg-white dark:bg-white/3 border border-outline dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-soft dark:bg-[#FF7A86]/10 flex items-center justify-center text-primary-strong dark:text-[#FF7A86]">
                  <ClockCounterClockwiseIcon size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-bold">Siklus 6-Bulan</h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
                Dialog Kinerja dilaksanakan dua kali setahun: <strong>Triwulan I</strong> untuk perencanaan &amp; evaluasi, <strong>Triwulan III</strong> untuk monitoring progres.
              </p>
            </div>

            <div className="lg:col-span-1 p-5 rounded-xl bg-white dark:bg-white/3 border border-outline dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#12A9B0]/10 flex items-center justify-center text-[#0F8A90] dark:text-[#5FD1D8]">
                  <ArrowRightIcon size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-bold">Carry-Over Otomatis</h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
                Butir target yang belum tercapai otomatis diteruskan ke dialog lanjutan periode berikutnya. Pencapaian tercatat dan dilacak secara berkelanjutan.
              </p>
            </div>

            <div className="lg:col-span-1 p-5 rounded-xl bg-white dark:bg-white/3 border border-outline dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#6B4FC7]/10 flex items-center justify-center text-[#5A3FA6] dark:text-[#B39CF0]">
                  <CheckCircleIcon size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-bold">Reviu Tindak Lanjut</h3>
              </div>
              <p className="text-xs text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
                Setelah dialog selesai, pegawai membuat reviu: mencatat capaian, menjelaskan kendala, dan merencanakan tindak lanjut untuk periode berikutnya.
              </p>
            </div>
          </motion.div>

          {/* CTA banner — solid institutional red, ring motif instead of crosshatch */}
          <motion.div
            id="tentang"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-primary-strong flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <svg
              className="pointer-events-none absolute -bottom-14 -right-10 h-64 w-64 opacity-20"
              viewBox="0 0 260 260"
              aria-hidden
            >
              <circle cx="100" cy="120" r="80" fill="none" stroke="#5FD1D8" strokeWidth="1.5" />
              <circle cx="140" cy="150" r="80" fill="none" stroke="#B39CF0" strokeWidth="1.5" />
            </svg>

            <div className="relative z-10 space-y-2 max-w-2xl text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider text-white/80 uppercase">
                <ShieldCheckIcon size={16} weight="fill" />
                <span>Portal Resmi Komisi Pemberantasan Korupsi</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                Mulai Dialog Kinerja Periode Ini
              </h3>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-normal">
                Pastikan target kerja, tindak lanjut asesmen kompetensi, dan
                rencana pengembangan karir Anda tercatat dan tervalidasi secara
                akuntabel.
              </p>
            </div>

            <div className="relative z-10 w-full md:w-auto shrink-0">
              <Link
                href={isLoggedIn ? userHomePath : "/login"}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white hover:bg-surface-muted text-primary-strong font-bold text-sm transition-[transform] hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{isLoggedIn ? "Buka Dashboard Saya" : "Masuk ke Sistem"}</span>
                <ArrowRightIcon size={16} weight="bold" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}