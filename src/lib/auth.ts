/**
 * Authentication Utilities for Server Actions
 *
 * Provides token-based authentication. Validates magic link tokens
 * passed via URL query params or form data. No sessions or cookies.
 *
 * @module lib/auth
 */

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
export async function getUserFromToken(
  token: string | null | undefined
): Promise<WaitlistUser | null> {
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
