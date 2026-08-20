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
    title: "Draf Awal Atasan",
    role: "Atasan Langsung",
    icon: FileTextIcon,
    description:
      "Atasan menyusun draf indikator tanggung jawab, target kerja, dan arahan pembinaan awal.",
  },
  {
    step: "02",
    title: "Komitmen Pegawai",
    role: "Pegawai Dinilai",
    icon: UserCheckIcon,
    description:
      "Pegawai mempelajari draf, menyatakan komitmen kerja, dan mengajukan aspirasi karir (IDP).",
  },
  {
    step: "03",
    title: "Reviu & Dialog Kinerja",
    role: "Atasan & Pegawai",
    icon: ClockCounterClockwiseIcon,
    description:
      "Pembahasan dua arah, klarifikasi capaian, serta kesepakatan akhir bimbingan kerja.",
  },
  {
    step: "04",
    title: "Validasi Biro SDM",
    role: "Pengelola Kinerja SDM",
    icon: CheckCircleIcon,
    description:
      "Pemeriksaan kepatuhan administratif, standardisasi format, dan rekapitulasi lembaga.",
  },
  {
    step: "05",
    title: "Pengesahan & Arsip",
    role: "Dokumen Resmi",
    icon: SealCheckIcon,
    description:
      "Penerbitan dokumen sah bertanda tangan elektronik dalam format Word & PDF resmi.",
  },
];

export function LandingSections({ isLoggedIn, userHomePath }: LandingSectionsProps) {
  return (
    <>
      {/* SECTION 1: ASPEK EVALUASI */}
      <section
        id="aspek"
        className="relative py-16 sm:py-24 bg-[#F6F3EE] dark:bg-[#15120D] text-[#1B1712] dark:text-[#F2EEE7] overflow-hidden border-b border-[#DCD5C9] dark:border-white/10"
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
                <p className="text-sm sm:text-base text-[#5A544A] dark:text-[#C9C2B6] leading-relaxed">
                  Dialog Kinerja bukan sekadar formulir administratif, melainkan
                  instrumen pembinaan dua arah yang mengintegrasikan target
                  kuantitatif, kode etik insan KPK, serta aspirasi pengembangan
                  karir pegawai.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#DCD5C9] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#8C8478]">
                  <span>REGULASI KINERJA</span>
                  <span className="text-[#C8102E] dark:text-[#FF7A86]">PERBAN KPK RI</span>
                </div>
                <div className="h-px bg-[#DCD5C9] dark:bg-white/10" />
                <p className="text-xs text-[#5A544A] dark:text-[#C9C2B6] leading-relaxed">
                  Setiap butir evaluasi mencantumkan komitmen pegawai dan
                  tanggung jawab pembinaan atasan secara eksplisit.
                </p>
              </div>

              <div className="pt-2 hidden lg:block">
                <a
                  href="#alur"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#C8102E] dark:text-[#FF7A86] hover:underline group"
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
                    className="group relative p-5 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#DCD5C9] dark:border-white/10 hover:border-[color:var(--accent)] transition-colors duration-150 flex gap-4 sm:gap-5 items-start"
                    style={{ ["--accent" as string]: aspek.accent }}
                  >
                    <div className="relative shrink-0 flex flex-col items-center gap-2">
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-white flex items-center justify-center"
                        style={{ backgroundColor: aspek.accent }}
                      >
                        <IconComponent size={22} weight="bold" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8C8478]">
                        {aspek.code}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-bold">{aspek.title}</h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-[#DCD5C9] dark:border-white/15 text-[#8C8478]">
                          {aspek.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#5A544A] dark:text-[#C9C2B6] leading-relaxed">
                        {aspek.summary}
                      </p>
                      <p className="text-[11px] sm:text-xs text-[#8C8478] font-medium pt-1 flex items-center gap-1.5">
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
        className="relative py-16 sm:py-24 bg-[#EFEAE1] dark:bg-[#100D09] text-[#1B1712] dark:text-[#F2EEE7] overflow-hidden border-b border-[#DCD5C9] dark:border-white/10"
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
            <p className="text-sm sm:text-base text-[#5A544A] dark:text-[#C9C2B6]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">
            {alurSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className="group relative p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#DCD5C9] dark:border-white/10 hover:border-[#C8102E]/50 transition-colors duration-150 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold tracking-widest text-[#C8102E] dark:text-[#FF7A86] border border-[#C8102E]/30 px-2 py-0.5 rounded-full">
                        {step.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#F6F3EE] dark:bg-white/5 flex items-center justify-center text-[#5A544A] dark:text-[#C9C2B6] group-hover:text-[#C8102E] dark:group-hover:text-[#FF7A86] transition-colors">
                        <StepIcon size={18} weight="bold" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold">{step.title}</h3>

                    <p className="text-xs text-[#5A544A] dark:text-[#C9C2B6] leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-[#DCD5C9] dark:border-white/10">
                    <span className="text-[11px] font-mono text-[#8C8478] block truncate">
                      PIC: <span className="font-semibold text-[#5A544A] dark:text-[#C9C2B6]">{step.role}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA banner — solid institutional red, ring motif instead of crosshatch */}
          <motion.div
            id="tentang"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden p-6 sm:p-10 rounded-3xl bg-[#C8102E] flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
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
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white hover:bg-[#F6F3EE] text-[#C8102E] font-bold text-sm transition-[transform] hover:-translate-y-0.5 cursor-pointer"
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