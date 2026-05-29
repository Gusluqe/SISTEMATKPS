"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Credenciales incorrectas. Verificá tu email y contraseña.");
      setLoading(false);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image
            src="/logo.png"
            alt="Proteger Salud"
            width={40}
            height={40}
            className="rounded-2xl object-contain flex-shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-[#f8fafc] uppercase tracking-[0.12em] leading-none">
              Proteger Salud
            </p>
            <p className="text-xs text-[#475569] mt-1 leading-none">Panel de soporte</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d1a] border border-white/[0.09] rounded-2xl p-7 ring-1 ring-inset ring-white/[0.04]">
          <h1 className="text-xl font-bold text-[#f8fafc] mb-1">Iniciar sesión</h1>
          <p className="text-sm text-[#475569] mb-6">
            Acceso restringido al equipo de Sistemas.
          </p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@protegesalud.com"
                required
                autoComplete="email"
                className="w-full bg-[#12121f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#334155] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#12121f] border border-white/10 rounded-xl px-3.5 py-2.5 pr-11 text-sm text-[#f8fafc] placeholder:text-[#334155] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00e5a0] to-[#00c87d] text-[#050509] font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-[#050509]/30 border-t-[#050509] rounded-full animate-spin" />
              )}
              {loading ? "Ingresando..." : "Ingresar al panel"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#1e293b] mt-5">
          Proteger Salud · Sistema de Soporte Técnico Interno
        </p>
      </div>
    </div>
  );
}
