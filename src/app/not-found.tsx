import Link from "next/link";
import { Shield, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#081428] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[#13233f] border border-white/[0.07] flex items-center justify-center mx-auto mb-8">
          <Search className="w-9 h-9 text-[#44597c]" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c3054] border border-white/[0.07] text-xs text-[#475569] font-mono mb-6">
          404 — No encontrado
        </div>
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-3">
          Página no encontrada
        </h1>
        <p className="text-[#64748b] mb-8 leading-relaxed">
          El recurso que buscás no existe o fue movido a otra dirección.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#00c87d] text-[#081428] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Shield className="w-4 h-4" />
            Ir al inicio
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13233f] border border-white/[0.07] text-[#94a3b8] text-sm font-medium hover:border-white/[0.12] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Panel Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
