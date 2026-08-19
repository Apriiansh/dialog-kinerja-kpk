"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface LandingSectionsProps {
  isLoggedIn: boolean;
  userHomePath: string;
}

const aspekList = [
  {
    code: "A",
    title: "Evaluasi Kinerja (SKP)",
    summary:
      "Penilaian capaian kinerja kuantitatif dan kualitatif berdasarkan sasaran kerja pegawai yang telah ditetapkan pada awal periode.",
    detail: "Mencakup penugasan utama serta output kerja terukur individu.",
  },
  {
    code: "B",
    title: "Evaluasi Gap Asesmen",
    summary:
      "Tindak lanjut atas hasil asesmen kompetensi untuk mengidentifikasi kesenjangan keterampilan dan menyusun langkah perbaikan nyata.",
    detail: "Fokus pada penguatan kompetensi teknis dan manajerial.",
  },
  {
    code: "C",
    title: "Evaluasi Perilaku Kerja",
    summary:
      "Evaluasi penerapan nilai-nilai dasar, etika kerja, integritas, dan profesionalisme dalam pelaksanaan tugas sehari-hari.",
    detail: "Membangun budaya kerja akuntabel dan berintegritas tinggi.",
  },
  {
    code: "D",
    title: "Aspirasi Karir & IDP",
    summary:
      "Perumusan rencana pengembangan karir jangka pendek (1–2 tahun) dan jangka menengah (3–5 tahun) terintegrasi dengan rencana pengembangan individu.",
    detail: "Menyelaraskan aspirasi pegawai dengan kebutuhan strategis KPK.",
  },
];

const alurSteps = [
  {
    step: "01",
    title: "Draft Atasan",
    role: "Atasan Langsung",
    description:
      "Atasan menyusun draf indikator tanggung jawab awal pada 4 aspek evaluasi kinerja.",
  },
  {
    step: "02",
    title: "Tanggapan Pegawai",
    role: "Pegawai",
    description:
      "Pegawai meninjau draf, memberikan komitmen kerja, dan mengajukan aspirasi pengembangan karir.",
  },
  {
    step: "03",
    title: "Reviu Bersama",
    role: "Atasan & Pegawai",
    description:
      "Konfirmasi akhir kesepakatan target kerja dan tanggung jawab pembinaan secara dua arah.",
  },
  {
    step: "04",
    title: "Validasi SDM",
    role: "Biro SDM / Admin",
    description:
      "Verifikasi kepatuhan administratif dan standarisasi dokumen kinerja di tingkat lembaga.",
  },
  {
    step: "05",
    title: "Dokumen Sah",
    role: "Arsip Resmi",
    description:
      "Penandatanganan digital tersertifikasi serta penerbitan formulir sah dalam format Word dan PDF.",
  },
];

export function LandingSections({
  isLoggedIn,
  userHomePath,
}: LandingSectionsProps) {
  return (
    <>
      {/* SECTION 1: 4 ASPEK EVALUASI (RESPONSIVE EDITORIAL STYLE) */}
      <section className="py-14 sm:py-18 md:py-24 bg-slate-50 dark:bg-[#0A0F1D] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Left Column: Context & Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-5 space-y-4 sm:space-y-6"
            >
              <div className="space-y-2 sm:space-y-3">
                <span className="inline-block text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                  Ruang Lingkup Evaluasi
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  4 Aspek Utama dalam Dialog Kinerja
                </h2>
              </div>

              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Dialog Kinerja merupakan forum komunikasi formal berkala antara
                atasan langsung dan pegawai. Instrumen ini dirancang menyeluruh
                untuk memastikan target organisasi tercapai sekaligus mendukung
                pertumbuhan profesional pegawai.
              </p>

              <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 sm:space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Prinsip Komitmen Dua Arah
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Setiap aspek memuat uraian tanggung jawab atasan dalam membina
                  dan komitmen pegawai dalam mencapai hasil kerja terbaik.
                </p>
              </div>
            </motion.div>

            {/* Right Column: 4 Aspects Cards */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              {aspekList.map((aspek, index) => (
                <motion.div
                  key={aspek.code}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.08,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex gap-3.5 sm:gap-5 items-start transition-shadow hover:shadow-md"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    {aspek.code}
                  </div>
                  <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 truncate sm:whitespace-normal">
                      {aspek.title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {aspek.summary}
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium pt-0.5">
                      • {aspek.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ALUR TAHAPAN (RESPONSIVE GRID FOR TABLET & MOBILE) */}
      <section className="py-14 sm:py-18 md:py-24 bg-white dark:bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 md:space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl space-y-2 sm:space-y-3"
          >
            <span className="inline-block text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              Mekanisme Kerja
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Tahapan Alur Persetujuan Dokumen
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-normal">
              Proses pengisian dan pengesahan dialog kinerja berlangsung secara
              berjenjang guna menjamin kepatuhan administrasi dan validitas
              kesepakatan.
            </p>
          </motion.div>

          {/* Responsive Steps Grid (1 col mobile, 2 col sm, 3 col md, 5 col xl) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {alurSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-xs space-y-2.5 sm:space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider">
                      TAHAP {step.step}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="pt-2.5 sm:pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Pelaksana: {step.role}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Access Banner CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="p-6 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6"
          >
            <div className="space-y-1 sm:space-y-1.5 text-left max-w-xl">
              <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                Akses Layanan Dialog Kinerja
              </h4>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 font-normal">
                Gunakan akun NPP dan kata sandi internal Anda untuk memulai
                pengisian atau verifikasi dialog kinerja periode ini.
              </p>
            </div>
            <Link
              href={isLoggedIn ? userHomePath : "/login"}
              className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm md:text-base font-bold shadow-md shadow-red-950/20 transition-all hover:scale-[1.02] text-center"
            >
              <span>{isLoggedIn ? "Buka Dashboard" : "Masuk ke Sistem"}</span>
              <span>→</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
