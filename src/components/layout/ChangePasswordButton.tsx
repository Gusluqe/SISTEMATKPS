"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { KeyRound, Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";

// Cambio de contraseña de la propia cuenta, desde el sidebar. Usa la sesión
// del navegador (auth.updateUser), no pasa por las API routes.
export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = () => {
    setOpen(false);
    setPassword("");
    setConfirm("");
    setShowPwd(false);
    setError(null);
    setDone(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(
        err.message.includes("different from the old")
          ? "La contraseña nueva no puede ser igual a la actual."
          : err.message
      );
      return;
    }
    setDone(true);
    setTimeout(close, 1800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#475569] hover:text-[#64748b] hover:bg-white/[0.03] transition-all duration-150"
      >
        <KeyRound className="w-4 h-4 flex-shrink-0" />
        <span>Cambiar contraseña</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative bg-[#13233f] border border-white/[0.09] rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[#f8fafc]">Cambiar mi contraseña</h2>
              <button
                onClick={close}
                className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#64748b] hover:text-[#94a3b8] transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-[#00e5a0]/10 border border-[#00e5a0]/25 text-[#00e5a0] text-sm">
                <Check className="w-4 h-4 flex-shrink-0" />
                Contraseña actualizada. Usala en tu próximo ingreso.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    Nueva contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 12 caracteres"
                      required
                      minLength={12}
                      autoFocus
                      className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#f8fafc] placeholder:text-[#44597c] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
                    Repetir contraseña *
                  </label>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="La misma de arriba"
                    required
                    minLength={12}
                    className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#44597c] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={close}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="flex-1" loading={loading}>
                    <Check className="w-3.5 h-3.5" />
                    Guardar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
