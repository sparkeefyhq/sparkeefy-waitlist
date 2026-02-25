/**
 * Global TypeScript Type Definitions
 * 
 * Central type definitions and interfaces for the entire waitlist application.
 * Ensures type consistency across services, server actions, and components.
 * 
 * @module types
 */

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

/**
 * Waitlist User Entity
 * Represents a user who has joined the waitlist
 * Maps to `waitlist_users` database table
 */
export interface WaitlistUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  marketingOptIn: boolean;
  additionalRemarks: string | null;
  referralCode: string;
  magicLinkToken: string;
  welcomeEmailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Referral Entity
 * Represents a referral relationship between two users
 * Maps to `referrals` database table
 */
export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  createdAt: Date;
}

// ============================================================================
// TIER SYSTEM TYPES
// ============================================================================

/**
 * User Tier Levels
 * Determines rewards based on referral count
 */
export type TierType = "normal" | "1month" | "3months" | "founder";

/**
 * Tier Threshold Configuration
 * Defines referral count ranges for each tier
 */
export interface TierThreshold {
  tier: TierType;
  minReferrals: number;
  maxReferrals: number | null; // null = unlimited
  label: string;
  description: string;
}

/**
 * Tier Information
 * Detailed information about a user's current tier
 */
export interface TierInfo {
  tier: TierType;
  label: string;
  description: string;
  minReferrals: number;
  maxReferrals: number | null;
}

/**
 * Join Waitlist Input
 * Input for joining the waitlist
 */
export interface JoinWaitlistInput {
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  marketingOptIn?: boolean;
  additionalRemarks?: string | null;
  referralCode?: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Waitlist Join Response
 * Returned when user successfully joins waitlist
 */
export interface WaitlistJoinResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    marketingOptIn: boolean;
    additionalRemarks: string | null;
    referralCode: string;
    referralLink: string;
    magicLinkUrl: string;
    magicLinkToken: string;
    actualReferralCount: number;
    displayReferralCount: number;
    tier: TierType;
    tierLabel: string;
    createdAt: string; // ISO8601
    updatedAt: string; // ISO8601
  };
  newReferralCreated?: boolean;
  message: string;
}

/**
 * User Statistics Response
 * Returned by getMyStats procedure
 */
export interface UserStatsResponse {
  user: {
    id: string;
    email: string;
    username: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    marketingOptIn?: boolean;
    additionalRemarks?: string | null;
    referralCode: string;
    referralLink?: string;
    createdAt: string;
    updatedAt?: string;
  };
  referralStats: {
    actualReferralCount: number;
    displayReferralCount: number;
    tier: TierType;
    tierLabel: string;
    tierDescription?: string;
    nextTierAt?: number | null;
    nextTierLabel?: string;
  };
  sessionExpiresAt?: string;
  referralLink?: string;
}

/**
 * Referral Code Validation Response
 * Returned by validateReferralCode procedure
 */
export interface ReferralCodeValidationResponse {
  valid: boolean;
  referrerEmail?: string;
  message?: string;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

/**
 * Waitlist Service Create User Input
 * Parameters for creating a new waitlist user
 */
export interface CreateUserInput {
  referralCode: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  marketingOptIn?: boolean;
  additionalRemarks?: string | null;
  magicLinkToken: string;
}

/**
 * Referral Count Result
 * Result of counting user referrals
 */
export interface ReferralCountResult {
  userId: string;
  count: number;
  tier: TierType;
  displayCount: number;
}

// ============================================================================
// SLACK ACCESS SURVEY TYPES
// ============================================================================

export interface SlackAccessSurvey {
  userId: string;
  q1Answer: string;
  q2Answer: string | null;
  submittedAt: Date;
  updatedAt: Date;
}

export interface SlackAccessInput {
  q1Answer: string;
  q2Answer: string;
}

export interface SlackAccessResponse {
  success: boolean;
  submitted: boolean;
  q1Answer?: string;
  q2Answer?: string;
  submittedAt?: string;
  message: string;
}

// ============================================================================
// UTILITY TYPE HELPERS
// ============================================================================

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for WaitlistUser
 */
export function isWaitlistUser(obj: any): obj is WaitlistUser {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.referralCode === "string" &&
    typeof obj.magicLinkToken === "string"
  );
}

/**
 * Type guard for TierType
 */
export function isTierType(value: any): value is TierType {
  return ["normal", "1month", "3months", "founder"].includes(value);
}
