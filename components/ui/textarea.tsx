import { forwardRef, type TextareaHTMLAttributes } from "react";

export const textareaClasses =
  "w-full rounded-md border border-outline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea ref={ref} className={`${textareaClasses} ${className}`} {...props} />
  );
});