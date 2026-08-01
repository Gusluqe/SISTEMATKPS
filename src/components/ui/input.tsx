"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, TextareaHTMLAttributes, useId, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const inputBase =
  "w-full bg-[#1c3054] border rounded-xl text-sm text-[#f8fafc] placeholder:text-[#475569] transition-all duration-200 focus:outline-none focus:ring-1";

const inputNormal = "border-white/10 focus:border-[#00e5a0]/50 focus:ring-[#00e5a0]/20";
const inputError = "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(inputBase, error ? inputError : inputNormal, "px-3.5 py-2.5 h-10", className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400 mt-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(inputBase, error ? inputError : inputNormal, "px-3.5 py-2.5 resize-none", className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400 mt-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id: externalId, children, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              inputBase,
              error ? inputError : inputNormal,
              "px-3.5 py-2.5 h-10 pr-9 cursor-pointer appearance-none",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
        </div>
        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400 mt-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Input, Textarea, Select };
