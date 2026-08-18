export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-auto mt-8 w-full max-w-6xl rounded-lg border border-outline/30 bg-surface-muted/60 px-4 py-3 text-center print:hidden shadow-2xs">
      <div className="flex flex-col items-center justify-between gap-1 text-[11px] text-ink-muted sm:flex-row">
        <span className="font-medium text-ink">
          SETJEN &bull; Biro Sumber Daya Manusia
        </span>
        <span className="text-[10px] text-ink-muted/70">
          &copy; {currentYear} Dialog Kinerja KPK
        </span>
      </div>
    </footer>
  );
}
