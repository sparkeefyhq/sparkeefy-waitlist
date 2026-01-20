/**
 * Tier Calculation Logic
 * 
 * Manages user tier assignment based on referral count.
 * Implements reward system: normal → 1month → 3months → founder
 * 
 * @module utils/tiers
 */

import type { TierType, TierInfo, TierThreshold } from "../types";

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

/**
 * Tier Thresholds
 * Defines referral count ranges for each tier
 */
export const TIER_THRESHOLDS: readonly TierThreshold[] = [
  {
    tier: "normal",
    minReferrals: 0,
    maxReferrals: 2,
    label: "Waitlist Member",
    description: "You've joined the waitlist! Start referring to unlock rewards.",
  },
  {
    tier: "1month",
    minReferrals: 3,
    maxReferrals: 5,
    label: "1 Month Pro Free",
    description: "Great work! Enjoy 1 month of Pro features when we launch.",
  },
  {
    tier: "3months",
    minReferrals: 6,
    maxReferrals: 9,
    label: "3 Months Pro Free",
    description: "Incredible! You've earned 3 months of Pro features.",
  },
  {
    tier: "founder",
    minReferrals: 10,
    maxReferrals: null, // Unlimited
    label: "Founder's Table",
    description: "Amazing! You're part of our exclusive Founder's Table with lifetime benefits.",
  },
] as const;

/**
 * Progress Bar Display Limit
 * UI shows progress up to this number, but continues tracking beyond
 */
export const PROGRESS_BAR_MAX = 10;

// ============================================================================
// TIER CALCULATION
// ============================================================================

/**
 * Calculate User Tier
 * 
 * Determines tier based on referral count.
 * 
 * @param {number} referralCount - Number of successful referrals
 * @returns {TierType} Current tier
 * 
 * @example
 * calculateTier(0); // "normal"
 * calculateTier(4); // "1month"
 * calculateTier(7); // "3months"
 * calculateTier(15); // "founder"
 */
export function calculateTier(referralCount: number): TierType {
  if (referralCount >= 10) return "founder";
  if (referralCount >= 6) return "3months";
  if (referralCount >= 3) return "1month";
  return "normal";
}

/**
 * Get Tier Information
 * 
 * Returns detailed information about a tier.
 * 
 * @param {TierType} tier - Tier to get info for
 * @returns {TierInfo} Tier details
 * 
 * @example
 * const info = getTierInfo("3months");
 * console.log(info.label); // "3 Months Pro Free"
 */
export function getTierInfo(tier: TierType): TierInfo {
  const threshold = TIER_THRESHOLDS.find((t) => t.tier === tier);

  if (!threshold) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  return {
    tier: threshold.tier,
    label: threshold.label,
    description: threshold.description,
    minReferrals: threshold.minReferrals,
    maxReferrals: threshold.maxReferrals,
  };
}

/**
 * Get Next Tier Threshold
 * 
 * Returns the referral count needed to reach next tier.
 * Returns null if already at maximum tier (founder).
 * 
 * @param {number} currentReferralCount - Current referral count
 * @returns {number | null} Referrals needed for next tier
 * 
 * @example
 * getNextTierThreshold(0); // 3 (need 3 for 1month)
 * getNextTierThreshold(4); // 6 (need 6 for 3months)
 * getNextTierThreshold(15); // null (already at founder)
 */
export function getNextTierThreshold(currentReferralCount: number): number | null {
  if (currentReferralCount >= 10) return null; // Already at founder tier
  if (currentReferralCount >= 6) return 10; // Need 10 for founder
  if (currentReferralCount >= 3) return 6; // Need 6 for 3months
  return 3; // Need 3 for 1month
}

/**
 * Get Display Referral Count
 * 
 * Returns referral count capped at PROGRESS_BAR_MAX for UI display.
 * Progress bar shows max 10, even if actual count is higher.
 * 
 * @param {number} actualCount - Actual referral count
 * @returns {number} Capped count for display (max 10)
 * 
 * @example
 * getDisplayReferralCount(5); // 5
 * getDisplayReferralCount(15); // 10 (capped)
 */
export function getDisplayReferralCount(actualCount: number): number {
  return Math.min(actualCount, PROGRESS_BAR_MAX);
}

/**
 * Get Progress Percentage
 * 
 * Calculates progress percentage for current tier.
 * Used for progress bar visualization.
 * 
 * @param {number} referralCount - Current referral count
 * @returns {number} Progress percentage (0-100)
 * 
 * @example
 * getProgressPercentage(0); // 0 (0/3 to next tier)
 * getProgressPercentage(2); // 66 (2/3 to next tier)
 * getProgressPercentage(15); // 100 (at max tier)
 */
export function getProgressPercentage(referralCount: number): number {
  const currentTier = calculateTier(referralCount);
  const tierInfo = getTierInfo(currentTier);

  // If at founder tier, always 100%
  if (currentTier === "founder") return 100;

  const nextThreshold = getNextTierThreshold(referralCount);
  if (!nextThreshold) return 100;

  const tierStart = tierInfo.minReferrals;
  const tierRange = nextThreshold - tierStart;
  const progress = referralCount - tierStart;

  return Math.round((progress / tierRange) * 100);
}

/**
 * Get Remaining Referrals for Next Tier
 * 
 * Calculates how many more referrals needed for next tier.
 * 
 * @param {number} currentReferralCount - Current referral count
 * @returns {number | null} Referrals remaining (null if at max tier)
 * 
 * @example
 * getRemainingReferrals(0); // 3
 * getRemainingReferrals(4); // 2 (need 6 total, have 4)
 * getRemainingReferrals(15); // null (at max tier)
 */
export function getRemainingReferrals(currentReferralCount: number): number | null {
  const nextThreshold = getNextTierThreshold(currentReferralCount);

  if (!nextThreshold) return null;

  return nextThreshold - currentReferralCount;
}

// ============================================================================
// TIER COMPARISON
// ============================================================================

/**
 * Compare Tiers
 * 
 * Determines if tier1 is higher than tier2.
 * 
 * @param {TierType} tier1 - First tier
 * @param {TierType} tier2 - Second tier
 * @returns {number} 1 if tier1 > tier2, -1 if tier1 < tier2, 0 if equal
 * 
 * @example
 * compareTiers("founder", "1month"); // 1 (founder > 1month)
 * compareTiers("normal", "3months"); // -1 (normal < 3months)
 */
export function compareTiers(tier1: TierType, tier2: TierType): number {
  const tier1Info = getTierInfo(tier1);
  const tier2Info = getTierInfo(tier2);

  if (tier1Info.minReferrals > tier2Info.minReferrals) return 1;
  if (tier1Info.minReferrals < tier2Info.minReferrals) return -1;
  return 0;
}

/**
 * Check if Tier Upgraded
 * 
 * Determines if user upgraded to a higher tier.
 * 
 * @param {number} previousCount - Previous referral count
 * @param {number} newCount - New referral count
 * @returns {boolean} True if tier upgraded
 * 
 * @example
 * isTierUpgraded(2, 3); // true (normal → 1month)
 * isTierUpgraded(4, 5); // false (both 1month)
 */
export function isTierUpgraded(previousCount: number, newCount: number): boolean {
  const previousTier = calculateTier(previousCount);
  const newTier = calculateTier(newCount);

  return compareTiers(newTier, previousTier) > 0;
}

// ============================================================================
// MILESTONE DETECTION
// ============================================================================

/**
 * Key Milestones
 * Specific referral counts that trigger special events
 */
export const KEY_MILESTONES = [3, 5, 6, 10, 25, 50, 100] as const;

/**
 * Check if Milestone Reached
 * 
 * Determines if a key milestone was just reached.
 * 
 * @param {number} previousCount - Previous referral count
 * @param {number} newCount - New referral count
 * @returns {number | null} Milestone reached, or null
 * 
 * @example
 * getMilestoneReached(2, 3); // 3 (reached 3 referrals)
 * getMilestoneReached(3, 4); // null (no milestone)
 */
export function getMilestoneReached(
  previousCount: number,
  newCount: number
): number | null {
  for (const milestone of KEY_MILESTONES) {
    if (previousCount < milestone && newCount >= milestone) {
      return milestone;
    }
  }
  return null;
}

// ============================================================================
// TIER MESSAGES
// ============================================================================

/**
 * Get Tier Upgrade Message
 * 
 * Returns congratulatory message for tier upgrade.
 * 
 * @param {TierType} newTier - New tier achieved
 * @returns {string} Congratulations message
 * 
 * @example
 * getTierUpgradeMessage("1month");
 * // "Congratulations! You've unlocked 1 Month Pro Free!"
 */
export function getTierUpgradeMessage(newTier: TierType): string {
  const tierInfo = getTierInfo(newTier);

  switch (newTier) {
    case "1month":
      return `Congratulations! You've unlocked ${tierInfo.label}! 🎉`;
    case "3months":
      return `Amazing! You've reached ${tierInfo.label}! 🚀`;
    case "founder":
      return `Incredible! Welcome to the ${tierInfo.label}! 👑`;
    default:
      return `You're now at ${tierInfo.label}!`;
  }
}

/**
 * Get Next Tier Message
 * 
 * Returns motivational message about next tier.
 * 
 * @param {number} currentCount - Current referral count
 * @returns {string} Motivational message
 * 
 * @example
 * getNextTierMessage(1);
 * // "Refer 2 more people to unlock 1 Month Pro Free!"
 */
export function getNextTierMessage(currentCount: number): string {
  const remaining = getRemainingReferrals(currentCount);

  if (!remaining) {
    return "You're at the highest tier! Keep referring to support the community.";
  }

  const nextThreshold = getNextTierThreshold(currentCount);
  const nextTier = calculateTier(nextThreshold!);
  const nextTierInfo = getTierInfo(nextTier);

  return `Refer ${remaining} more ${remaining === 1 ? "person" : "people"} to unlock ${nextTierInfo.label}!`;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get All Tiers
 * 
 * Returns list of all available tiers.
 * 
 * @returns {TierInfo[]} Array of all tier information
 */
export function getAllTiers(): TierInfo[] {
  return TIER_THRESHOLDS.map((t) => ({
    tier: t.tier,
    label: t.label,
    description: t.description,
    minReferrals: t.minReferrals,
    maxReferrals: t.maxReferrals,
  }));
}

/**
 * Get Tier Statistics
 * 
 * Returns configuration and statistics about tier system.
 * 
 * @returns {object} Tier system statistics
 * 
 * @example
 * const stats = getTierStats();
 * console.log(stats.totalTiers); // 4
 */
export function getTierStats() {
  return {
    totalTiers: TIER_THRESHOLDS.length,
    progressBarMax: PROGRESS_BAR_MAX,
    tiers: getAllTiers(),
    milestones: [...KEY_MILESTONES],
  };
}