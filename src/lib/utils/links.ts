/**
 * Referral Link Construction and Parsing
 * 
 * Utilities for building and parsing referral links.
 * Handles URL construction with referral codes and extraction.
 * 
 * @module utils/links
 */

import { isValidReferralCodeFormat } from "./generators";
import { siteUrl } from "../config/waitlist.config";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Referral Query Parameter Name
 * The query parameter used in referral links
 */
export const REFERRAL_QUERY_PARAM = "ref";

// ============================================================================
// LINK CONSTRUCTION
// ============================================================================

/**
 * Path for the join/waitlist page where ref is read by the form
 */
const JOIN_PATH = "/join";

/**
 * Build Referral Link
 *
 * Returns a relative URL so it works on any origin (localhost, production, etc.).
 *
 * @param {string} referralCode - 8-character referral code
 * @returns {string} Relative referral URL (e.g. /join?ref=ABC12XYZ)
 *
 * @throws {Error} If referral code format is invalid
 */
export function buildReferralLink(referralCode: string): string {
  if (!isValidReferralCodeFormat(referralCode)) {
    throw new Error(
      `Invalid referral code format: ${referralCode}. Must be 8 alphanumeric characters.`
    );
  }

  return `${JOIN_PATH}?${REFERRAL_QUERY_PARAM}=${referralCode}`;
}

/**
 * Build absolute referral URL for emails (uses siteUrl from config).
 */
export function buildAbsoluteReferralLink(referralCode: string): string {
  const cleanBaseUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  return `${cleanBaseUrl}${buildReferralLink(referralCode)}`;
}

/**
 * Build Magic Link URL
 * 
 * Constructs a permanent authentication link for email delivery.
 * Link never expires and can be reused to generate new sessions.
 * 
 * @param {string} magicLinkToken - User's unique 64-char magic link token
 * @returns {string} Full magic link URL with token parameter
 * 
 * @example
 * const url = buildMagicLinkUrl("a3f5b2c1d4e6f7g8...");
 * // Returns: "https://sparkeefy.com/join/referral?token=a3f5b2c1d4e6f7g8..."
 *
 * @throws {Error} If magicLinkToken is not 64 characters
 */
export function buildMagicLinkUrl(magicLinkToken: string): string {
  if (!magicLinkToken || magicLinkToken.length !== 64) {
    throw new Error(
      `Invalid magic link token format: ${magicLinkToken}. Must be 64 hex characters.`
    );
  }

  const cleanBaseUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;

  // Point directly at referral page so email links land there (no separate auth/magic page)
  return `${cleanBaseUrl}/join/referral?token=${magicLinkToken}`;
}

/**
 * Extract Magic Link Token from URL
 * 
 * Parses magic link URL and extracts the token parameter.
 * 
 * @param {string} url - Full URL or query string
 * @returns {string | null} Extracted token or null if invalid
 * 
 * @example
 * extractMagicLinkToken("https://app.com/join/referral?token=abc...");
 * // Returns: "abc..."
 */
export function extractMagicLinkToken(url: string): string | null {
  if (!url) return null;

  try {
    let urlObj: URL;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      urlObj = new URL(url);
    } else if (url.startsWith("?")) {
      urlObj = new URL(`http://sparkeefy.com${url}`);
    } else {
      return null;
    }

    const token = urlObj.searchParams.get("token");

    // Validate token format (64 hex characters)
    if (token && /^[a-f0-9]{64}$/i.test(token)) {
      return token;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Build Referral Links in Bulk
 * 
 * Constructs multiple referral links at once.
 * 
 * @param {string[]} referralCodes - Array of referral codes
 * @returns {string[]} Array of complete referral URLs
 * 
 * @example
 * const links = buildReferralLinks(["ABC12XYZ", "DEF45UVW"]);
 * console.log(links); // ["https://app.com?ref=ABC12XYZ", "https://app.com?ref=DEF45UVW"]
 */
export function buildReferralLinks(referralCodes: string[]): string[] {
  return referralCodes.map(buildReferralLink);
}

// ============================================================================
// LINK PARSING
// ============================================================================

/**
 * Extract Referral Code from URL
 * 
 * Extracts referral code from full URL or query string.
 * Handles both full URLs and referral codes directly.
 * 
 * @param {string} input - Full URL, query string, or referral code
 * @returns {string | null} Referral code or null if not found
 * 
 * @example
 * extractReferralCode("https://app.com?ref=ABC12XYZ"); // "ABC12XYZ"
 * extractReferralCode("?ref=ABC12XYZ"); // "ABC12XYZ"
 * extractReferralCode("ABC12XYZ"); // "ABC12XYZ"
 * extractReferralCode("https://app.com"); // null
 */
export function extractReferralCode(input: string): string | null {
  if (!input) return null;

  // If input is already a valid referral code, return it
  if (isValidReferralCodeFormat(input)) {
    return input;
  }

  try {
    // Try parsing as URL
    let url: URL;

    if (input.startsWith("http://") || input.startsWith("https://")) {
      // Full URL
      url = new URL(input);
    } else if (input.startsWith("?")) {
      // Query string only
      url = new URL(`http://dummy.com${input}`);
    } else {
      // Invalid format
      return null;
    }

    // Extract referral code from query parameter
    const code = url.searchParams.get(REFERRAL_QUERY_PARAM);

    // Validate extracted code
    if (code && isValidReferralCodeFormat(code)) {
      return code;
    }

    return null;
  } catch (error) {
    // URL parsing failed, return null
    return null;
  }
}

/**
 * Extract Referral Code from Request URL
 * 
 * Convenience function for extracting referral code from Express request.
 * 
 * @param {string} requestUrl - Full request URL from Express (req.url or req.originalUrl)
 * @returns {string | null} Referral code or null
 * 
 * @example
 * const code = extractReferralCodeFromRequest(req.originalUrl);
 */
export function extractReferralCodeFromRequest(
  requestUrl: string
): string | null {
  return extractReferralCode(requestUrl);
}

// ============================================================================
// LINK VALIDATION
// ============================================================================

/**
 * Validate Referral Link
 * 
 * Checks if a URL is a valid referral link.
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid referral link
 * 
 * @example
 * isValidReferralLink("https://app.com?ref=ABC12XYZ"); // true
 * isValidReferralLink("https://app.com"); // false
 * isValidReferralLink("invalid"); // false
 */
export function isValidReferralLink(url: string): boolean {
  const code = extractReferralCode(url);
  return code !== null;
}

/**
 * Check if URL has Referral Code
 * 
 * Checks if a URL contains a referral code parameter.
 * 
 * @param {string} url - URL to check
 * @returns {boolean} True if URL has referral code
 * 
 * @example
 * hasReferralCode("https://app.com?ref=ABC12XYZ"); // true
 * hasReferralCode("https://app.com"); // false
 */
export function hasReferralCode(url: string): boolean {
  return extractReferralCode(url) !== null;
}

// ============================================================================
// LINK MODIFICATION
// ============================================================================

/**
 * Add Referral Code to URL
 * 
 * Adds or replaces referral code in an existing URL.
 * 
 * @param {string} url - Base URL
 * @param {string} referralCode - Referral code to add
 * @returns {string} URL with referral code
 * 
 * @example
 * addReferralCodeToUrl("https://app.com", "ABC12XYZ");
 * // "https://app.com?ref=ABC12XYZ"
 * 
 * addReferralCodeToUrl("https://app.com?existing=param", "ABC12XYZ");
 * // "https://app.com?existing=param&ref=ABC12XYZ"
 */
export function addReferralCodeToUrl(
  url: string,
  referralCode: string
): string {
  if (!isValidReferralCodeFormat(referralCode)) {
    throw new Error("Invalid referral code format");
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set(REFERRAL_QUERY_PARAM, referralCode);
    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Remove Referral Code from URL
 * 
 * Removes referral code parameter from URL.
 * 
 * @param {string} url - URL with referral code
 * @returns {string} URL without referral code
 * 
 * @example
 * removeReferralCodeFromUrl("https://app.com?ref=ABC12XYZ");
 * // "https://app.com"
 */
export function removeReferralCodeFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete(REFERRAL_QUERY_PARAM);
    return urlObj.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

// ============================================================================
// SOCIAL MEDIA SHARING HELPERS
// ============================================================================

/**
 * Build Sharing Links for Social Platforms
 * 
 * Generates platform-specific sharing URLs with the referral link.
 * Frontend will use these to construct share buttons.
 * 
 * @param {string} referralLink - Complete referral link
 * @param {string} message - Optional sharing message
 * @returns {object} Platform-specific share URLs
 * 
 * @example
 * const shareLinks = buildSharingLinks(referralLink, "Join our waitlist!");
 * console.log(shareLinks.whatsapp); // WhatsApp share URL
 * console.log(shareLinks.twitter); // Twitter share URL
 * 
 * @note Frontend will implement actual share buttons using these URLs
 */
export function buildSharingLinks(
  referralLink: string,
  message: string = "Join our waitlist!"
): {
  whatsapp: string;
  linkedin: string;
  twitter: string;
  email: string;
  copy: string;
} {
  const encodedLink = encodeURIComponent(referralLink);
  const encodedMessage = encodeURIComponent(message);

  return {
    // WhatsApp
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,

    // LinkedIn
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,

    // Twitter/X
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,

    // Email
    email: `mailto:?subject=${encodedMessage}&body=${encodedMessage}%20${encodedLink}`,

    // Copy (frontend will implement copy-to-clipboard)
    copy: referralLink,
  };
}

export type ReferralShareService =
  | "instagram"
  | "whatsapp"
  | "snapchat"
  | "discord"
  | "linkedin"
  | "x";

export interface ReferralSharePayload {
  message: string;
  url: string;
  text: string;
  links: Record<ReferralShareService, string | null>;
  nativeSharePreferredServices: ReferralShareService[];
}

const DEFAULT_REFERRAL_SHARE_MESSAGE =
  "I just joined Sparkeefy early access. Use my referral link to join:";

/**
 * Build sharing payload for referral page actions.
 *
 * Returns a normalized set of links and native-share preferences so the UI can
 * decide the best interaction per platform and device.
 */
export function buildReferralSharePayload(
  referralLink: string,
  message: string = DEFAULT_REFERRAL_SHARE_MESSAGE
): ReferralSharePayload {
  const encodedLink = encodeURIComponent(referralLink);
  const encodedMessage = encodeURIComponent(message);
  const encodedText = encodeURIComponent(`${message} ${referralLink}`);

  return {
    message,
    url: referralLink,
    text: `${message} ${referralLink}`,
    links: {
      // Instagram has no reliable web intent for pre-filled share content.
      instagram: null,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      // Snapchat web sharing is inconsistent; native sheet is preferred.
      snapchat: null,
      // Discord has no prefilled web compose endpoint.
      discord: "https://discord.com/channels/@me",
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
      x: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    },
    nativeSharePreferredServices: ["instagram", "snapchat"],
  };
}

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * Get Base URL from Environment
 * 
 * Returns the configured frontend URL.
 * 
 * @returns {string} Frontend base URL
 * 
 * @example
 * const baseUrl = getBaseUrl();
 * console.log(baseUrl); // "https://app.sparkeefy.com"
 */
export function getBaseUrl(): string {
  return siteUrl;
}
