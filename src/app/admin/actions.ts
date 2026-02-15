"use server";

/**
 * Admin server actions: login, logout, and get signup data.
 * All admin-specific logic lives here; no middleware.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { db } from "@/lib/db/client";
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
