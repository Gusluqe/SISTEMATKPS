"use client";

import { Bell, Plus, Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/lib/store/sidebar";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <header className="h-14 lg:h-16 bg-[#0e1d38]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-20">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggle}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-[#64748b] hover:text-[#94a3b8] transition-colors flex-shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm lg:text-base font-semibold text-[#f8fafc] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[#475569] mt-0.5 truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#00e5a0] to-[#00c87d] text-[#081428] px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nuevo Ticket</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>

        <button
          className="relative w-8 h-8 rounded-xl bg-[#1c3054] border border-white/10 flex items-center justify-center text-[#64748b] hover:text-[#94a3b8] transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#00e5a0]" />
        </button>

        <button
          onClick={signOut}
          className="w-8 h-8 rounded-xl bg-[#1c3054] border border-white/10 flex items-center justify-center text-[#64748b] hover:text-red-400 transition-colors"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
