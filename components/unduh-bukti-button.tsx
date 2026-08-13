"use client";

import { useCallback, useEffect, useRef } from "react";
import { DownloadSimple } from "@phosphor-icons/react";

function imagesComplete() {
  return Array.from(document.images).every((img) => img.complete);
}

export function UnduhBuktiButton({
  autoPrint = false,
  label = "Unduh Bukti",
}: {
  autoPrint?: boolean;
  label?: string;
}) {
  const fired = useRef(false);

  const printWhenReady = useCallback(() => {
    let tries = 0;
    const check = () => {
      if (
        tries < 50 &&
        (document.readyState !== "complete" || !imagesComplete())
      ) {
        tries += 1;
        window.setTimeout(check, 100);
        return;
      }
      window.print();
    };
    check();
  }, []);

  useEffect(() => {
    if (!autoPrint || fired.current) return;
    fired.current = true;
    printWhenReady();
  }, [autoPrint, printWhenReady]);

  return (
    <button
      type="button"
      onClick={printWhenReady}
      className="inline-flex h-8 items-center gap-1 rounded-md border border-outline bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted print:hidden"
    >
      <DownloadSimple size={12} weight="bold" />
      {label}
    </button>
  );
}
