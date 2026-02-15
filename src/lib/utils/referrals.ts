/**
 * Referral Counting Helpers
 * 
 * Utility functions for referral counting, validation, and statistics.
 * Provides helpers for the ReferralService to use.
 * 
 * @module utils/referrals
 */

import type { Referral } from "../types";

// ============================================================================
// REFERRAL VALIDATION
// ============================================================================

/**
 * Validate Referral Relationship
 * 
 * Checks if referral relationship is valid.
 * Prevents self-referrals and other invalid scenarios.
 * 
 * @param {string} referrerId - ID of user who referred
 * @param {string} refereeId - ID of user who was referred
 * @returns {{ valid: boolean; error?: string }}
 * 
 * @example
 * const validation = validateReferralRelationship(userId1, userId2);
 * if (!validation.valid) {
 *   throw new Error(validation.error);
 * }
 */
export function validateReferralRelationship(
  referrerId: string,
  refereeId: string
): { valid: boolean; error?: string } {
  // Prevent self-referral
  if (referrerId === refereeId) {
    return {
      valid: false,
      error: "Cannot refer yourself",
    };
  }

  // Check for empty IDs
  if (!referrerId || !refereeId) {
    return {
      valid: false,
      error: "Referrer ID and referee ID are required",
    };
  }

  return { valid: true };
}

// ============================================================================
// REFERRAL COUNTING
// ============================================================================

/**
 * Count Referrals from Array
 * 
 * Counts referrals for a specific user from an array of referral records.
 * Useful for in-memory filtering without database queries.
 * 
 * @param {Referral[]} referrals - Array of referral records
 * @param {string} userId - User ID to count referrals for
 * @returns {number} Number of referrals
 * 
 * @example
 * const count = countReferralsFromArray(allReferrals, userId);
 * console.log(count); // 7
 */
export function countReferralsFromArray(
  referrals: Referral[],
  userId: string
): number {
  return referrals.filter((r) => r.referrerId === userId).length;
}

/**
 * Group Referrals by Referrer
 * 
 * Groups referral records by referrer ID.
 * Returns a map of referrer ID to array of their referrals.
 * 
 * @param {Referral[]} referrals - Array of referral records
 * @returns {Map<string, Referral[]>} Map of referrer ID to referrals
 * 
 * @example
 * const grouped = groupReferralsByReferrer(allReferrals);
 * console.log(grouped.get(userId1)); // [referral1, referral2, ...]
 */
export function groupReferralsByReferrer(
  referrals: Referral[]
): Map<string, Referral[]> {
  const grouped = new Map<string, Referral[]>();

  for (const referral of referrals) {
    const existing = grouped.get(referral.referrerId) || [];
    existing.push(referral);
    grouped.set(referral.referrerId, existing);
  }

  return grouped;
}

/**
 * Get Referral Counts
 * 
 * Calculates referral counts for multiple users at once.
 * More efficient than counting individually.
 * 
 * @param {Referral[]} referrals - Array of referral records
 * @returns {Map<string, number>} Map of user ID to referral count
 * 
 * @example
 * const counts = getReferralCounts(allReferrals);
 * console.log(counts.get(userId)); // 7
 */
export function getReferralCounts(
  referrals: Referral[]
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const referral of referrals) {
    const current = counts.get(referral.referrerId) || 0;
    counts.set(referral.referrerId, current + 1);
  }

  return counts;
}

// ============================================================================
// REFERRAL CHAIN ANALYSIS
// ============================================================================

/**
 * Get Referral Chain
 * 
 * Traces the referral chain for a user (who referred them, who referred that person, etc.).
 * Returns array of user IDs in chain order.
 * 
 * @param {Referral[]} allReferrals - All referral records
 * @param {string} userId - User to start tracing from
 * @param {number} maxDepth - Maximum chain depth (default: 10)
 * @returns {string[]} Array of user IDs in referral chain
 * 
 * @example
 * const chain = getReferralChain(allReferrals, userId);
 * console.log(chain); // [userId, referrerId, referrersReferrerId, ...]
 */
export function getReferralChain(
  allReferrals: Referral[],
  userId: string,
  maxDepth: number = 10
): string[] {
  const chain: string[] = [userId];
  let currentUserId = userId;
  let depth = 0;

  while (depth < maxDepth) {
    // Find who referred the current user
    const referral = allReferrals.find((r) => r.refereeId === currentUserId);

    if (!referral) break; // No more referrers in chain

    chain.push(referral.referrerId);
    currentUserId = referral.referrerId;
    depth++;
  }

  return chain;
}

/**
 * Calculate Chain Depth
 * 
 * Calculates how deep a user is in the referral chain.
 * Depth 0 = original user (not referred by anyone)
 * Depth 1 = referred by original user
 * 
 * @param {Referral[]} allReferrals - All referral records
 * @param {string} userId - User to calculate depth for
 * @returns {number} Chain depth
 * 
 * @example
 * const depth = calculateChainDepth(allReferrals, userId);
 * console.log(depth); // 2 (two levels deep in referral chain)
 */
export function calculateChainDepth(
  allReferrals: Referral[],
  userId: string
): number {
  const chain = getReferralChain(allReferrals, userId);
  return chain.length - 1; // Subtract 1 because chain includes the user themselves
}

// ============================================================================
// REFERRAL STATISTICS
// ============================================================================

/**
 * Calculate Referral Statistics
 * 
 * Calculates comprehensive statistics for a user's referrals.
 * 
 * @param {Referral[]} userReferrals - User's referral records
 * @returns {object} Referral statistics
 * 
 * @example
 * const stats = calculateReferralStats(userReferrals);
 * console.log(stats);
 * // {
 * //   total: 10,
 * //   firstReferralDate: Date,
 * //   lastReferralDate: Date,
 * //   averageInterval: 86400000 (ms)
 * // }
 */
export function calculateReferralStats(userReferrals: Referral[]): {
  total: number;
  firstReferralDate: Date | null;
  lastReferralDate: Date | null;
  averageInterval: number | null;
} {
  if (userReferrals.length === 0) {
    return {
      total: 0,
      firstReferralDate: null,
      lastReferralDate: null,
      averageInterval: null,
    };
  }

  // Sort by date
  const sorted = [...userReferrals].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  const firstReferral = sorted[0]!;
  const lastReferral = sorted[sorted.length - 1]!;

  // Calculate average interval between referrals
  let averageInterval: number | null = null;
  if (sorted.length > 1) {
    const totalTime =
      lastReferral.createdAt.getTime() - firstReferral.createdAt.getTime();
    averageInterval = totalTime / (sorted.length - 1);
  }

  return {
    total: userReferrals.length,
    firstReferralDate: firstReferral.createdAt,
    lastReferralDate: lastReferral.createdAt,
    averageInterval,
  };
}

/**
 * Get Top Referrers
 * 
 * Returns list of top referrers sorted by referral count.
 * 
 * @param {Referral[]} allReferrals - All referral records
 * @param {number} limit - Number of top referrers to return (default: 10)
 * @returns {Array<{ userId: string; count: number }>} Top referrers
 * 
 * @example
 * const topReferrers = getTopReferrers(allReferrals, 5);
 * console.log(topReferrers);
 * // [{ userId: "...", count: 25 }, { userId: "...", count: 18 }, ...]
 */
export function getTopReferrers(
  allReferrals: Referral[],
  limit: number = 10
): Array<{ userId: string; count: number }> {
  const counts = getReferralCounts(allReferrals);

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Check if Referral Exists
 * 
 * Checks if a specific referral relationship already exists.
 * Prevents duplicate referral credits.
 * 
 * @param {Referral[]} allReferrals - All referral records
 * @param {string} referrerId - Referrer ID
 * @param {string} refereeId - Referee ID
 * @returns {boolean} True if referral exists
 * 
 * @example
 * if (referralExists(allReferrals, userId1, userId2)) {
 *   throw new Error("Referral already exists");
 * }
 */
export function referralExists(
  allReferrals: Referral[],
  referrerId: string,
  refereeId: string
): boolean {
  return allReferrals.some(
    (r) => r.referrerId === referrerId && r.refereeId === refereeId
  );
}

/**
 * Find Duplicate Referrals
 * 
 * Finds any duplicate referral relationships in the database.
 * Used for data integrity checks.
 * 
 * @param {Referral[]} allReferrals - All referral records
 * @returns {Array<{ referrerId: string; refereeId: string; count: number }>} Duplicates
 * 
 * @example
 * const duplicates = findDuplicateReferrals(allReferrals);
 * if (duplicates.length > 0) {
 *   console.error("Database integrity issue: duplicate referrals found");
 * }
 */
export function findDuplicateReferrals(
  allReferrals: Referral[]
): Array<{ referrerId: string; refereeId: string; count: number }> {
  const pairs = new Map<string, number>();

  for (const referral of allReferrals) {
    const key = `${referral.referrerId}:${referral.refereeId}`;
    pairs.set(key, (pairs.get(key) || 0) + 1);
  }

  const duplicates: Array<{ referrerId: string; refereeId: string; count: number }> = [];

  for (const [key, count] of pairs.entries()) {
    if (count > 1) {
      const [referrerId, refereeId] = key.split(":");
      duplicates.push({ referrerId: referrerId!, refereeId: refereeId!, count });
    }
  }

  return duplicates;
}

// ============================================================================
// TIME-BASED FILTERING
// ============================================================================

/**
 * Filter Referrals by Date Range
 * 
 * Returns referrals within a specific date range.
 * 
 * @param {Referral[]} referrals - Referral records
 * @param {Date} startDate - Start date (inclusive)
 * @param {Date} endDate - End date (inclusive)
 * @returns {Referral[]} Filtered referrals
 * 
 * @example
 * const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 * const recent = filterReferralsByDateRange(allReferrals, lastWeek, new Date());
 */
export function filterReferralsByDateRange(
  referrals: Referral[],
  startDate: Date,
  endDate: Date
): Referral[] {
  return referrals.filter(
    (r) => r.createdAt >= startDate && r.createdAt <= endDate
  );
}

/**
 * Get Recent Referrals
 * 
 * Returns referrals from the last N days.
 * 
 * @param {Referral[]} referrals - Referral records
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Referral[]} Recent referrals
 * 
 * @example
 * const lastWeekReferrals = getRecentReferrals(allReferrals, 7);
 */
export function getRecentReferrals(
  referrals: Referral[],
  days: number = 7
): Referral[] {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return referrals.filter((r) => r.createdAt >= cutoffDate);
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Format Referral for Export
 * 
 * Formats referral data for CSV export or reporting.
 * 
 * @param {Referral} referral - Referral to format
 * @returns {object} Formatted referral data
 * 
 * @example
 * const formatted = formatReferralForExport(referral);
 * // { referrerId: "...", refereeId: "...", createdAt: "2026-01-17T12:00:00Z" }
 */
export function formatReferralForExport(referral: Referral): {
  referrerId: string;
  refereeId: string;
  createdAt: string;
} {
  return {
    referrerId: referral.referrerId,
    refereeId: referral.refereeId,
    createdAt: referral.createdAt.toISOString(),
  };
}

/**
 * Format Referrals for Bulk Export
 * 
 * Formats multiple referrals for export.
 * 
 * @param {Referral[]} referrals - Referrals to format
 * @returns {Array<object>} Formatted referrals
 */
export function formatReferralsForExport(referrals: Referral[]): Array<{
  referrerId: string;
  refereeId: string;
  createdAt: string;
}> {
  return referrals.map(formatReferralForExport);
}