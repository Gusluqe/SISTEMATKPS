import { Ticket, STATUS_LABELS, PRIORITY_LABELS, SECTOR_LABELS, CATEGORY_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";

// Escape de valores de usuario interpolados en el HTML de los emails:
// el formulario es público, sin esto el correo es un relay de phishing.
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ticketCreatedTemplate(ticket: Ticket): {
  subject: string;
  html: string;
} {
  const subject = `[${ticket.ticket_number}] Ticket recibido: ${ticket.title}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ticket de Soporte</title>
</head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(0,229,160,0.15);">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#00e5a0,#2563eb);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD</p>
                    <h1 style="margin:8px 0 0;font-size:26px;color:#ffffff;font-weight:700;">Soporte Técnico</h1>
                  </td>
                  <td align="right">
                    <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;display:inline-block;">
                      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.8);">TICKET N°</p>
                      <p style="margin:4px 0 0;font-size:20px;color:#ffffff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Estimado/a,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Tu solicitud de soporte técnico ha sido recibida y registrada correctamente en nuestro sistema.
                Nuestro equipo técnico la atenderá a la brevedad.
              </p>

              <!-- TICKET INFO CARD -->
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 16px;font-size:12px;color:#00e5a0;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Detalles del Ticket</p>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                      <span style="font-size:12px;color:#64748b;display:block;">Título</span>
                      <span style="font-size:14px;color:#f1f5f9;font-weight:600;">${esc(ticket.title)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                      <table width="100%"><tr>
                        <td width="50%">
                          <span style="font-size:12px;color:#64748b;display:block;">Estado</span>
                          <span style="font-size:13px;color:#00e5a0;font-weight:600;">● Abierto</span>
                        </td>
                        <td width="50%">
                          <span style="font-size:12px;color:#64748b;display:block;">Prioridad</span>
                          <span style="font-size:13px;color:#f8fafc;font-weight:500;">${ticket.priority === "urgent" ? "🔴 Urgente" : ticket.priority === "high" ? "🟠 Alta" : ticket.priority === "medium" ? "🔵 Media" : "⚪ Baja"}</span>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                      <table width="100%"><tr>
                        <td width="50%">
                          <span style="font-size:12px;color:#64748b;display:block;">Categoría</span>
                          <span style="font-size:13px;color:#f8fafc;">${CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                        </td>
                        <td width="50%">
                          <span style="font-size:12px;color:#64748b;display:block;">Fecha</span>
                          <span style="font-size:13px;color:#f8fafc;">${formatDate(ticket.created_at)}</span>
                        </td>
                      </tr></table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="font-size:12px;color:#64748b;display:block;">Descripción</span>
                      <span style="font-size:13px;color:#94a3b8;line-height:1.5;">${esc(ticket.description)}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
                Si tenés más información que agregar o necesitás actualizar tu solicitud,
                respondé este email con el número de ticket <strong style="color:#00e5a0;">${ticket.ticket_number}</strong> en el asunto.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
              <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">
                Este es un mensaje automático del sistema de soporte de <strong style="color:#00e5a0;">PROTEGER SALUD</strong>.<br/>
                Por favor no respondas directamente a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function ticketStatusChangedTemplate(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string,
  // Base del link de calificación; con &score=1..5 registra el voto
  ratingBase?: string
): { subject: string; html: string } {
  const statusLabel = STATUS_LABELS[ticket.status] || newStatus;
  const subject = `[${ticket.ticket_number}] Actualización de ticket: ${statusLabel}`;
  const techName = ticket.technician?.name;

  const statusColor =
    ticket.status === "resolved"
      ? "#00e5a0"
      : ticket.status === "in_progress"
      ? "#2563eb"
      : ticket.status === "waiting"
      ? "#f59e0b"
      : ticket.status === "closed"
      ? "#64748b"
      : "#00e5a0";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(0,229,160,0.15);">

          <tr>
            <td style="background:linear-gradient(135deg,#00e5a0,#2563eb);padding:32px 40px;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;">PROTEGER SALUD · Soporte Técnico</p>
              <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">Actualización de Ticket</h1>
              <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.85);font-family:monospace;">${ticket.ticket_number}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;">
                Hola <strong style="color:#f1f5f9;">${esc(ticket.requester_name)}</strong>, tu ticket ha sido actualizado.
              </p>

              ${techName ? `
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
                <div style="width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <span style="font-size:14px;font-weight:700;color:#60a5fa;">${esc(techName.charAt(0).toUpperCase())}</span>
                </div>
                <div>
                  <p style="margin:0;font-size:11px;color:#64748b;">TÉCNICO ASIGNADO</p>
                  <p style="margin:2px 0 0;font-size:14px;color:#f1f5f9;font-weight:600;">${esc(techName)}</p>
                </div>
              </div>` : ""}

              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:20px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 12px;font-size:12px;color:#64748b;">NUEVO ESTADO</p>
                <span style="font-size:22px;font-weight:700;color:${statusColor};">● ${statusLabel}</span>
              </div>

              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:20px;">
                <p style="margin:0 0 12px;font-size:12px;color:#00e5a0;text-transform:uppercase;letter-spacing:1px;">Ticket</p>
                <p style="margin:0 0 4px;font-size:14px;color:#f1f5f9;font-weight:600;">${esc(ticket.title)}</p>
                <p style="margin:0;font-size:12px;color:#475569;">Actualizado: ${formatDate(ticket.updated_at)}</p>
              </div>

              ${
                ticket.status === "resolved"
                  ? `<div style="margin-top:20px;padding:16px;background:rgba(0,229,160,0.05);border-left:3px solid #00e5a0;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">Tu ticket fue marcado como <strong style="color:#00e5a0;">Resuelto</strong>. Si el problema persiste, no dudes en crear un nuevo ticket.</p>
              </div>`
                  : ""
              }

              ${
                ticket.status === "resolved" && ratingBase
                  ? `<div style="margin-top:20px;background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:24px;text-align:center;">
                <p style="margin:0 0 6px;font-size:14px;color:#f1f5f9;font-weight:700;">¿Cómo fue la atención?</p>
                <p style="margin:0 0 18px;font-size:12px;color:#64748b;">Tocá una estrella para calificar (1 = mala, 5 = excelente)</p>
                <table cellpadding="0" cellspacing="0" align="center"><tr>
                  ${[1, 2, 3, 4, 5]
                    .map(
                      (n) => `<td style="padding:0 5px;">
                    <a href="${ratingBase}&score=${n}" style="display:inline-block;width:44px;height:44px;line-height:44px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;font-size:20px;text-decoration:none;text-align:center;">⭐</a>
                    <p style="margin:4px 0 0;font-size:11px;color:#64748b;">${n}</p>
                  </td>`
                    )
                    .join("")}
                </tr></table>
              </div>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
              <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">
                Mensaje automático · <strong style="color:#00e5a0;">PROTEGER SALUD</strong> · Soporte Técnico
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function ticketAssignedToTechTemplate(ticket: Ticket): {
  subject: string;
  html: string;
} {
  const subject = `[${ticket.ticket_number}] Nuevo ticket asignado: ${ticket.title}`;

  const priorityColor =
    ticket.priority === "urgent"
      ? "#ef4444"
      : ticket.priority === "high"
      ? "#f59e0b"
      : ticket.priority === "medium"
      ? "#3b82f6"
      : "#64748b";

  const priorityLabel =
    ticket.priority === "urgent"
      ? "🔴 Urgente"
      : ticket.priority === "high"
      ? "🟠 Alta"
      : ticket.priority === "medium"
      ? "🔵 Media"
      : "⚪ Baja";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(37,99,235,0.2);">

          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#8b5cf6);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD · Soporte Técnico</p>
                    <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">Ticket asignado</h1>
                  </td>
                  <td align="right">
                    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;">
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);">TICKET N°</p>
                      <p style="margin:4px 0 0;font-size:16px;color:#fff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Hola <strong style="color:#f1f5f9;">${ticket.technician?.name || "Técnico"}</strong>,
                se te asignó un nuevo ticket de soporte que requiere tu atención.
              </p>

              <!-- TICKET INFO -->
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:24px;margin-bottom:20px;">
                <p style="margin:0 0 16px;font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Detalles del ticket</p>

                <p style="margin:0 0 4px;font-size:16px;color:#f1f5f9;font-weight:700;">${esc(ticket.title)}</p>
                <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${esc(ticket.requester_name)} · ${esc(ticket.area)}</p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td width="50%" style="padding-bottom:8px;">
                      <p style="margin:0 0 3px;font-size:10px;color:#475569;text-transform:uppercase;">Prioridad</p>
                      <p style="margin:0;font-size:13px;font-weight:600;color:${priorityColor};">${priorityLabel}</p>
                    </td>
                    <td width="50%" style="padding-bottom:8px;">
                      <p style="margin:0 0 3px;font-size:10px;color:#475569;text-transform:uppercase;">Solicitante</p>
                      <p style="margin:0;font-size:13px;color:#94a3b8;">${esc(ticket.requester_email)}</p>
                    </td>
                  </tr>
                </table>

                <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;">
                  <p style="margin:0 0 6px;font-size:10px;color:#475569;text-transform:uppercase;">Descripción</p>
                  <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">${esc(ticket.description.substring(0, 280))}${ticket.description.length > 280 ? "..." : ""}</p>
                </div>
              </div>

              <div style="padding:14px 16px;background:rgba(37,99,235,0.05);border-left:3px solid #2563eb;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                  Ingresá al panel de administración para ver el ticket completo y gestionar su resolución.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
              <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">
                Mensaje automático · <strong style="color:#60a5fa;">PROTEGER SALUD</strong> · Soporte Técnico
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function ticketPriorityChangedTemplate(
  ticket: Ticket,
  oldPriority: string,
  newPriority: string
): { subject: string; html: string } {
  const newPriorityLabel = PRIORITY_LABELS[ticket.priority] || newPriority;
  const oldPriorityLabel = PRIORITY_LABELS[oldPriority as keyof typeof PRIORITY_LABELS] || oldPriority;
  const techName = ticket.technician?.name;

  const subject = `[${ticket.ticket_number}] Tu ticket fue evaluado — Prioridad actualizada`;

  const priorityColor =
    ticket.priority === "urgent"
      ? "#ef4444"
      : ticket.priority === "high"
      ? "#f59e0b"
      : ticket.priority === "medium"
      ? "#3b82f6"
      : "#64748b";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(0,229,160,0.15);">

          <tr>
            <td style="background:linear-gradient(135deg,#00e5a0,#2563eb);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD · Soporte Técnico</p>
                    <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">Ticket Evaluado</h1>
                  </td>
                  <td align="right">
                    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;">
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);">TICKET N°</p>
                      <p style="margin:4px 0 0;font-size:16px;color:#fff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Hola <strong style="color:#f1f5f9;">${esc(ticket.requester_name)}</strong>,
                tu solicitud de soporte fue evaluada por nuestro equipo técnico.
              </p>

              ${techName ? `
              <!-- TECH CARD -->
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(37,99,235,0.2);padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 14px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Técnico asignado</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:14px;">
                      <div style="width:44px;height:44px;border-radius:50%;background:rgba(37,99,235,0.15);border:2px solid rgba(37,99,235,0.35);display:flex;align-items:center;justify-content:center;text-align:center;line-height:44px;">
                        <span style="font-size:18px;font-weight:700;color:#60a5fa;">${esc(techName.charAt(0).toUpperCase())}</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0;font-size:16px;color:#f1f5f9;font-weight:700;">${esc(techName)}</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#475569;">tomó tu caso y lo está atendiendo</p>
                    </td>
                  </tr>
                </table>
              </div>` : `
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">El equipo técnico evaluó tu solicitud y actualizó su prioridad.</p>
              </div>`}

              <!-- PRIORITY CHANGE -->
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 16px;font-size:11px;color:#00e5a0;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Prioridad actualizada</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;">
                      <p style="margin:0 0 6px;font-size:10px;color:#475569;text-transform:uppercase;">Anterior</p>
                      <p style="margin:0;font-size:15px;color:#475569;font-weight:600;text-decoration:line-through;">${oldPriorityLabel}</p>
                    </td>
                    <td style="text-align:center;width:40px;">
                      <span style="font-size:18px;color:#475569;">→</span>
                    </td>
                    <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid ${priorityColor}33;">
                      <p style="margin:0 0 6px;font-size:10px;color:#475569;text-transform:uppercase;">Nueva</p>
                      <p style="margin:0;font-size:16px;color:${priorityColor};font-weight:700;">● ${newPriorityLabel}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- TICKET INFO -->
              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Tu solicitud</p>
                <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${esc(ticket.title)}</p>
              </div>

              <!-- INFO NOTE -->
              <div style="padding:16px;background:rgba(0,229,160,0.04);border-left:3px solid #00e5a0;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7;">
                  Te notificaremos automáticamente ante cualquier cambio de estado de tu ticket.
                  Una vez que el problema sea <strong style="color:#00e5a0;">resuelto</strong>, recibirás un email con la confirmación.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
              <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">
                Mensaje automático · <strong style="color:#00e5a0;">PROTEGER SALUD</strong> · Soporte Técnico
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function newCommentTemplate(
  ticket: Ticket,
  commentContent: string,
  authorName: string
): { subject: string; html: string } {
  const subject = `[${ticket.ticket_number}] Nuevo comentario en tu ticket`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(0,229,160,0.15);">
        <tr>
          <td style="background:linear-gradient(135deg,#00e5a0,#2563eb);padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD · Soporte Técnico</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">Nuevo Comentario</h1>
              </td>
              <td align="right">
                <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;">
                  <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);">TICKET N°</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#fff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                </div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${esc(ticket.requester_name)}</strong>, el equipo técnico dejó un comentario en tu ticket.</p>
            <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(0,229,160,0.12);padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#00e5a0;">${esc(authorName)}</p>
              <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.7;white-space:pre-wrap;">${esc(commentContent)}</p>
            </div>
            <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Tu ticket</p>
              <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${esc(ticket.title)}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
            <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">Mensaje automático · <strong style="color:#00e5a0;">PROTEGER SALUD</strong> · Soporte Técnico</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

// Aviso al técnico asignado cuando el solicitante comenta su ticket
export function newCommentForTechTemplate(
  ticket: Ticket,
  commentContent: string,
  authorName: string
): { subject: string; html: string } {
  const subject = `[${ticket.ticket_number}] ${authorName} respondió en el ticket`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(37,99,235,0.2);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#8b5cf6);padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD · Soporte Técnico</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">Respuesta del solicitante</h1>
              </td>
              <td align="right">
                <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;">
                  <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);">TICKET N°</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#fff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                </div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;"><strong style="color:#f1f5f9;">${esc(authorName)}</strong> dejó un comentario en un ticket que tenés asignado.</p>
            <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(37,99,235,0.15);padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#60a5fa;">${esc(authorName)}</p>
              <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.7;white-space:pre-wrap;">${esc(commentContent)}</p>
            </div>
            <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1px;">Ticket</p>
              <p style="margin:0;font-size:14px;color:#f1f5f9;font-weight:600;">${esc(ticket.title)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${esc(ticket.requester_name)} · ${esc(ticket.area)}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
            <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">Mensaje automático · <strong style="color:#60a5fa;">PROTEGER SALUD</strong> · Soporte Técnico</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

// Recordatorio al equipo: ticket sin primera respuesta con el SLA vencido
export function slaReminderTemplate(
  ticket: Ticket,
  hoursOverdue: number
): { subject: string; html: string } {
  const priorityLabel = PRIORITY_LABELS[ticket.priority] || ticket.priority;
  const sectorLabel = SECTOR_LABELS[ticket.sector] || ticket.sector;
  const subject = `⚠️ [${ticket.ticket_number}] SLA vencido — ${priorityLabel} sin respuesta`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(239,68,68,0.3);">
        <tr>
          <td style="background:linear-gradient(135deg,#ef4444,#f59e0b);padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td>
                <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD · Equipo de ${sectorLabel}</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">⚠️ Ticket sin respuesta</h1>
              </td>
              <td align="right">
                <div style="background:rgba(255,255,255,0.2);border-radius:10px;padding:10px 16px;">
                  <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.8);">TICKET N°</p>
                  <p style="margin:4px 0 0;font-size:16px;color:#fff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                </div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px;font-size:15px;color:#94a3b8;line-height:1.6;">
              Este ticket de prioridad <strong style="color:#f59e0b;">${priorityLabel}</strong> lleva
              <strong style="color:#ef4444;">${hoursOverdue}h más que el tiempo prometido</strong> sin primera respuesta del equipo.
            </p>
            <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:24px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:16px;color:#f1f5f9;font-weight:700;">${esc(ticket.title)}</p>
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;">${esc(ticket.requester_name)} · ${esc(ticket.area)}</p>
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">${esc(ticket.description.substring(0, 200))}${ticket.description.length > 200 ? "..." : ""}</p>
            </div>
            <div style="padding:14px 16px;background:rgba(239,68,68,0.06);border-left:3px solid #ef4444;border-radius:4px;">
              <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                Entrá al panel y tomalo, o cambiale el estado para que el solicitante sepa que está en proceso.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
            <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">Mensaje automático · <strong style="color:#ef4444;">PROTEGER SALUD</strong> · Control de SLA</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

export function newTicketForTeamTemplate(ticket: Ticket): {
  subject: string;
  html: string;
} {
  const sectorLabel = SECTOR_LABELS[ticket.sector] || ticket.sector;
  const subject = `[${ticket.ticket_number}] Nuevo ticket de ${ticket.area} — ${sectorLabel}`;

  const priorityColor =
    ticket.priority === "urgent"
      ? "#ef4444"
      : ticket.priority === "high"
      ? "#f59e0b"
      : ticket.priority === "medium"
      ? "#3b82f6"
      : "#64748b";

  const priorityLabel =
    ticket.priority === "urgent"
      ? "🔴 Urgente"
      : ticket.priority === "high"
      ? "🟠 Alta"
      : ticket.priority === "medium"
      ? "🔵 Media"
      : "⚪ Baja";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#0a1830;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#13233f;border-radius:16px;overflow:hidden;border:1px solid rgba(0,229,160,0.2);">

          <tr>
            <td style="background:linear-gradient(135deg,#00e5a0,#2563eb);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;font-weight:600;">PROTEGER SALUD · Equipo de ${sectorLabel}</p>
                    <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">Nuevo ticket para tu equipo</h1>
                  </td>
                  <td align="right">
                    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;">
                      <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);">TICKET N°</p>
                      <p style="margin:4px 0 0;font-size:16px;color:#fff;font-weight:800;font-family:monospace;">${ticket.ticket_number}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Entró un ticket nuevo para el equipo de <strong style="color:#f1f5f9;">${sectorLabel}</strong>
                desde <strong style="color:#00e5a0;">${esc(ticket.area)}</strong>.
              </p>

              <div style="background:#1c3054;border-radius:12px;border:1px solid rgba(255,255,255,0.06);padding:24px;margin-bottom:20px;">
                <p style="margin:0 0 16px;font-size:11px;color:#00e5a0;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Detalles del ticket</p>

                <p style="margin:0 0 4px;font-size:16px;color:#f1f5f9;font-weight:700;">${esc(ticket.title)}</p>
                <p style="margin:0 0 16px;font-size:13px;color:#64748b;">${esc(ticket.requester_name)} · ${esc(ticket.area)}</p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                  <tr>
                    <td width="50%" style="padding-bottom:8px;">
                      <p style="margin:0 0 3px;font-size:10px;color:#475569;text-transform:uppercase;">Prioridad</p>
                      <p style="margin:0;font-size:13px;font-weight:600;color:${priorityColor};">${priorityLabel}</p>
                    </td>
                    <td width="50%" style="padding-bottom:8px;">
                      <p style="margin:0 0 3px;font-size:10px;color:#475569;text-transform:uppercase;">Solicitante</p>
                      <p style="margin:0;font-size:13px;color:#94a3b8;">${esc(ticket.requester_email)}</p>
                    </td>
                  </tr>
                </table>

                <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;">
                  <p style="margin:0 0 6px;font-size:10px;color:#475569;text-transform:uppercase;">Descripción</p>
                  <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">${esc(ticket.description.substring(0, 280))}${ticket.description.length > 280 ? "..." : ""}</p>
                </div>
              </div>

              <div style="padding:14px 16px;background:rgba(0,229,160,0.05);border-left:3px solid #00e5a0;border-radius:4px;">
                <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                  Ingresá al panel de administración para tomarlo o asignarlo.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);background:#0e1d38;">
              <p style="margin:0;font-size:12px;color:#44597c;text-align:center;">
                Mensaje automático · <strong style="color:#00e5a0;">PROTEGER SALUD</strong> · Sistema de Tickets
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
