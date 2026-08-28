"use client";

import { DotOutlineIcon } from "@phosphor-icons/react";

/**
 * Human-friendly label for a typing/lock field key.
 * Fallback: returns null so callers can decide whether to show a generic label.
 */
export function fieldLabel(fieldId: string | undefined): string | null {
  if (!fieldId) return null;
  if (fieldId === "deskripsi_pegawai") return "Deskripsi Kinerja (Pegawai)";
  if (fieldId === "deskripsi_atasan") return "Deskripsi Kinerja (Atasan)";
  const tjMatch = fieldId.match(/^tanggung_jawab_(pegawai|atasan)_(.+)$/);
  if (tjMatch) {
    const who = tjMatch[1] === "pegawai" ? "Pegawai" : "Atasan";
    const jenis = tjMatch[2];
    return `Tanggung Jawab ${who} (${jenis})`;
  }
  return null;
}

export function TypingIndicator({
  text,
}: {
  text: string;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
      <DotOutlineIcon size={14} weight="bold" className="animate-pulse" />
      <span className="animate-pulse">{text}</span>
    </span>
  );
}
