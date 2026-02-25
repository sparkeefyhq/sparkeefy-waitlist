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
import type { WaitlistUser } from "@/lib/types";

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

export type AdminSignupRow = WaitlistUser & { referralCount: number };

export type AdminSignupData = {
  users: AdminSignupRow[];
  totalSignups: number;
  totalReferrals: number;
  signupsLast7Days: number;
};

export async function getAdminSignupData(): Promise<AdminSignupData | null> {
  const ok = await verifyAdminCookie();
  if (!ok) return null;

  const users = await db.listWaitlistUsers();
  const totalReferrals = await db.countAllReferrals();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const rows: AdminSignupRow[] = [];
  let signupsLast7Days = 0;
  for (const user of users) {
    const count = await db.countUserReferrals(user.id);
    const created = user.createdAt instanceof Date ? user.createdAt.getTime() : new Date(user.createdAt).getTime();
    if (created >= sevenDaysAgo) signupsLast7Days++;
    rows.push({ ...user, referralCount: count });
  }

  return {
    users: rows,
    totalSignups: rows.length,
    totalReferrals,
    signupsLast7Days,
  };
}

export async function deleteSignup(formData: FormData): Promise<void> {
  const ok = await verifyAdminCookie();
  if (!ok) redirect("/admin/login");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await db.deleteUser(id);
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

  const users = await db.listWaitlistUsers();
  const unsent = users.filter((u) => !u.welcomeEmailSentAt);

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
