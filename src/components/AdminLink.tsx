"use client";

import Link, { useLinkStatus } from "next/link";
import { ArrowRight, Loader2, Lock } from "lucide-react";

// La navegación al panel es dinámica (auth en el servidor) y puede tardar;
// sin señal visual el botón parece muerto. La flecha se convierte en spinner
// mientras la navegación está pendiente (mismo tamaño: sin saltos de layout).
function PendingArrow() {
  const { pending } = useLinkStatus();
  return pending ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00e5a0]" />
  ) : (
    <ArrowRight className="w-3.5 h-3.5" />
  );
}

export function AdminLink() {
  return (
    <Link
      href="/admin/dashboard"
      className="flex items-center gap-1.5 min-h-[44px] px-3.5 -mr-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-[#94a3b8] hover:text-[#e2e8f0] hover:border-white/[0.16] active:bg-white/[0.10] active:scale-[0.97] transition-all"
    >
      <Lock className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Panel Admin</span>
      <span className="sm:hidden">Admin</span>
      <PendingArrow />
    </Link>
  );
}
