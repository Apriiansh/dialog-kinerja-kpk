"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BriefcaseIcon,
  BuildingsIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const IMAGES = [
  "/images/n/gedung-1.jpg",
  "/images/n/gedung-2.jpg",
  "/images/n/gedung-3.jpg",
];

const SLIDE_INTERVAL = 3000;

export type GreetingCardUser = {
  role?: string;
  npp?: string | null;
  jabatan?: string | null;
  unitKerja?: string | null;
};

export function GreetingCard({
  greeting,
  subtitle,
  user,
}: {
  greeting: string;
  subtitle: string;
  user?: GreetingCardUser;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || IMAGES.length <= 1) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % IMAGES.length),
      SLIDE_INTERVAL
    );
    return () => clearInterval(id);
  }, [paused]);

  const hasUserInfo = Boolean(
    user && (user.role || user.npp || user.jabatan || user.unitKerja)
  );

  return (
    <header
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/70 bg-white/55 shadow-ambient backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between p-6 md:p-7"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-52 w-52 rounded-full bg-primary/8 blur-3xl"
      />

      <div className="relative flex min-w-0 flex-col gap-1">
        <h1 className="text-[26px] font-semibold leading-9 tracking-[-0.01em] text-ink">
          {greeting}
        </h1>
        <p className="text-sm leading-5 text-ink-muted">{subtitle}</p>

        {hasUserInfo && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {user?.npp && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-outline">
                <IdentificationCardIcon
                  size={12}
                  weight="bold"
                  className="text-primary-strong"
                />
                NPP {user.npp}
              </span>
            )}
            {user?.jabatan && (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-outline">
                <BriefcaseIcon
                  size={12}
                  weight="bold"
                  className="shrink-0 text-primary-strong"
                />
                <span className="truncate">{user.jabatan}</span>
              </span>
            )}
            {user?.unitKerja && (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-ink ring-1 ring-outline">
                <BuildingsIcon
                  size={12}
                  weight="bold"
                  className="shrink-0 text-primary-strong"
                />
                <span className="truncate">{user.unitKerja}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Galeri gedung KPK"
        className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl shadow-ambient ring-1 ring-white/60 sm:w-64 md:h-32 md:w-80"
      >
        {IMAGES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            priority={i === 0}
            aria-hidden={i !== active}
            className={cn(
              "object-fit transition-opacity duration-700 ease-out",
              i === active ? "opacity-100" : "opacity-0"
            )}
          />
        ))}

        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-tr from-primary-strong/75 via-primary/30 to-[#DB1514]/40 mix-blend-multiply"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-primary-strong/50 via-transparent to-transparent"
        />

        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {IMAGES.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Tampilkan gambar ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                i === active
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
