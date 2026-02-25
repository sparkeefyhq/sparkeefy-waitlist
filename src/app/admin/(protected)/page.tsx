import { redirect } from "next/navigation";
import { getAdminSignupData, deleteSignup } from "../actions";
import type { AdminSignupRow } from "../actions";

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

function name(row: AdminSignupRow): string {
  const parts = [row.firstName, row.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

export default async function AdminDashboardPage() {
  const data = await getAdminSignupData();
  if (!data) {
    redirect("/admin/login");
  }

  const { users, totalSignups, totalReferrals, signupsLast7Days } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sign-ups</h1>

      <section className="grid gap-4 sm:grid-cols-3">
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
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[800px] text-left text-sm">
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
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
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
                  <td className="px-4 py-3">{name(row)}</td>
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
    </div>
  );
}
