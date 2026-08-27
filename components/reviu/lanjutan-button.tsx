"use client";

import {
  InitiateDialogButton,
  type InitiateDialogButtonProps,
} from "@/components/dialog/initiate-button";

export function EvaluasiLanjutanButton({
  parentDialogId,
  parentPeriodeLabel,
  label = "Ajukan Dialog Lanjutan",
  variant = "outline",
  size = "sm",
  className,
}: {
  reviuId?: number;
  parentDialogId?: number;
  parentPeriodeLabel?: string;
  label?: string;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  className?: string;
} & Partial<InitiateDialogButtonProps>) {
  return (
    <InitiateDialogButton
      parentDialogId={parentDialogId}
      parentPeriodeLabel={parentPeriodeLabel}
      label={label}
      variant={variant}
      size={size}
      className={className}
    />
  );
}
