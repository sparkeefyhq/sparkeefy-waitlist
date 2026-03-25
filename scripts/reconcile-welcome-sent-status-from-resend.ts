/**
 * Reconcile welcome_email_sent_at against Resend.
 *
 * Intended use:
 * - If your app previously marked some users as "sent" even though Resend
 *   returned a quota/limit error, this script can correct the dashboard
 *   by clearing welcome_email_sent_at when no corresponding Resend email
 *   exists.
 *
 * Usage (from repo root):
 *   npm run reconcile-welcome-sent
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

  const { db } = await import("../src/lib/db/client");
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  // 1) Fetch all welcome emails from Resend and map by recipient email.
  const sentToDate = new Map<string, Date>();
  let after: string | undefined;
  let totalFetched = 0;

  console.log(`Fetching Resend welcome emails (subject: ${WELCOME_SUBJECT})...`);
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

  console.log(
    `Found ${sentToDate.size} welcome recipients in Resend (from ${totalFetched} total).`
  );

  // 2) Find users that are marked as sent in the DB but are missing from Resend.
  const users = await db.listWaitlistUsers();
  const mismatch = users.filter((u) => !!u.welcomeEmailSentAt && !sentToDate.has(u.email.toLowerCase()));

  console.log(
    `Found ${mismatch.length} DB records marked as sent but missing in Resend.`
  );

  let cleared = 0;
  for (const user of mismatch) {
    await db.updateUser(user.id, { welcomeEmailSentAt: null });
    cleared++;
    console.log(`  Cleared ${user.email}`);
  }

  console.log(`Done. Cleared ${cleared} record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

