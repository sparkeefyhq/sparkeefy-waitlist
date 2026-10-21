import { verifyAdminCookie } from "../../actions";
import { db } from "@/lib/db/client";

/** CSV of every email on /admin (signups + backup list), admin only. */
export async function GET() {
  if (!(await verifyAdminCookie())) return new Response("Unauthorized", { status: 401 });
  const { rows } = await db.listAllEmails({});
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = ["email,source,signed_up_at_utc,referrals"];
  for (const r of rows) lines.push([r.email, r.source, r.at ? r.at.toISOString() : "", String(r.referrals)].map(cell).join(","));
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sparkeefy-all-emails-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
