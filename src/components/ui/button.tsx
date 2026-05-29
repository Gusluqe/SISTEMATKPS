"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050509] disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-[#00e5a0] to-[#00c87d] text-[#050509] hover:opacity-90 focus:ring-[#00e5a0] shadow-lg shadow-[#00e5a0]/10",
      secondary:
        "bg-[#1a1a2e] text-[#f8fafc] border border-white/10 hover:border-white/20 hover:bg-[#1e1e35] focus:ring-[#3b82f6]",
      outline:
        "border border-[#00e5a0]/30 text-[#00e5a0] hover:bg-[#00e5a0]/10 focus:ring-[#00e5a0]",
      ghost:
        "text-[#94a3b8] hover:text-[#f8fafc] hover:bg-white/5 focus:ring-[#3b82f6]",
      danger:
        "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 focus:ring-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
