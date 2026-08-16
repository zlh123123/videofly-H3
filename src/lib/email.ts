import { render } from "@react-email/render";
import type { ReactNode } from "react";

import { env } from "@/lib/auth/env.mjs";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 15_000;

interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  react: ReactNode;
  headers?: Record<string, string>;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

/**
 * Send a React email through Resend's HTTP API.
 *
 * Resend can return an API error without the SDK throwing, so this transport
 * explicitly checks the HTTP response before an auth request is reported as
 * successful.
 */
export async function sendEmail({
  from,
  to,
  subject,
  react,
  headers,
}: SendEmailParams): Promise<{ id: string }> {
  const html = await render(react);
  const text = await render(react, { plainText: true });

  let response: Response;
  try {
    response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        headers,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error("Could not connect to the email service", { cause: error });
  }

  const result = (await response.json().catch(() => ({}))) as ResendResponse;
  if (!response.ok || !result.id) {
    const detail = result.message || result.name || response.statusText;
    throw new Error(
      `Email service rejected the request (${response.status}): ${detail}`
    );
  }

  return { id: result.id };
}
