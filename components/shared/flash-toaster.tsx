"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/toast";
import type { FlashType } from "@/lib/utils/flash";

export function FlashToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const raw = searchParams.get("flash");

  useEffect(() => {
    if (!raw) return;
    let data: { type?: FlashType; title: string; description?: string };
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    toast.add({
      type: data.type ?? "info",
      title: data.title,
      description: data.description,
    });
    const url = new URL(window.location.href);
    url.searchParams.delete("flash");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [raw, router]);

  return null;
}
