"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Magic link landing page (from email).
 * Reads ?token= from URL and redirects to referral page with token so the user sees their referral dashboard.
 */
export default function AuthMagicPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token && token.length === 64) {
      router.replace(`/join/referral?token=${encodeURIComponent(token)}`);
    } else {
      router.replace("/join");
    }
  }, [token, router]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-[rgb(13,13,13)]">
      <p className="text-white/80">Redirecting...</p>
    </div>
  );
}
