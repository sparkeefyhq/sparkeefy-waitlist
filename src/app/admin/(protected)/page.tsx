import { redirect } from "next/navigation";
import { getAdminSignupData, getAdminBackupList, deleteSignup } from "../actions";
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

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; bpage?: string }>;
}) {
  const params = await searchParams;
  const [data, backup] = await Promise.all([
    getAdminSignupData(Number(params.page) || 1),
    getAdminBackupList(Number(params.bpage) || 1),
  ]);
  if (!data || !backup) {
    redirect("/admin/login");
  }

  const { users, totalSignups, totalReferrals, signupsLast7Days } = data;
  const unsentCount = data.bulkUnsent;
  const sentCount = data.welcomeSent;

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

      {data.syntheticSignups > 0 && (
        <p className="text-sm text-muted-foreground">
          Synthetic scenario data: {data.syntheticSignups} synthetic signups and{" "}
          {data.syntheticReferrals} referrals in this database are excluded from the numbers
          above and never emailed.
        </p>
      )}

      {/* Bulk send bar */}
      {totalSignups > 0 && (
        <section className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {unsentCount > 0
              ? `${unsentCount} user${unsentCount === 1 ? "" : "s"} haven't received the welcome email yet`
              : "All users have received the welcome email"}
          </p>
          <SendAllEmailsButton unsentCount={unsentCount} />
        </section>
      )}

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
              <th className="px-4 py-3 font-medium text-center">Welcome email</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                  No sign-ups yet
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
                      <SendEmailButton userId={row.id} email={row.email} />
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

      {data.pageCount > 1 && (
        <nav className="flex items-center justify-between text-sm text-muted-foreground">
          {data.page > 1 ? <a href={`/admin?page=${data.page - 1}`}>← Newer</a> : <span />}
          <span>
            Page {data.page} of {data.pageCount}
          </span>
          {data.page < data.pageCount ? <a href={`/admin?page=${data.page + 1}`}>Older →</a> : <span />}
        </nav>
      )}

      {backup.total > 0 && (
        <>
          <h2 className="pt-4 text-xl font-semibold">Backup list</h2>
          <p className="text-sm text-muted-foreground">
            {backup.total} emails and {backup.referralTotal} referrals from the 21 Oct backup file.
            Listed separately: not included in the numbers above and never emailed.
          </p>
          <section className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">Referrals</th>
                  <th className="px-4 py-3 font-medium">Signed up (backup)</th>
                </tr>
              </thead>
              <tbody>
                {backup.rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={i % 2 === 0 ? "border-b border-border" : "border-b border-border bg-muted/20"}
                  >
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3 text-right">{row.backupReferralCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.backupSignedUpAt ? formatDate(row.backupSignedUpAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {backup.pageCount > 1 && (
            <nav className="flex items-center justify-between text-sm text-muted-foreground">
              {backup.page > 1 ? (
                <a href={`/admin?page=${data.page}&bpage=${backup.page - 1}`}>← Newer</a>
              ) : (
                <span />
              )}
              <span>
                Page {backup.page} of {backup.pageCount}
              </span>
              {backup.page < backup.pageCount ? (
                <a href={`/admin?page=${data.page}&bpage=${backup.page + 1}`}>Older →</a>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
