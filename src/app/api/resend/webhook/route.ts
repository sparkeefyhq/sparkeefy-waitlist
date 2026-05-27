import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db/client";

const WELCOME_SUBJECT = "You're in - welcome to Sparkeefy Early Access";

export const dynamic = "force-dynamic"; // Always evaluate webhooks

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    subject?: string;
    to?: string[];
    email_id?: string;
    created_at?: string;
  };
};

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Missing RESEND_API_KEY or RESEND_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  // Important: verify using the raw body (no JSON parsing).
  const payload = await req.text();

  let event: ResendWebhookEvent;
  try {
    const result = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    });

    event = result as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook" }, { status: 400 });
  }

  const eventType = event.type;
  const subject = event.data?.subject;

  // Ignore unrelated emails
  if (!eventType || subject !== WELCOME_SUBJECT) {
    return NextResponse.json({ ok: true });
  }

  const recipientEmails = event.data?.to ?? [];

  // Prefer the timestamp embedded in the data; fall back to the top-level created_at.
  const sentAtRaw = event.data?.created_at ?? event.created_at;
  const sentAt = sentAtRaw ? new Date(sentAtRaw) : new Date();

  // Update all matching recipients (normally exactly one).
  for (const recipient of recipientEmails) {
    const user = await db.findUserByEmail(recipient);
    if (!user) continue;

    if (eventType === "email.sent") {
      await db.markWelcomeEmailSent(user.id, sentAt);
    } else if (eventType === "email.failed") {
      // Ensure failures (including quota/limit reached) never show as "Sent" in the admin dashboard.
      if (user.welcomeEmailSentAt) {
        await db.updateUser(user.id, { welcomeEmailSentAt: null });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

