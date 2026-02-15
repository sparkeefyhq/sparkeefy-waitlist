import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getStatsByToken } from "@/app/actions";
import ReferralDisplay from "@/components/waitlist/ReferralDisplay";
import WaitlistLayout from "@/components/waitlist/WaitlistLayout";

/**
 * Referral Page - Server Component
 * 
 * Fetches user stats server-side using magic link token.
 * No loading states needed - data is ready on initial render.
 */
export default async function ReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Await searchParams (required in Next.js 15+)
  const params = await searchParams;
  const token = params.token;

  // Redirect if no token or invalid format
  if (!token || token.length !== 64) {
    redirect("/join");
  }

  // Fetch stats server-side
  const stats = await getStatsByToken(token);

  // Redirect if token is invalid/expired
  if (!stats) {
    redirect("/join");
  }

  // Pass data to client component for interactive elements
  return (
    <Suspense
      fallback={
        <WaitlistLayout variant="referral">
          <div className="flex items-center justify-center min-h-[200px] text-white/60">
            Loading...
          </div>
        </WaitlistLayout>
      }
    >
      <ReferralDisplay stats={stats} token={token} />
    </Suspense>
  );
}
