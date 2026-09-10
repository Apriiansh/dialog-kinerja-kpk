import Link from "next/link";
import Image from "next/image";
import { getSession, homePathForRole } from "@/lib/auth/session";
import { AlurBpmnDiagram } from "@/components/alur-bpmn-diagram";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  FileTextIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

const TAHOMA = { fontFamily: "Tahoma, 'Segoe UI', Verdana, sans-serif" };

export const metadata = {
  title: "Alur Proses Bisnis BPMN 2.0 | Dialog Kinerja KPK",
  description:
    "Diagram alur proses bisnis resmi Dialog Kinerja KPK berbasis standar OMG BPMN 2.0 (ISO/IEC 19510).",
};

export default async function AlurPage() {
  const session = await getSession();
  const isLoggedIn = Boolean(session?.id);
  const userHomePath = session?.role ? homePathForRole(session.role) : "/login";

  return (
    <div
      style={TAHOMA}
      className="min-h-screen flex flex-col bg-background dark:bg-[#15120D] text-ink dark:text-[#F2EEE7] transition-colors duration-200 selection:bg-primary-strong selection:text-white"
    >
      {/* Top accent line */}
      <div className="h-1.5 w-full bg-linear-to-r from-[#7A0B1F] via-[#C8102E] to-[#7A0B1F]" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-outline dark:border-white/10 bg-background/95 dark:bg-[#15120D]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon size={14} weight="bold" />
              <span>Kembali</span>
            </Link>
            <span className="h-4 w-px bg-outline dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="relative h-7 w-6 shrink-0">
                <Image
                  src="/images/logo-kpk-badge.png"
                  alt="Logo KPK"
                  fill
                  sizes="28px"
                  className="object-contain"
                />
              </div>
              <span className="text-sm sm:text-base font-bold text-ink dark:text-white truncate">
                Diagram BPMN 2.0 Dialog Kinerja
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={isLoggedIn ? userHomePath : "/login"}
              className="inline-flex items-center h-8.5 px-4 rounded-full bg-primary-strong hover:bg-[#A80D26] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isLoggedIn ? "Dashboard" : "Masuk"}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Title Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-strong/30 bg-primary-soft dark:bg-primary-strong/10 text-primary-strong dark:text-[#FF7A86] text-xs font-bold uppercase tracking-wider">
            <ShieldCheckIcon size={15} weight="fill" />
            <span>Standar Internasional ISO/IEC 19510</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Model Alur Proses Bisnis (BPMN 2.0)
              </h1>
              <p className="text-sm sm:text-base text-ink-muted dark:text-[#C9C2B6] mt-2 max-w-3xl leading-relaxed">
                Pemodelan resmi alur siklus kerja berkala Dialog Kinerja dan
                Reviu Tindak Lanjut Capaian di lingkungan Komisi Pemberantasan
                Korupsi (KPK RI).
              </p>
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-2 text-xs font-mono text-outline-strong shrink-0">
              <span className="px-2.5 py-1 rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-white/3">
                3 Swimlanes
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-white/3">
                2 Fase Alur
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-outline dark:border-white/10 bg-white dark:bg-white/3">
                24 Tahapan
              </span>
            </div>
          </div>
        </div>

        {/* BPMN Interactive Diagram */}
        <section className="space-y-2">
          <AlurBpmnDiagram isEmbedded={false} />
          <p className="text-xs text-ink-muted dark:text-[#A89F91] text-right italic">
            * Klik pada salah satu kotak atau simbol untuk membuka rincian deskripsi,
            peran, status database, dan referensi kode sumber.
          </p>
        </section>

        {/* 2 Fase Penjelasan Mendalam */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          <div className="p-5 rounded-2xl border border-outline dark:border-white/10 bg-white dark:bg-white/3 space-y-2.5">
            <div className="flex items-center gap-2 text-primary-strong">
              <FileTextIcon size={20} weight="bold" />
              <h3 className="font-bold text-sm text-ink dark:text-white">
                Fase 1: Dialog Kinerja
              </h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
              Pengajuan jadwal atau pembuatan dialog, pengisian 5 aspek evaluasi
              (SKP, Gap Asesmen, Perilaku, Karir Pendek &amp; Karir Menengah),
              evaluasi tanggung jawab pembinaan atasan, penandatanganan, dan
              penguncian status dialog menjadi <code>selesai</code>. Jika setelah
              reviu masih terdapat butir yang belum tercapai
              (<code>is_tercapai = false</code>), sistem secara otomatis membuat
              Dialog Lanjutan baru dan mengalirkan kembali ke status draft untuk
              pemantauan berkelanjutan.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-outline dark:border-white/10 bg-white dark:bg-white/3 space-y-2.5">
            <div className="flex items-center gap-2 text-[#12A9B0]">
              <CheckCircleIcon size={20} weight="bold" />
              <h3 className="font-bold text-sm text-ink dark:text-white">
                Fase 2: Reviu Tindak Lanjut
              </h3>
            </div>
            <p className="text-xs text-ink-muted dark:text-[#C9C2B6] leading-relaxed">
              Pegawai meninjau hasil dialog dengan menandai status ketercapaian
              setiap butir evaluasi. Jika terdapat butir yang belum tercapai,
              pegawai melengkapi penyebab, rencana aksi, dan target evaluasi
              berikutnya sebelum disetujui atasan.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline dark:border-white/10 bg-surface-soft dark:bg-[#100D09] py-8 text-center text-xs text-ink-muted dark:text-[#A89F91]">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-ink dark:text-white">
            Portal Dialog Kinerja — Komisi Pemberantasan Korupsi Republik Indonesia
          </p>
          <p>
            BPMN 2.0 (Business Process Model and Notation) Diagram Viewer
          </p>
        </div>
      </footer>
    </div>
  );
}
