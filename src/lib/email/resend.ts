import nodemailer from "nodemailer";
import { Ticket } from "@/types";
import { ratingUrl } from "@/lib/sla";
import {
  ticketCreatedTemplate,
  ticketStatusChangedTemplate,
  ticketPriorityChangedTemplate,
  ticketAssignedToTechTemplate,
  newCommentTemplate,
  newCommentForTechTemplate,
  newTicketForTeamTemplate,
  slaReminderTemplate,
} from "./templates";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"Soporte Técnico · Proteger Salud" <${process.env.GMAIL_USER}>`;

async function send(to: string | null | undefined, subject: string, html: string) {
  // Los técnicos sin email cargado simplemente no reciben avisos
  if (!to) return { success: false, error: "No recipient" };
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    console.error("[Email] Error sending to", to, err);
    return { success: false, error: err };
  }
}

async function sendBcc(emails: (string | null | undefined)[], subject: string, html: string) {
  const bcc = emails.filter((e): e is string => Boolean(e));
  if (bcc.length === 0) return { success: false, error: "No recipients" };
  try {
    // BCC: cada técnico recibe el aviso sin ver los emails del resto
    await transporter.sendMail({ from: FROM, bcc, subject, html });
    return { success: true };
  } catch (err) {
    console.error("[Email] Error sending bcc", err);
    return { success: false, error: err };
  }
}

export async function sendTicketCreatedEmail(ticket: Ticket) {
  const { subject, html } = ticketCreatedTemplate(ticket);
  return send(ticket.requester_email, subject, html);
}

export async function sendNewTicketToTeamEmail(ticket: Ticket, emails: (string | null)[]) {
  const { subject, html } = newTicketForTeamTemplate(ticket);
  return sendBcc(emails, subject, html);
}

export async function sendTicketAssignedToTechEmail(ticket: Ticket) {
  if (!ticket.technician?.email) return { success: false, error: "No tech email" };
  const { subject, html } = ticketAssignedToTechTemplate(ticket);
  return send(ticket.technician.email, subject, html);
}

export async function sendTicketPriorityChangedEmail(
  ticket: Ticket,
  oldPriority: string,
  newPriority: string
) {
  const { subject, html } = ticketPriorityChangedTemplate(ticket, oldPriority, newPriority);
  return send(ticket.requester_email, subject, html);
}

// Comentario del equipo → aviso al solicitante
export async function sendNewCommentEmail(ticket: Ticket, commentContent: string, authorName: string) {
  const { subject, html } = newCommentTemplate(ticket, commentContent, authorName);
  return send(ticket.requester_email, subject, html);
}

// Comentario del solicitante → aviso al técnico asignado (o al equipo del sector)
export async function sendNewCommentToTechEmail(
  ticket: Ticket,
  commentContent: string,
  authorName: string,
  fallbackEmails: (string | null)[] = []
) {
  const { subject, html } = newCommentForTechTemplate(ticket, commentContent, authorName);
  if (ticket.technician?.email) return send(ticket.technician.email, subject, html);
  return sendBcc(fallbackEmails, subject, html);
}

export async function sendTicketStatusChangedEmail(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string
) {
  // Al resolver, el email incluye la encuesta de satisfacción (1-5 estrellas)
  const ratingBase = newStatus === "resolved" ? ratingUrl(ticket.id) : undefined;
  const { subject, html } = ticketStatusChangedTemplate(ticket, oldStatus, newStatus, ratingBase);
  return send(ticket.requester_email, subject, html);
}

// Recordatorio de SLA vencido al equipo del sector (+ admins)
export async function sendSlaReminderEmail(
  ticket: Ticket,
  emails: (string | null)[],
  hoursOverdue: number
) {
  const { subject, html } = slaReminderTemplate(ticket, hoursOverdue);
  return sendBcc(emails, subject, html);
}
