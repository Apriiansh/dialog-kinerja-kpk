import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

const VARIANTS = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-strong",
  secondary:
    "border border-outline-strong text-ink hover:bg-surface-muted",
  outline:
    "border border-outline text-ink-muted hover:border-primary hover:text-primary",
  danger: "bg-error text-white hover:opacity-90",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
} as const;

const SIZES = {
  sm: "h-9 px-3 text-xs gap-1.5 rounded-md",
  md: "h-11 px-5 text-sm gap-2 rounded-md",
} as const;

const SPINNER_TONE = {
  primary: "border-on-primary/40 border-t-on-primary",
  secondary: "border-ink-muted/40 border-t-ink-muted",
  outline: "border-ink-muted/40 border-t-ink-muted",
  danger: "border-white/40 border-t-white",
  ghost: "border-ink-muted/40 border-t-ink-muted",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leadingIcon,
      className = "",
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        {...props}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      >
        {loading ? (
          <span
            aria-hidden
            className={`h-4 w-4 animate-spin rounded-full border-2 ${SPINNER_TONE[variant]}`}
          />
        ) : (
          leadingIcon
        )}
        {children}
      </button>
    );
  },
);