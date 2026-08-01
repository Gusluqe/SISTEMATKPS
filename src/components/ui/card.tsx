"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "gradient";
  glow?: "green" | "blue" | "none";
}

export function Card({
  className,
  variant = "default",
  glow = "none",
  ...props
}: CardProps) {
  const variants = {
    default: "bg-[#13233f] border border-white/[0.07]",
    elevated: "bg-[#1c3054] border border-white/[0.09]",
    gradient:
      "bg-gradient-to-br from-[#13233f] to-[#0d1a26] border border-white/[0.07]",
  };

  const glows = {
    green: "shadow-lg shadow-[#00e5a0]/5",
    blue: "shadow-lg shadow-[#3b82f6]/5",
    none: "",
  };

  return (
    <div
      className={cn(
        "rounded-2xl",
        variants[variant],
        glows[glow],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 pt-5 pb-4 border-b border-white/[0.06]", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold text-[#f8fafc]", className)}
      {...props}
    />
  );
}
