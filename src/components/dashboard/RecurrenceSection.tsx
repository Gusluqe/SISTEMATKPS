"use client";

import { useState } from "react";
import { RecurrenceAlert, RecurrentAction, RECURRENCE_WINDOW_DAYS } from "@/lib/recurrence";
import { CATEGORY_LABELS } from "@/types";
import { CATEGORY_ICONS, formatRelative } from "@/lib/utils";
import { Repeat, Check, X, History, Loader2 } from "lucide-react";

interface Props {
  alerts: RecurrenceAlert[];
  history: RecurrentAction[];
}

export function RecurrenceSection({ alerts: initialAlerts, history: initialHistory }: Props) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [history, setHistory] = useState(initialHistory);
  const [marking, setMarking] = useState<RecurrenceAlert | null>(null);
  const [actionText, setActionText] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (alerts.length === 0 && history.length === 0) return null;

  const openMark = (alert: RecurrenceAlert) => {
    setActionText(alert.recommendation);
    setNote("");
    setError(null);
    setMarking(alert);
  };

  const save = async () => {
    if (!marking || !actionText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/recurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area: marking.area,
          category: marking.category,
          action: actionText.trim(),
          note: note.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      setAlerts((prev) => prev.filter((a) => !(a.area === marking.area && a.category === marking.category)));
      setHistory((prev) => [json, ...prev]);
      setMarking(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#13233f] border border-amber-500/20 rounded-2xl">
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-semibold text-[#e2e8f0]">
            Fallas recurrentes
            {alerts.length > 0 && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-semibold">
                {alerts.length} patrón{alerts.length !== 1 ? "es" : ""} detectado{alerts.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94a3b8] transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {showHistory ? "Ocultar historial" : `Historial (${history.length})`}
          </button>
        )}
      </div>

      {/* Alertas activas */}
      {alerts.length === 0 ? (
        <p className="px-5 py-4 text-xs text-[#44597c]">
          Sin patrones activos — los tickets repetidos por sucursal aparecen acá solos.
        </p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {alerts.map((alert) => (
            <div key={`${alert.area}|${alert.category}`} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e2e8f0] font-semibold">
                  {CATEGORY_ICONS[alert.category] || "📋"} {alert.categoryLabel} · {alert.area}
                </p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  <span className="text-amber-400 font-semibold">{alert.count} tickets</span> en los
                  últimos {RECURRENCE_WINDOW_DAYS} días · último {formatRelative(alert.lastAt)}
                </p>
                <p className="text-xs text-[#00e5a0] mt-1.5">→ {alert.recommendation}</p>
              </div>
              <button
                onClick={() => openMark(alert)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-xs font-semibold text-[#00e5a0] hover:bg-[#00e5a0]/15 transition-colors flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                Acción tomada
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Historial de acciones */}
      {showHistory && history.length > 0 && (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
          {history.map((h) => (
            <div key={h.id} className="px-5 py-3">
              <p className="text-xs text-[#94a3b8]">
                <span className="text-[#00e5a0] font-semibold">✓ {h.action}</span>
                {" · "}
                {CATEGORY_LABELS[h.category] || h.category} · {h.area}
              </p>
              {h.note && <p className="text-xs text-[#64748b] mt-0.5">{h.note}</p>}
              <p className="text-[10px] text-[#44597c] mt-0.5">
                {h.created_by || "Admin"} · {formatRelative(h.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de acción tomada */}
      {marking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMarking(null)} />
          <div className="relative bg-[#13233f] border border-white/[0.09] rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#f8fafc]">Registrar acción</h2>
              <button
                onClick={() => setMarking(null)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#64748b] transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#94a3b8] mb-4">
              {CATEGORY_ICONS[marking.category] || "📋"} <strong className="text-[#e2e8f0]">{marking.categoryLabel} · {marking.area}</strong> — al
              registrar la acción, la alerta se apaga y solo vuelve si el problema reincide.
            </p>
            <label className="block text-xs font-semibold text-[#64748b] mb-1.5">¿Qué se hizo? *</label>
            <input
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] mb-3 focus:outline-none focus:border-[#00e5a0]/40 transition-colors"
              placeholder="Ej: Se cambió la impresora"
            />
            <label className="block text-xs font-semibold text-[#64748b] mb-1.5">Nota (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-[#1c3054] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] mb-3 focus:outline-none focus:border-[#00e5a0]/40 transition-colors resize-none"
              placeholder="Ej: Impresora nueva HP, se instaló el 01/08"
            />
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <button
              onClick={save}
              disabled={saving || !actionText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00e5a0] text-[#081428] text-sm font-bold hover:bg-[#00e5a0]/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
