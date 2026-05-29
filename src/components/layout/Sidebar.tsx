"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/store/sidebar";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Ticket,
  Users,
  X,
  ExternalLink,
  LogOut,
} from "lucide-react";

const allNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket, adminOnly: false },
  { href: "/admin/technicians", label: "Técnicos", icon: Users, adminOnly: true },
];

function SidebarContent({
  onNavigate,
  role,
  userName,
  userEmail,
}: {
  onNavigate?: () => void;
  role: string;
  userName: string;
  userEmail: string;
}) {
  const navItems = role === "technician" ? allNavItems.filter((i) => !i.adminOnly) : allNavItems;
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Proteger Salud"
            width={32}
            height={32}
            className="rounded-xl flex-shrink-0 object-contain"
          />
          <div>
            <p className="text-[11px] font-bold text-[#f8fafc] uppercase tracking-[0.12em] leading-none">
              Proteger Salud
            </p>
            <p className="text-[10px] text-[#475569] leading-none mt-1">Panel de soporte</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5" aria-label="Navegación principal">
        <p className="px-3 mb-2 text-[10px] font-semibold text-[#2d3748] uppercase tracking-widest">
          Menú
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                active
                  ? "bg-[#00e5a0]/8 text-[#00e5a0] font-semibold border border-[#00e5a0]/12"
                  : "text-[#64748b] font-medium hover:text-[#94a3b8] hover:bg-white/[0.03]"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#00e5a0]" : "text-[#475569]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:text-[#64748b] hover:bg-white/[0.03] transition-all duration-150"
          onClick={onNavigate}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          <span>Ver formulario público</span>
        </Link>

        {/* User info + logout */}
        <div className="mx-1 mt-1 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00e5a0] to-[#2563eb] flex items-center justify-center text-[11px] font-bold text-[#050509] flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#94a3b8] truncate">{userName}</p>
              <p className="text-[10px] text-[#334155] truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#334155] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ role, userName, userEmail }: { role: string; userName: string; userEmail: string }) {
  const { open, close } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-[#0d0d1a] border-r border-white/[0.06] flex-col flex-shrink-0">
        <SidebarContent role={role} userName={userName} userEmail={userEmail} />
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/55 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-[#0d0d1a] border-r border-white/[0.06] z-50 flex flex-col lg:hidden transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menú de navegación"
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#64748b] hover:text-[#94a3b8] transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent onNavigate={close} role={role} userName={userName} userEmail={userEmail} />
      </aside>
    </>
  );
}
