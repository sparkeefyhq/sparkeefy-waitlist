/**
 * Sync welcome_email_sent_at from Resend API into the database.
 *
 * Lists sent emails from Resend (welcome subject), matches recipients to
 * waitlist users, and sets welcome_email_sent_at to the email's created_at
 * for users who don't already have it set.
 *
 * Usage (from repo root):
 *   npm run sync-welcome-sent
 *
 * Loads .env from the project root via dotenv. Requires RESEND_API_KEY and DATABASE_URL.
 */

import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const WELCOME_SUBJECT = "You're in - welcome to Sparkeefy Early Access";
const LIST_LIMIT = 100;

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Missing RESEND_API_KEY");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const { Resend } = await import("resend");
  const { db } = await import("../src/lib/db/client");

  const resend = new Resend(apiKey);

  // 1) Paginate through Resend and collect welcome emails by recipient
  const sentToDate = new Map<string, Date>();
  let after: string | undefined;
  let totalFetched = 0;

  console.log("Fetching sent emails from Resend (subject: welcome)...");
  while (true) {
    const result = await resend.emails.list({
      limit: LIST_LIMIT,
      ...(after && { after }),
    });

    if (result.error) {
      console.error("Resend list error:", result.error.message);
      process.exit(1);
    }

    const payload = result.data;
    const emails = payload?.data ?? [];
    const hasMore = payload?.has_more ?? false;

    for (const email of emails) {
      if (email.subject !== WELCOME_SUBJECT) continue;
      const to = email.to?.[0];
      if (to && email.created_at) {
        sentToDate.set(to.toLowerCase(), new Date(email.created_at));
      }
    }

    totalFetched += emails.length;
    if (emails.length === 0 || !hasMore) break;
    after = emails[emails.length - 1].id;
  }

  console.log(`Found ${sentToDate.size} welcome emails in Resend (from ${totalFetched} total).`);

  // 2) Get waitlist users without welcome_email_sent_at
  const users = await db.listWaitlistUsers();
  const unsent = users.filter((u) => !u.welcomeEmailSentAt);
  console.log(`${unsent.length} waitlist users have no welcome_email_sent_at.`);

  // 3) Update DB for users we have a Resend sent date for
  let updated = 0;
  for (const user of unsent) {
    const sentAt = sentToDate.get(user.email.toLowerCase());
    if (sentAt) {
      await db.markWelcomeEmailSent(user.id, sentAt);
      updated++;
      console.log(`  Updated ${user.email} -> ${sentAt.toISOString()}`);
    }
  }

  console.log(`Done. Updated ${updated} record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
