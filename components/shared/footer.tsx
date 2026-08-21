export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-auto mt-10 w-full max-w-6xl print:hidden">
      <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-outline/40 bg-surface/80 px-5 py-4 text-[11px] text-ink-muted shadow-ambient backdrop-blur-sm sm:flex-row">
        <span className="font-semibold tracking-tight text-ink">
          SETJEN <span className="text-primary/60">&bull;</span> Biro Sumber Daya Manusia
        </span>
        <span className="flex items-center gap-1.5 text-ink-muted/70">
          &copy; {currentYear} Dialog Kinerja KPK
        </span>
      </div>
    </footer>
  );
}
