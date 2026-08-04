"use client";

import { useState } from "react";
import { Technician, TicketSector, SECTOR_LABELS } from "@/types";
import { UserPlus, Pencil, Power, PowerOff, X, Check, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TechStats = {
  total: number;
  active: number;
  resolved: number;
  avg_hours: number | null;
};

interface TechnicianManagerProps {
  technicians: Technician[];
  stats: Record<string, TechStats>;
}

const AVATAR_COLORS = [
  "from-[#3b82f6] to-[#8b5cf6]",
  "from-[#00e5a0] to-[#3b82f6]",
  "from-[#f59e0b] to-[#ef4444]",
  "from-[#8b5cf6] to-[#ec4899]",
  "from-[#14b8a6] to-[#3b82f6]",
];

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#13233f] border border-white/[0.09] rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#f8fafc]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#64748b] hover:text-[#94a3b8] transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TechForm({
  initial,
  onSubmit,
  onClose,
  loading,
  error,
}: {
  initial?: { name: string; email: string | null; sectors: TicketSector[]; role: "admin" | "technician" };
  onSubmit: (name: string, email: string, password: string, sectors: TicketSector[], role: "admin" | "technician") => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [sectors, setSectors] = useState<TicketSector[]>(
    initial?.sectors?.length ? initial.sectors : ["sistemas"]
  );
  const [role, setRole] = useState<"admin" | "technician">(initial?.role || "technician");
  const isEdit = !!initial;

  const toggleSector = (s: TicketSector) =>
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (sectors.length === 0) return;
        onSubmit(name, email, password, sectors, role);
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
          Nombre completo *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan García"
          required
          minLength={2}
          className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#44597c] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
          {isEdit ? "Email (vacío = no recibe avisos)" : "Email *"}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="juan@protegersalud.com"
          required={!isEdit}
          className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#44597c] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
        />
        {isEdit && !email && (
          <p className="text-xs text-amber-400 mt-1.5">
            Sin email este técnico no recibe notificaciones de tickets.
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
          Sectores que atiende *
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SECTOR_LABELS) as TicketSector[]).map((s) => {
            const active = sectors.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSector(s)}
                aria-pressed={active}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#00e5a0]/10 border-[#00e5a0]/40 text-[#00e5a0]"
                    : "bg-[#1c3054] border-white/10 text-[#64748b] hover:border-white/20"
                }`}
              >
                {SECTOR_LABELS[s]}
              </button>
            );
          })}
        </div>
        {sectors.length === 0 && (
          <p className="text-xs text-red-400 mt-1.5">Seleccioná al menos un sector</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
          Permisos *
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "technician")}
          className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
        >
          <option value="technician">Técnico — solo los tickets de sus sectores</option>
          <option value="admin">Admin — acceso total (dashboard, técnicos, todo)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#64748b] mb-1.5">
          {isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
        </label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "••••••••" : "Mínimo 12 caracteres"}
            required={!isEdit}
            minLength={password ? 12 : undefined}
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
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" className="flex-1" loading={loading}>
          <Check className="w-3.5 h-3.5" />
          {isEdit ? "Guardar cambios" : "Agregar"}
        </Button>
      </div>
    </form>
  );
}

export function TechnicianManager({
  technicians: initial,
  stats,
}: TechnicianManagerProps) {
  const [technicians, setTechnicians] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editTech, setEditTech] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openAdd = () => {
    setFormError(null);
    setShowAdd(true);
  };

  const openEdit = (tech: Technician) => {
    setFormError(null);
    setEditTech(tech);
  };

  const addTech = async (name: string, email: string, password: string, sectors: TicketSector[], role: "admin" | "technician") => {
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, sectors, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al agregar");
      setTechnicians((prev) => [...prev, json]);
      setShowAdd(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const updateTech = async (name: string, email: string, password: string, sectors: TicketSector[], role: "admin" | "technician") => {
    if (!editTech) return;
    setLoading(true);
    setFormError(null);
    try {
      const body: Record<string, unknown> = { name, email: email.trim() || null, sectors, role };
      if (password) body.password = password;
      const res = await fetch(`/api/technicians/${editTech.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar");
      setTechnicians((prev) =>
        prev.map((t) => (t.id === editTech.id ? { ...t, ...json } : t))
      );
      setEditTech(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (tech: Technician) => {
    setTogglingId(tech.id);
    try {
      const res = await fetch(`/api/technicians/${tech.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !tech.active }),
      });
      if (res.ok) {
        setTechnicians((prev) =>
          prev.map((t) =>
            t.id === tech.id ? { ...t, active: !t.active } : t
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  };

  const activeCount = technicians.filter((t) => t.active).length;
  const inactiveCount = technicians.filter((t) => !t.active).length;

  return (
    <>
      <div className="max-w-4xl space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[#64748b]">
            {activeCount} activo{activeCount !== 1 ? "s" : ""}
            {inactiveCount > 0 && ` · ${inactiveCount} inactivo${inactiveCount !== 1 ? "s" : ""}`}
          </p>
          <Button size="sm" onClick={openAdd}>
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agregar técnico</span>
            <span className="sm:hidden">Agregar</span>
          </Button>
        </div>

        {/* Tech grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {technicians.length === 0 && (
            <div className="col-span-2 bg-[#13233f] border border-white/[0.07] rounded-2xl p-12 text-center">
              <UserPlus className="w-8 h-8 text-[#44597c] mx-auto mb-3" />
              <p className="text-sm text-[#475569]">No hay técnicos registrados.</p>
              <p className="text-xs text-[#44597c] mt-1">
                Usá el botón de arriba para agregar el primero.
              </p>
            </div>
          )}

          {technicians.map((tech, i) => {
            const s = stats[tech.id] || {
              total: 0,
              active: 0,
              resolved: 0,
              avg_hours: null,
            };
            const resolveRate =
              s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;
            const isBusy = togglingId === tech.id;

            return (
              <div
                key={tech.id}
                className={`bg-[#13233f] border rounded-2xl p-5 transition-all duration-200 ${
                  tech.active
                    ? "border-white/[0.07]"
                    : "border-white/[0.04] opacity-55"
                }`}
              >
                {/* Tech header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                  >
                    {tech.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#e2e8f0]">
                        {tech.name}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          tech.active
                            ? "bg-[#00e5a0]/8 border-[#00e5a0]/15 text-[#00e5a0]"
                            : "bg-white/[0.04] border-white/[0.08] text-[#475569]"
                        }`}
                      >
                        {tech.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {tech.email ? (
                      <p className="text-xs text-[#475569] truncate mt-0.5">
                        {tech.email}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-400/80 truncate mt-0.5">
                        Sin email — no recibe avisos
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tech.role === "admin" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 font-semibold">
                          Admin
                        </span>
                      )}
                      {(tech.sectors || ["sistemas"]).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#60a5fa] font-medium"
                        >
                          {SECTOR_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Total", value: s.total, color: "text-[#f8fafc]" },
                    { label: "Activos", value: s.active, color: "text-blue-400" },
                    { label: "Resueltos", value: s.resolved, color: "text-[#00e5a0]" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#1c3054] rounded-xl px-2 py-2.5 text-center"
                    >
                      <p className={`text-lg font-bold leading-none ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-[#475569] mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Resolve rate bar */}
                {s.total > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-[#475569]">
                        Tasa de resolución
                      </span>
                      <span className="text-[10px] font-semibold text-[#94a3b8]">
                        {resolveRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1c3054] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00e5a0] to-[#2563eb] rounded-full transition-all duration-500"
                        style={{ width: `${resolveRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Avg resolution */}
                {s.avg_hours !== null && (
                  <div className="mb-4 flex items-center justify-between px-3 py-2 bg-[#1c3054] rounded-xl">
                    <span className="text-xs text-[#475569]">
                      Resolución promedio
                    </span>
                    <span className="text-xs font-semibold text-[#94a3b8]">
                      {s.avg_hours < 1
                        ? `${Math.round(s.avg_hours * 60)}min`
                        : `${s.avg_hours.toFixed(1)}h`}
                    </span>
                  </div>
                )}

                {s.total === 0 && s.avg_hours === null && (
                  <div className="mb-3 px-3 py-2 bg-[#1c3054] rounded-xl">
                    <p className="text-[11px] text-[#44597c] text-center">
                      Sin tickets asignados aún
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => openEdit(tech)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c3054] border border-white/[0.06] text-xs font-medium text-[#94a3b8] hover:text-[#f8fafc] hover:border-white/15 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(tech)}
                    disabled={isBusy}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all disabled:opacity-50 ${
                      tech.active
                        ? "bg-red-500/8 border-red-500/15 text-red-400 hover:bg-red-500/12"
                        : "bg-[#00e5a0]/8 border-[#00e5a0]/15 text-[#00e5a0] hover:bg-[#00e5a0]/12"
                    }`}
                  >
                    {isBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : tech.active ? (
                      <>
                        <PowerOff className="w-3.5 h-3.5" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <Power className="w-3.5 h-3.5" />
                        Activar
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal title="Agregar técnico" onClose={() => setShowAdd(false)}>
          <TechForm
            onSubmit={addTech}
            onClose={() => setShowAdd(false)}
            loading={loading}
            error={formError}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTech && (
        <Modal title="Editar técnico" onClose={() => setEditTech(null)}>
          <TechForm
            initial={{ name: editTech.name, email: editTech.email, sectors: editTech.sectors || ["sistemas"], role: editTech.role || "technician" }}
            onSubmit={updateTech}
            onClose={() => setEditTech(null)}
            loading={loading}
            error={formError}
          />
        </Modal>
      )}
    </>
  );
}
