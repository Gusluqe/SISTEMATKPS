"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Technician, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelative } from "@/lib/utils";
import {
  Clock,
  User,
  Tag,
  AlertTriangle,
  MessageSquare,
  History,
  Send,
  Lock,
  Unlock,
  CheckCircle2,
} from "lucide-react";

interface TicketDetailProps {
  ticket: Ticket;
  technicians: Technician[];
  changedBy?: string;
}

export function TicketDetail({ ticket: initial, technicians, changedBy = "Admin" }: TicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [addingComment, setAddingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");

  const update = async (fields: Record<string, unknown>) => {
    startTransition(async () => {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, changed_by: changedBy }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((prev) => ({ ...prev, ...updated }));
        router.refresh();
      }
    });
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    setAddingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: "Admin",
          author_email: "admin@protegesalud.com",
          content: comment,
          is_internal: isInternal,
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setTicket((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), newComment],
        }));
        setComment("");
        router.refresh();
      }
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 animate-fade-in">
      {/* Main content */}
      <div className="space-y-5">
        {/* Header card */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="font-mono text-sm text-[#00e5a0] font-bold bg-[#00e5a0]/10 px-3 py-1 rounded-lg border border-[#00e5a0]/20">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="text-xl font-bold text-[#f8fafc] mb-2">{ticket.title}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-[#475569]">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {ticket.requester_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {ticket.area}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(ticket.created_at)}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Descripción
          </p>
          <p className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* Tabs: Comments / History */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/[0.06]">
            {(["comments", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? "text-[#00e5a0] border-b-2 border-[#00e5a0] bg-[#00e5a0]/5"
                    : "text-[#475569] hover:text-[#64748b]"
                }`}
              >
                {tab === "comments" ? (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    Comentarios ({ticket.comments?.length || 0})
                  </>
                ) : (
                  <>
                    <History className="w-3.5 h-3.5" />
                    Historial ({ticket.history?.length || 0})
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "comments" && (
              <div className="space-y-4">
                {(ticket.comments || []).length === 0 ? (
                  <p className="text-sm text-[#334155] text-center py-4">
                    Sin comentarios aún.
                  </p>
                ) : (
                  (ticket.comments || []).map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl p-4 border ${
                        c.is_internal
                          ? "bg-amber-500/5 border-amber-500/15"
                          : "bg-[#1a1a2e] border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#e2e8f0]">
                            {c.author_name}
                          </span>
                          {c.is_internal && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              Interno
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#334155]">
                          {formatRelative(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}

                {/* Add comment */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Agregar comentario..."
                    rows={3}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#334155] resize-none focus:outline-none focus:border-[#00e5a0]/40 mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-[#64748b] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      {isInternal ? (
                        <><Lock className="w-3 h-3 text-amber-400" /> Solo equipo técnico</>
                      ) : (
                        <><Unlock className="w-3 h-3" /> Visible al solicitante</>
                      )}
                    </label>
                    <Button
                      onClick={submitComment}
                      loading={addingComment}
                      disabled={!comment.trim()}
                      size="sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-2">
                {(ticket.history || []).length === 0 ? (
                  <p className="text-sm text-[#334155] text-center py-4">
                    Sin historial registrado.
                  </p>
                ) : (
                  [...(ticket.history || [])].reverse().map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#94a3b8]">
                          <span className="font-medium text-[#e2e8f0]">{h.changed_by}</span>
                          {" cambió "}
                          <span className="text-[#64748b]">{h.field_changed}</span>
                          {h.old_value && (
                            <> de <span className="text-red-400/70 line-through">{h.old_value}</span></>
                          )}
                          {h.new_value && (
                            <> a <span className="text-[#00e5a0]">{h.new_value}</span></>
                          )}
                        </p>
                        <p className="text-[11px] text-[#334155] mt-0.5">
                          {formatRelative(h.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar — management */}
      <div className="space-y-4">
        {/* Quick actions */}
        {ticket.status !== "resolved" && ticket.status !== "closed" && (
          <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
              Acciones Rápidas
            </p>
            <div className="space-y-2">
              {ticket.status === "open" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  loading={isPending}
                  onClick={() => update({ status: "in_progress" })}
                >
                  Tomar ticket
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                loading={isPending}
                onClick={() => update({ status: "resolved" })}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Marcar como resuelto
              </Button>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Estado
          </p>
          <select
            value={ticket.status}
            onChange={(e) => update({ status: e.target.value })}
            disabled={isPending}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-[#00e5a0]/40"
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Prioridad
          </p>
          <select
            value={ticket.priority}
            onChange={(e) => update({ priority: e.target.value })}
            disabled={isPending}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-[#00e5a0]/40"
          >
            {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Categoría
          </p>
          <select
            value={ticket.category}
            onChange={(e) => update({ category: e.target.value })}
            disabled={isPending}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-[#00e5a0]/40"
          >
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Technician */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Técnico Asignado
          </p>
          <select
            value={ticket.technician_id || ""}
            onChange={(e) =>
              update({ technician_id: e.target.value || null })
            }
            disabled={isPending}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-[#00e5a0]/40"
          >
            <option value="">Sin asignar</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>

        {/* Requester info */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Solicitante
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-[#334155]">Nombre</p>
              <p className="text-sm text-[#e2e8f0]">{ticket.requester_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#334155]">Email</p>
              <p className="text-sm text-[#94a3b8]">{ticket.requester_email}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#334155]">Área</p>
              <p className="text-sm text-[#94a3b8]">{ticket.area}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-[#12121f] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">
            Fechas
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-[#334155]">Creación</p>
              <p className="text-xs text-[#94a3b8]">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#334155]">Última actualización</p>
              <p className="text-xs text-[#94a3b8]">{formatDate(ticket.updated_at)}</p>
            </div>
            {ticket.resolved_at && (
              <div>
                <p className="text-[10px] text-[#334155]">Resolución</p>
                <p className="text-xs text-[#00e5a0]">{formatDate(ticket.resolved_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
