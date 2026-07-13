import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white shadow-primary hover:opacity-95",
  secondary: "bg-white text-ink-2 border border-[#d8d3ca] hover:bg-app",
  danger: "bg-desp-fg text-white hover:opacity-95",
  ghost: "bg-transparent text-ink-2 hover:bg-app",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-input font-bold transition-transform active:scale-[.99] disabled:opacity-50 disabled:pointer-events-none",
          "text-[15px] h-12 px-5",
          VARIANTS[variant],
          className,
        )}
        {...props}
      >
        {loading ? "Aguarde…" : children}
      </button>
    );
  },
);
Button.displayName = "Button";
