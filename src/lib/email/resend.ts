import nodemailer from "nodemailer";
import { Ticket } from "@/types";
import {
  ticketCreatedTemplate,
  ticketStatusChangedTemplate,
  ticketPriorityChangedTemplate,
  ticketAssignedToTechTemplate,
  newCommentTemplate,
  newTicketForTeamTemplate,
} from "./templates";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"Soporte Técnico · Proteger Salud" <${process.env.GMAIL_USER}>`;

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    console.error("[Email] Error sending to", to, err);
    return { success: false, error: err };
  }
}

export async function sendTicketCreatedEmail(ticket: Ticket) {
  const { subject, html } = ticketCreatedTemplate(ticket);
  return send(ticket.requester_email, subject, html);
}

export async function sendNewTicketToTeamEmail(ticket: Ticket, emails: string[]) {
  if (emails.length === 0) return { success: false, error: "No team emails" };
  const { subject, html } = newTicketForTeamTemplate(ticket);
  try {
    // BCC: cada técnico recibe el aviso sin ver los emails del resto
    await transporter.sendMail({ from: FROM, bcc: emails, subject, html });
    return { success: true };
  } catch (err) {
    console.error("[Email] Error sending team notification", err);
    return { success: false, error: err };
  }
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

export async function sendNewCommentEmail(ticket: Ticket, commentContent: string, authorName: string) {
  const { subject, html } = newCommentTemplate(ticket, commentContent, authorName);
  return send(ticket.requester_email, subject, html);
}

export async function sendTicketStatusChangedEmail(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string
) {
  const { subject, html } = ticketStatusChangedTemplate(ticket, oldStatus, newStatus);
  return send(ticket.requester_email, subject, html);
}
