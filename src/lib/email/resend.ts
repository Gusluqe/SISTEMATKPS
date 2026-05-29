import { Resend } from "resend";
import { Ticket } from "@/types";
import {
  ticketCreatedTemplate,
  ticketStatusChangedTemplate,
  ticketPriorityChangedTemplate,
  ticketAssignedToTechTemplate,
} from "./templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "soporte@protegesalud.com";
const FROM_NAME = "Soporte Técnico · Proteger Salud";

export async function sendTicketCreatedEmail(ticket: Ticket) {
  const { subject, html } = ticketCreatedTemplate(ticket);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [ticket.requester_email],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Error sending ticket created email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

export async function sendTicketAssignedToTechEmail(ticket: Ticket) {
  if (!ticket.technician?.email) return { success: false, error: "No tech email" };
  const { subject, html } = ticketAssignedToTechTemplate(ticket);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [ticket.technician.email],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Error sending tech assignment email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

export async function sendTicketPriorityChangedEmail(
  ticket: Ticket,
  oldPriority: string,
  newPriority: string
) {
  const { subject, html } = ticketPriorityChangedTemplate(ticket, oldPriority, newPriority);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [ticket.requester_email],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Error sending priority update email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

export async function sendTicketStatusChangedEmail(
  ticket: Ticket,
  oldStatus: string,
  newStatus: string
) {
  const { subject, html } = ticketStatusChangedTemplate(
    ticket,
    oldStatus,
    newStatus
  );

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [ticket.requester_email],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Error sending status update email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}
