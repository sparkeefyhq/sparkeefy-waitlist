/**
 * Referral Link Construction and Parsing
 * 
 * Utilities for building and parsing referral links.
 * Handles URL construction with referral codes and extraction.
 * 
 * @module utils/links
 */

import { isValidReferralCodeFormat } from "./generators";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Referral Query Parameter Name
 * The query parameter used in referral links
 */
export const REFERRAL_QUERY_PARAM = "ref";

/**
 * Default Frontend URL
 * Fallback if FRONTEND_URL environment variable not set
 */
const DEFAULT_FRONTEND_URL = "http://localhost:3000";

// ============================================================================
// LINK CONSTRUCTION
// ============================================================================

/**
 * Build Referral Link
 * 
 * Constructs a complete referral URL with the referral code.
 * Uses FRONTEND_URL environment variable as base.
 * 
 * @param {string} referralCode - 8-character referral code
 * @returns {string} Complete referral URL
 * 
 * @example
 * const link = buildReferralLink("ABC12XYZ");
 * console.log(link); // "https://app.com?ref=ABC12XYZ"
 * 
 * @throws {Error} If referral code format is invalid
 */
export function buildReferralLink(referralCode: string): string {
  // Validate referral code format
  if (!isValidReferralCodeFormat(referralCode)) {
    throw new Error(
      `Invalid referral code format: ${referralCode}. Must be 8 alphanumeric characters.`
    );
  }

  // Get base URL from environment
  const baseUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;

  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  // Construct URL with query parameter
  return `${cleanBaseUrl}?${REFERRAL_QUERY_PARAM}=${referralCode}`;
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
  reddit: string;
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

    // Reddit
    reddit: `https://reddit.com/submit?url=${encodedLink}&title=${encodedMessage}`,

    // Email
    email: `mailto:?subject=${encodedMessage}&body=${encodedMessage}%20${encodedLink}`,

    // Copy (frontend will implement copy-to-clipboard)
    copy: referralLink,
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
  return process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
}

/**
 * Validate Base URL Configuration
 * 
 * Checks if FRONTEND_URL environment variable is properly configured.
 * 
 * @returns {{ valid: boolean; url: string; error?: string }}
 * 
 * @example
 * const validation = validateBaseUrlConfig();
 * if (!validation.valid) {
 *   console.warn("FRONTEND_URL not configured:", validation.error);
 * }
 */
export function validateBaseUrlConfig(): {
  valid: boolean;
  url: string;
  error?: string;
} {
  const url = process.env.FRONTEND_URL;

  if (!url) {
    return {
      valid: false,
      url: DEFAULT_FRONTEND_URL,
      error: "FRONTEND_URL environment variable not set. Using default.",
    };
  }

  try {
    new URL(url);
    return { valid: true, url };
  } catch (error) {
    return {
      valid: false,
      url: DEFAULT_FRONTEND_URL,
      error: `Invalid FRONTEND_URL: ${url}. Using default.`,
    };
  }
}

/**
 * Log Link Configuration
 * 
 * Logs link configuration for debugging.
 * Only runs in development mode.
 * 
 * @example
 * logLinkConfig(); // Logs in development only
 */
export function logLinkConfig(): void {
  if (process.env.NODE_ENV !== "production") {
    const validation = validateBaseUrlConfig();
    console.log("🔗 Referral Link Configuration:", {
      baseUrl: validation.url,
      queryParam: REFERRAL_QUERY_PARAM,
      configured: validation.valid,
      warning: validation.error,
    });
  }
}