"use server";

/**
 * Admin server actions: login, logout, signup data, and welcome-email sending.
 * All admin-specific logic lives here; no middleware.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { db } from "@/lib/db/client";
import { emailService } from "@/lib/services/EmailService";
import { buildMagicLinkUrl, buildAbsoluteReferralLink } from "@/lib/utils/links";
import type { AdminSignupRow, AdminStats } from "@/lib/db/client";

const ADMIN_COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getExpectedCookieValue(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return "";
  return createHash("sha256").update(secret).digest("hex");
}

export async function verifyAdminCookie(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE_NAME)?.value;
  const expected = getExpectedCookieValue();
  return !!expected && value === expected;
}

export async function loginAdmin(formData: FormData): Promise<{ error?: string }> {
  const password = formData.get("password");
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return { error: "Admin not configured" };
  }
  if (typeof password !== "string" || password !== secret) {
    return { error: "Invalid password" };
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, getExpectedCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAdmin(): Promise<never> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

export type { AdminSignupRow, AdminStats } from "@/lib/db/client";

const ADMIN_PAGE_SIZE = 50;
const SOURCES = ["organic", "historical_import", "synthetic_seed"] as const;

export type AdminSignupData = {
  users: AdminSignupRow[];
  stats: AdminStats;
  page: number;
  pageCount: number;
  matching: number;
  query: string;
  source: string | null;
};

/** One page of signups plus dashboard metrics, all computed in SQL. */
export async function getAdminSignupData(params: {
  page?: number;
  query?: string;
  source?: string;
} = {}): Promise<AdminSignupData | null> {
  const ok = await verifyAdminCookie();
  if (!ok) return null;

  const query = (params.query ?? "").trim().slice(0, 100);
  const source = SOURCES.find((s) => s === params.source) ?? null;
  const page = Math.max(1, Math.floor(params.page ?? 1));

  const [stats, list] = await Promise.all([
    db.getAdminStats(),
    db.listAdminSignups({
      limit: ADMIN_PAGE_SIZE,
      offset: (page - 1) * ADMIN_PAGE_SIZE,
      query: query || undefined,
      source: source ?? undefined,
    }),
  ]);

  return {
    users: list.rows,
    stats,
    page,
    pageCount: Math.max(1, Math.ceil(list.total / ADMIN_PAGE_SIZE)),
    matching: list.total,
    query,
    source,
  };
}

export async function deleteSignup(formData: FormData): Promise<void> {
  const ok = await verifyAdminCookie();
  if (!ok) redirect("/admin/login");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  // Archived first (waitlist_deletions), so a delete can always be undone.
  await db.deleteUserWithArchive(id);
  redirect("/admin");
}

// ============================================================================
// WELCOME EMAIL ACTIONS
// ============================================================================

export async function sendWelcomeEmailAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const ok = await verifyAdminCookie();
  if (!ok) return { success: false, error: "Unauthorized" };

  if (!emailService.isConfigured) {
    return {
      success: false,
      error: "Email not configured. Set RESEND_API_KEY in your environment.",
    };
  }

  const user = await db.findUserById(userId);
  if (!user) return { success: false, error: "User not found" };
  if (user.isSynthetic) {
    return { success: false, error: "Synthetic test row: emails are suppressed" };
  }

  try {
    await emailService.sendWelcomeEmail({
      email: user.email,
      magicLinkUrl: buildMagicLinkUrl(user.magicLinkToken),
      referralCode: user.referralCode,
      referralLink: buildAbsoluteReferralLink(user.referralCode),
    });

    await db.markWelcomeEmailSent(user.id);
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send email";
    return { success: false, error: message };
  }
}

/** Per click, to stay well inside the serverless request time limit. */
const BULK_SEND_LIMIT = 100;

export type BulkEmailResult = {
  total: number;
  remaining: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
};

export async function sendAllWelcomeEmailsAction(): Promise<
  { success: boolean; data?: BulkEmailResult; error?: string }
> {
  const ok = await verifyAdminCookie();
  if (!ok) return { success: false, error: "Unauthorized" };

  if (!emailService.isConfigured) {
    return {
      success: false,
      error: "Email not configured. Set RESEND_API_KEY in your environment.",
    };
  }

  // Only organic, real, never-emailed users; restored and synthetic rows are excluded.
  const unsent = await db.listBulkWelcomeEligible(BULK_SEND_LIMIT);

  const result: BulkEmailResult = {
    total: unsent.length,
    remaining: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const user of unsent) {
    try {
      await emailService.sendWelcomeEmail({
        email: user.email,
        magicLinkUrl: buildMagicLinkUrl(user.magicLinkToken),
        referralCode: user.referralCode,
        referralLink: buildAbsoluteReferralLink(user.referralCode),
      });
      await db.markWelcomeEmailSent(user.id);
      result.sent++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        email: user.email,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  result.remaining = (await db.getAdminStats()).bulkUnsent;
  revalidatePath("/admin");
  return { success: true, data: result };
}
