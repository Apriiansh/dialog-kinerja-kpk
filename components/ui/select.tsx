import { forwardRef, type SelectHTMLAttributes } from "react";
import { inputClasses } from "./input";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", children, ...props }, ref) {
  return (
    <select ref={ref} className={`${inputClasses} ${className}`} {...props}>
      {children}
    </select>
  );
});