/**
 * Authentication Utilities for Server Actions
 * 
 * Provides authentication helpers for Next.js server components and actions.
 * Validates magic link tokens and retrieves user information.
 * 
 * @module lib/auth
 */

import { headers, cookies } from "next/headers";
import type { WaitlistUser } from "./types";
import { db } from "./db/client";
import { logger } from "./logging/logger";

/**
 * Get User from Token
 * 
 * Validates magic link token and returns user if valid.
 * 
 * @param token - Magic link token (64-char hex)
 * @returns User object or null if invalid
 */
export async function getUserFromToken(token: string | null | undefined): Promise<WaitlistUser | null> {
  if (!token || token.length !== 64) {
    return null;
  }

  try {
    const user = await db.findUserByMagicLinkToken(token);
    return user;
  } catch (error) {
    logger.error("Error validating magic link token", {
      error: error instanceof Error ? error.message : String(error),
      tokenPrefix: token.substring(0, 8) + "***",
    });
    return null;
  }
}

/**
 * Get Current User (Server Context)
 * 
 * Extracts token from headers/cookies and returns authenticated user.
 * Use in server components and server actions.
 * 
 * @returns User object or null if not authenticated
 * 
 * @example
 * // In a server component or action:
 * const user = await getCurrentUser();
 * if (!user) {
 *   throw new Error("Unauthorized");
 * }
 */
export async function getCurrentUser(): Promise<WaitlistUser | null> {
  try {
    // Try Authorization header first (Bearer token)
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await getUserFromToken(token);
      if (user) return user;
    }

    // Fall back to cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("magic_link_token");
    
    if (tokenCookie) {
      const user = await getUserFromToken(tokenCookie.value);
      if (user) return user;
    }

    return null;
  } catch (error) {
    logger.error("Error getting current user", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Require Auth (Server Action Helper)
 * 
 * Throws error if user is not authenticated.
 * Use at the start of protected server actions.
 * 
 * @returns Authenticated user
 * @throws Error if not authenticated
 * 
 * @example
 * export async function protectedAction() {
 *   "use server";
 *   const user = await requireAuth();
 *   // user is guaranteed to be non-null here
 * }
 */
export async function requireAuth(): Promise<WaitlistUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized - authentication required");
  }
  
  return user;
}

/**
 * Extract Token from Form Data
 * 
 * Helper to extract token from FormData (useful for form actions).
 * 
 * @param formData - FormData from form submission
 * @returns Token string or null
 */
export function extractTokenFromFormData(formData: FormData): string | null {
  const token = formData.get("token");
  return typeof token === "string" ? token : null;
}
