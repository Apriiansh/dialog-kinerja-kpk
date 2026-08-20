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

const aspekList = [
  {
    code: "A",
    label: "SKP",
    title: "Sasaran Kinerja Pegawai (SKP)",
    icon: TargetIcon,
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
    summary:
      "Proyeksi kesiapan pegawai untuk jenjang karir lanjutan, rotasi strategis, atau jalur spesialisasi.",
    detail: "Menyelaraskan talenta pegawai dengan peta suksesi dan kebutuhan strategis kelembagaan KPK.",
    badge: "Aspek D.2",
  },
];

const alurSteps = [
  {
    step: "01",
    statusCode: "draft_atasan",
    title: "Draf Awal Atasan",
    role: "Atasan Langsung",
    icon: FileTextIcon,
    description:
      "Atasan menyusun draf indikator tanggung jawab, target kerja, dan arahan pembinaan awal.",
  },
  {
    step: "02",
    statusCode: "menunggu_pegawai",
    title: "Komitmen Pegawai",
    role: "Pegawai Dinilai",
    icon: UserCheckIcon,
    description:
      "Pegawai mempelajari draf, menyatakan komitmen kerja, dan mengajukan aspirasi karir (IDP).",
  },
  {
    step: "03",
    statusCode: "menunggu_atasan",
    title: "Reviu & Dialog Kinerja",
    role: "Atasan & Pegawai",
    icon: ClockCounterClockwiseIcon,
    description:
      "Pembahasan dua arah, klarifikasi capaian, serta kesepakatan akhir bimbingan kerja.",
  },
  {
    step: "04",
    statusCode: "menunggu_validasi",
    title: "Validasi Biro SDM",
    role: "Pengelola Kinerja SDM",
    icon: CheckCircleIcon,
    description:
      "Pemeriksaan kepatuhan administratif, standardisasi format, dan rekapitulasi lembaga.",
  },
  {
    step: "05",
    statusCode: "selesai",
    title: "Pengesahan & Arsip",
    role: "Dokumen Resmi",
    icon: SealCheckIcon,
    description:
      "Penerbitan dokumen sah bertanda tangan elektronik dalam format Word & PDF resmi.",
  },
];

export function LandingSections({
  isLoggedIn,
  userHomePath,
}: LandingSectionsProps) {
  return (
    <>
      {/* SECTION 1: 5 ASPEK EVALUASI DENGAN ABSTRACT BACKGROUND */}
      <section id="aspek" className="relative py-16 sm:py-24 bg-[#0B0F19] text-white overflow-hidden border-b border-white/10">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Red & Amber Radial Glow */}
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 w-[28rem] h-[28rem] bg-amber-500/10 rounded-full blur-3xl" />
          
          {/* Architectural Technical Grid */}
          <div 
            className="absolute inset-0 opacity-[0.035]" 
            style={{
              backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Diagonal Security Mesh Accents */}
          <svg className="absolute right-0 top-0 h-full w-1/3 opacity-[0.04]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" stroke="#fff" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="20" y1="0" x2="100" y2="80" stroke="#fff" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="20" x2="80" y2="100" stroke="#fff" strokeWidth="0.5" strokeDasharray="3 3" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column: Context & Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-5 lg:sticky lg:top-28 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Instrumen Evaluasi
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                  4 Aspek Evaluasi (Aspek A – D)
                </h2>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  Dialog Kinerja bukan sekadar formulir administratif, melainkan instrumen pembinaan dua arah yang mengintegrasikan target kuantitatif, kode etik insan KPK, serta aspirasi pengembangan karir pegawai.
                </p>
              </div>

              {/* Technical Badge */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xs space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>REGULASI KINERJA</span>
                  <span className="text-amber-400">PERBAN KPK RI</span>
                </div>
                <div className="h-px bg-white/10" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Setiap butir evaluasi mencantumkan komitmen pegawai dan tanggung jawab pembinaan atasan secara eksplisit.
                </p>
              </div>

              <div className="pt-2 hidden lg:block">
                <a
                  href="#alur"
                  className="inline-flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors group"
                >
                  <span>Lihat Mekanisme Alur Kerja</span>
                  <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>

            {/* Right Column: 5 Aspects Cards */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              {aspekList.map((aspek, index) => {
                const IconComponent = aspek.icon;
                return (
                  <motion.div
                    key={aspek.code}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.07,
                      ease: "easeOut",
                    }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="group relative p-5 sm:p-6 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/10 hover:border-red-500/40 transition-all duration-200 shadow-sm hover:shadow-[0_0_30px_-10px_rgba(214,26,32,0.25)] flex gap-4 sm:gap-5 items-start"
                  >
                    {/* Aspect Number & Icon */}
                    <div className="relative shrink-0 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-600 to-[#9e1318] text-white flex items-center justify-center shadow-md shadow-red-950/40 group-hover:scale-105 transition-transform duration-200">
                        <IconComponent size={22} weight="duotone" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {aspek.code}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-red-200 transition-colors">
                          {aspek.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          {aspek.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {aspek.summary}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium pt-1 flex items-center gap-1.5">
                        <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
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

      {/* SECTION 2: ALUR TAHAPAN DENGAN ABSTRACT PIPELINE */}
      <section id="alur" className="relative py-16 sm:py-24 bg-[#070A12] text-white overflow-hidden border-b border-white/10">
        {/* Subtle Background Mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[20rem] bg-red-700/10 rounded-full blur-[100px]" />
          <div 
            className="absolute inset-0 opacity-[0.02]" 
            style={{
              backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Siklus & Mekanisme
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Siklus Alur Dialog & Monitoring (2x Setahun)
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Dilaksanakan secara berkala setiap 6 bulan: <strong>Triwulan I</strong> untuk perencanaan target tahun berjalan & evaluasi tahun lalu, serta <strong>Triwulan III</strong> untuk monitoring progres IDP sebelum bergulir kembali ke TW1 berikutnya.
            </p>
          </motion.div>

          {/* 5-Step Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5 relative">
            {alurSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/40 transition-all duration-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Step Tag + Icon */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        STEP {step.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-amber-400 transition-colors">
                        <StepIcon size={18} weight="duotone" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom: Role Label */}
                  <div className="pt-3 mt-4 border-t border-white/10">
                    <span className="text-[11px] font-mono text-slate-400 block truncate">
                      PIC: <span className="text-slate-200 font-semibold">{step.role}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Interactive CTA Banner with Abstract Geometry */}
          <motion.div
            id="tentang"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-red-500/30 bg-gradient-to-r from-[#9e1318] via-[#d61a20] to-[#7f0d11] shadow-2xl shadow-red-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            {/* Background Guilloche / Security Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%">
                <pattern id="cta-mesh" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 30 M 0 0 L 30 30" fill="none" stroke="#ffffff" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#cta-mesh)" />
              </svg>
            </div>

            <div className="relative z-10 space-y-2 max-w-2xl text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider text-red-200 uppercase">
                <ShieldCheckIcon size={16} weight="fill" />
                <span>Portal Resmi Komisi Pemberantasan Korupsi</span>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Mulai Dialog Kinerja Periode Ini
              </h3>
              <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed font-normal">
                Pastikan target kerja, tindak lanjut asesmen kompetensi, dan rencana pengembangan karir Anda tercatat dan tervalidasi secara akuntabel.
              </p>
            </div>

            <div className="relative z-10 w-full md:w-auto shrink-0">
              <Link
                href={isLoggedIn ? userHomePath : "/login"}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-white hover:bg-slate-100 text-[#9e1318] font-bold text-sm shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
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
