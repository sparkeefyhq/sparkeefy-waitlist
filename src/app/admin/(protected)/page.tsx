import { redirect } from "next/navigation";
import { getAdminSignupData, deleteSignup, sendReferralPushAction } from "../actions";
import type { AdminSignupRow } from "../actions";
import { SendEmailButton } from "@/components/admin/SendEmailButton";
import { SendAllEmailsButton } from "@/components/admin/SendAllEmailsButton";

function formatDate(d: Date): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(s: string | null, max: number): string {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max) + "…";
}

function displayName(row: AdminSignupRow): string {
  const parts = [row.firstName, row.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

const SOURCE_LABELS: Record<string, string> = {
  organic: "Organic",
  historical_import: "Restored",
  synthetic_seed: "Synthetic",
};

function pageHref(params: { page?: number; q?: string; source?: string | null }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.source) sp.set("source", params.source);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const data = await getAdminSignupData({
    page: Number(sp.page) || 1,
    query: sp.q,
    source: sp.source,
  });
  if (!data) {
    redirect("/admin/login");
  }

  const { users, stats, page, pageCount, matching, query, source } = data;
  const { totalSignups, totalReferrals, signupsLast7Days } = stats;
  const unsentCount = stats.bulkUnsent;
  const sentCount = stats.welcomeSent;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sign-ups</h1>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total signups</p>
          <p className="text-2xl font-semibold">{totalSignups}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total referrals</p>
          <p className="text-2xl font-semibold">{totalReferrals}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Last 7 days</p>
          <p className="text-2xl font-semibold">{signupsLast7Days}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Welcome emails</p>
          <p className="text-2xl font-semibold">
            {sentCount}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {totalSignups}
            </span>
          </p>
        </div>
      </section>

      {stats.syntheticSignups > 0 && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Synthetic scenario data: {stats.syntheticSignups} synthetic signups and{" "}
          {stats.syntheticReferrals} referrals are excluded from the numbers above
          (including them: {totalSignups + stats.syntheticSignups} signups,{" "}
          {totalReferrals + stats.syntheticReferrals} referrals). Not real users; never emailed.
        </p>
      )}

      {/* Bulk send bar */}
      {totalSignups > 0 && (
        <section className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {unsentCount > 0
              ? `${unsentCount} user${unsentCount === 1 ? "" : "s"} haven't received the welcome email yet`
              : "All users have received the welcome email"}
            {stats.heldImport > 0 &&
              ` · ${stats.heldImport} restored signup${stats.heldImport === 1 ? "" : "s"} held (send individually)`}
          </p>
          <SendAllEmailsButton unsentCount={unsentCount} />
        </section>
      )}

      {/* Referral push bar */}
      {totalSignups > 0 && (
        <section className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {stats.referralPushPending > 0
              ? `Referral email: ${stats.referralPushPending} opted-in user${stats.referralPushPending === 1 ? "" : "s"} not yet invited to share (sends 100 per click)`
              : "Referral email: every opted-in user has been invited to share"}
          </p>
          <SendAllEmailsButton
            unsentCount={stats.referralPushPending}
            action={sendReferralPushAction}
            label="Send referral email"
            doneLabel="Referral email sent to everyone eligible"
          />
        </section>
      )}

      <form method="get" action="/admin" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search email, name or username"
          className="h-9 w-72 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select
          name="source"
          defaultValue={source ?? ""}
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md border border-border px-3 text-sm hover:bg-muted">
          Filter
        </button>
        <span className="text-sm text-muted-foreground">{matching} matching</span>
      </form>

      <section className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Referral code</th>
              <th className="px-4 py-3 font-medium text-right">Referrals</th>
              <th className="px-4 py-3 font-medium">Marketing</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium text-center">Welcome email</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">
                  {query || source ? "No matching sign-ups" : "No sign-ups yet"}
                </td>
              </tr>
            ) : (
              users.map((row, i) => (
                <tr
                  key={row.id}
                  className={
                    i % 2 === 0
                      ? "border-b border-border"
                      : "border-b border-border bg-muted/20"
                  }
                >
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{displayName(row)}</td>
                  <td className="px-4 py-3">{row.username ?? "—"}</td>
                  <td className="px-4 py-3">{row.phoneNumber ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.referralCode}</td>
                  <td className="px-4 py-3 text-right">{row.referralCount}</td>
                  <td className="px-4 py-3">{row.marketingOptIn ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-muted-foreground">
                    {truncate(row.additionalRemarks, 50)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {SOURCE_LABELS[row.dataSource ?? "organic"] ?? row.dataSource}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.isSynthetic ? (
                      <span className="text-xs text-muted-foreground">Suppressed</span>
                    ) : row.welcomeEmailSentAt ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-green-600"
                        title={`Sent ${formatDate(row.welcomeEmailSentAt)}`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z" />
                        </svg>
                        Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        {row.welcomeEmailStatus === "held_import" && (
                          <span className="text-xs text-muted-foreground">Held</span>
                        )}
                        <SendEmailButton userId={row.id} email={row.email} />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteSignup}>
                      <input type="hidden" name="id" value={row.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {pageCount > 1 && (
        <nav className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <a className="hover:underline" href={pageHref({ page: page - 1, q: query, source })}>
              ← Newer
            </a>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <a className="hover:underline" href={pageHref({ page: page + 1, q: query, source })}>
              Older →
            </a>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
