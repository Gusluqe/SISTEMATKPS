import { TicketForm } from "@/components/tickets/TicketForm";
import { Lock, ArrowRight, CheckCircle, Clock, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#081428]">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#0e1d38]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
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
              <p className="text-[10px] text-[#475569] leading-none mt-0.5">Soporte Técnico</p>
            </div>
          </div>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1.5 min-h-[44px] px-3.5 -mr-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-[#94a3b8] hover:text-[#e2e8f0] hover:border-white/[0.16] active:bg-white/[0.10] active:scale-[0.97] transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panel Admin</span>
            <span className="sm:hidden">Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">

          {/* Left — info */}
          <div className="space-y-10">
            {/* Hero */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00e5a0]/8 border border-[#00e5a0]/15 text-xs text-[#00e5a0] font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse" />
                Sistema activo · Tiempo de respuesta normal
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#f8fafc] leading-[1.15] mb-4 tracking-tight">
                Centro de soporte<br />
                <span className="text-[#00e5a0]">técnico</span> de Proteger Salud
              </h1>
              <p className="text-base text-[#64748b] leading-relaxed max-w-[460px]">
                Reportá tu problema y nuestro equipo lo resolverá según el nivel de prioridad de tu solicitud.
              </p>
            </div>

            {/* Service features — list, not identical cards */}
            <div className="space-y-0 border border-white/[0.07] rounded-2xl overflow-hidden">
              {[
                {
                  icon: Zap,
                  label: "Respuesta rápida",
                  desc: "SLA garantizado según la prioridad del problema",
                  accent: "text-[#3b82f6]",
                  bg: "bg-[#3b82f6]/8",
                },
                {
                  icon: CheckCircle,
                  label: "Seguimiento automático",
                  desc: "Recibís un email en cada cambio de estado de tu ticket",
                  accent: "text-[#00e5a0]",
                  bg: "bg-[#00e5a0]/8",
                },
                {
                  icon: Lock,
                  label: "Datos protegidos",
                  desc: "Tu información solo es visible para el equipo técnico",
                  accent: "text-[#8b5cf6]",
                  bg: "bg-[#8b5cf6]/8",
                },
              ].map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-start gap-4 px-5 py-4 bg-[#13233f] ${i < 2 ? "border-b border-white/[0.06]" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${f.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <f.icon className={`w-4 h-4 ${f.accent}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#e2e8f0] mb-0.5">{f.label}</p>
                    <p className="text-xs text-[#475569] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SLA table */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Tiempos de respuesta garantizados (SLA)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { priority: "Urgente", time: "≤ 1 h", colorText: "text-red-400", colorDot: "bg-red-500 animate-pulse", colorBg: "bg-red-500/6 border-red-500/12" },
                  { priority: "Alta",    time: "≤ 4 h", colorText: "text-amber-400", colorDot: "bg-amber-400", colorBg: "bg-amber-400/6 border-amber-400/12" },
                  { priority: "Media",   time: "≤ 24 h", colorText: "text-blue-400", colorDot: "bg-blue-400", colorBg: "bg-blue-400/6 border-blue-400/12" },
                  { priority: "Baja",   time: "≤ 72 h", colorText: "text-slate-400", colorDot: "bg-slate-400", colorBg: "bg-slate-400/6 border-slate-400/10" },
                ].map((row) => (
                  <div
                    key={row.priority}
                    className={`${row.colorBg} border rounded-xl px-3 py-3 flex flex-col gap-2`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.colorDot}`} />
                      <span className={`text-xs font-semibold ${row.colorText}`}>{row.priority}</span>
                    </div>
                    <p className="text-sm font-bold text-[#f8fafc] font-mono tabular-nums">{row.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="bg-[#0e1d38] border border-white/[0.09] rounded-2xl p-5 sm:p-6 animate-fade-in ring-1 ring-inset ring-white/[0.04]">
            <div className="mb-5 pb-4 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-[#f8fafc] mb-1">
                Nuevo ticket de soporte
              </h2>
              <p className="text-xs text-[#475569]">
                Completá el formulario y recibirás un email de confirmación.
              </p>
            </div>
            <TicketForm />
          </div>
        </div>
      </div>
    </div>
  );
}
