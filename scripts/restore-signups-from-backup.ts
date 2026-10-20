/**
 * Restore deleted waitlist signups from a backup file.
 *
 * Reads a CSV/text file with one email per line (an optional "Email" header
 * row is ignored), skips anything invalid or already in waitlist_users, and
 * creates the rest the same way the signup flow does (unique referral code +
 * magic link token). No emails are sent; restored users show up in /admin as
 * "welcome email not sent".
 *
 * Usage (from repo root):
 *   npm run restore-signups -- path/to/backup.csv           # dry run
 *   npm run restore-signups -- path/to/backup.csv --apply   # write to DB
 *
 * Loads .env from the project root via dotenv. Requires DATABASE_URL.
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("Usage: restore-signups <backup.csv> [--apply]");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  const { db, disconnectDatabase } = await import("../src/lib/db/client");
  const { validateAndSanitizeEmail } = await import("../src/lib/utils/validators");
  const {
    generateReferralCode,
    generateMagicLinkToken,
    generateUniqueCode,
  } = await import("../src/lib/utils/generators");

  // 1) Parse and normalize emails from the backup
  const lines = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.split(",")[0].trim().replace(/^"|"$/g, ""))
    .filter((l) => l && l.toLowerCase() !== "email");

  const emails = new Set<string>();
  const invalid: string[] = [];
  for (const line of lines) {
    const result = validateAndSanitizeEmail(line);
    if (result.valid && result.email) emails.add(result.email);
    else invalid.push(line);
  }
  console.log(`Read ${lines.length} row(s): ${emails.size} unique valid, ${invalid.length} invalid.`);
  for (const e of invalid) console.log(`  Invalid: ${e}`);

  // 2) Skip emails that are already on the waitlist
  const toRestore: string[] = [];
  for (const email of emails) {
    if (!(await db.findUserByEmail(email))) toRestore.push(email);
  }
  console.log(`${emails.size - toRestore.length} already on the waitlist, ${toRestore.length} to restore.`);

  if (!apply) {
    console.log("Dry run - nothing written. Re-run with --apply to restore.");
    await disconnectDatabase();
    return;
  }

  // 3) Create the missing users
  let restored = 0;
  let failed = 0;
  for (const email of toRestore) {
    try {
      const referralCode = await generateUniqueCode(
        generateReferralCode,
        async (code: string) => !!(await db.findUserByReferralCode(code)),
        5
      );
      await db.createUser({
        email,
        referralCode,
        magicLinkToken: await generateMagicLinkToken(),
      });
      restored++;
    } catch (err) {
      failed++;
      console.error(`  Failed ${email}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done. Restored ${restored}, failed ${failed}.`);
  await disconnectDatabase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
