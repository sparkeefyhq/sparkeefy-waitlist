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
import type { AdminSignupRow, BackupListRow } from "@/lib/db/client";

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

export type { AdminSignupRow } from "@/lib/db/client";

/** Rows per admin page (backend pagination). */
const ADMIN_PAGE_SIZE = 100;
/** Upper bound for the bulk welcome send. */
const ADMIN_MAX_ROWS = 20000;

export type AdminSignupData = {
  users: AdminSignupRow[];
  totalSignups: number;
  totalReferrals: number;
  signupsLast7Days: number;
  /** Welcome emails: sent / real signups; synthetic rows are excluded (suppressed). */
  welcomeSent: number;
  bulkUnsent: number;
  syntheticSignups: number;
  syntheticReferrals: number;
  page: number;
  pageCount: number;
};

/** One page of signups plus dashboard metrics, computed in SQL (no per-user queries). */
export async function getAdminSignupData(requestedPage = 1): Promise<AdminSignupData | null> {
  const ok = await verifyAdminCookie();
  if (!ok) return null;

  const page = Math.max(1, Math.floor(requestedPage) || 1);
  const [stats, list] = await Promise.all([
    db.getAdminStats(),
    db.listAdminSignups({ limit: ADMIN_PAGE_SIZE, offset: (page - 1) * ADMIN_PAGE_SIZE }),
  ]);

  return {
    users: list.rows,
    totalSignups: stats.totalSignups,
    totalReferrals: stats.totalReferrals,
    signupsLast7Days: stats.signupsLast7Days,
    welcomeSent: stats.welcomeSent,
    bulkUnsent: stats.bulkUnsent,
    syntheticSignups: stats.syntheticSignups,
    syntheticReferrals: stats.syntheticReferrals,
    page,
    pageCount: Math.max(1, Math.ceil(list.total / ADMIN_PAGE_SIZE)),
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

export type BulkEmailResult = {
  total: number;
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
  const unsent = await db.listBulkWelcomeEligible(ADMIN_MAX_ROWS);

  const result: BulkEmailResult = {
    total: unsent.length,
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

  revalidatePath("/admin");
  return { success: true, data: result };
}

export type AdminBackupListData = {
  rows: BackupListRow[];
  total: number;
  referralTotal: number;
  page: number;
  pageCount: number;
};

/** One page of the backup list (separate from signups; see 0002_backup_list.sql). */
export async function getAdminBackupList(requestedPage = 1): Promise<AdminBackupListData | null> {
  const ok = await verifyAdminCookie();
  if (!ok) return null;
  const page = Math.max(1, Math.floor(requestedPage) || 1);
  const list = await db.listBackupList({ limit: ADMIN_PAGE_SIZE, offset: (page - 1) * ADMIN_PAGE_SIZE });
  return { ...list, page, pageCount: Math.max(1, Math.ceil(list.total / ADMIN_PAGE_SIZE)) };
}
