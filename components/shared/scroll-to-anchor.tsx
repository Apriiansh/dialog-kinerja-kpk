"use client";

import { useEffect } from "react";

export function ScrollToAnchor() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    if (!id) return;

    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
