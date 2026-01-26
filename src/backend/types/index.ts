/**
 * Global TypeScript Type Definitions
 * 
 * Central type definitions and interfaces for the entire waitlist backend.
 * Ensures type consistency across services, procedures, and utilities.
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

import { Response } from 'express';

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
  sessionToken: string;
  sessionExpiresAt: Date;
  magicLinkToken: string;
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
 * SSE Connection
 * Active Server-Sent Events connection
 */
export interface SSEConnection {
  id: string;
  userId: string;
  response: Response;
  connectedAt: Date;
  lastActivity: Date;
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
// SESSION TYPES
// ============================================================================

/**
 * Session Configuration
 * Cookie and session management settings
 */
export interface SessionConfig {
  cookieName: string;
  maxAge: number; // in milliseconds
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
}

/**
 * Session Token Data
 * Information stored about a user session
 */
export interface SessionTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
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
// SSE (SERVER-SENT EVENTS) TYPES
// ============================================================================

/**
 * SSE Event Types
 * Different types of real-time events
 */
export type SSEEventType = "referral_credited" | "tier_upgraded" | "milestone_reached" | "connection_established" | "heartbeat" | "connected" | "referral_updated";

/**
 * SSE Event Payload
 * Base structure for all SSE events
 */
export interface SSEEvent<T = any> {
  type: SSEEventType;
  timestamp: string; // ISO8601
  data: T;
}

/**
 * Referral Credited Event Data
 * Sent when someone joins using user's referral link
 */
export interface ReferralCreditedEventData {
  actualReferralCount: number;
  displayReferralCount: number;
  tier: TierType;
  refereeEmail?: string;
  message?: string;
  previousCount?: number;
  newCount?: number;
  displayCount?: number;
}

/**
 * Tier Upgraded Event Data
 * Sent when user reaches new tier threshold
 */
export interface TierUpgradedEventData {
  previousTier: TierType;
  newTier: TierType;
  newTierLabel: string;
  referralCount: number;
  message: string;
}

/**
 * Milestone Reached Event Data
 * Sent when user reaches specific referral milestones
 */
export interface MilestoneReachedEventData {
  milestone: number;
  referralCount: number;
  totalReferrals?: number;
  tier?: TierType;
  message: string;
}

/**
 * Connection Established Event Data
 * Sent when SSE connection is first established
 */
export interface ConnectionEstablishedEventData {
  userId: string;
  currentReferralCount: number;
  tier: TierType;
  message: string;
}

/**
 * Heartbeat Event Data
 * Periodic keep-alive signal
 */
export interface HeartbeatEventData {
  timestamp: string; // ISO8601
  uptime: number; // seconds
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
  sessionToken: string;
  sessionExpiresAt: Date;
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
// UTILITY TYPES
// ============================================================================

/**
 * Pagination Options
 * For future paginated endpoints
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/**
 * Paginated Response
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Error Context
 * Additional context for error logging
 */
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  ipAddress?: string;
  procedure?: string;
  metadata?: Record<string, any>;
}

/**
 * Rate Limit Entry
 * Tracks rate limiting per IP address
 */
export interface RateLimitEntry {
  count: number;
  windowStart: number; // timestamp
  windowExpires: number; // timestamp
}

/**
 * Rate Limit Info
 * Information about current rate limit status
 */
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Application Configuration
 * Environment-based configuration
 */
export interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  port: number;
  host: string;
  databaseUrl: string;
  frontendUrl: string;
  corsOrigin: string | string[];
  sessionTtlDays: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  sentryDsn?: string;
  logLevel: "debug" | "info" | "warn" | "error";
  enableIpTracking: boolean;
}

/**
 * Database Configuration
 * Database connection and pool settings
 */
export interface DatabaseConfig {
  url: string;
  poolSize: number;
  maxIdleTime: number;
  queryTimeout: number;
  ssl: boolean;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

/**
 * Audit Event Type
 * Types of events that get logged for audit trail
 */
export type AuditEventType =
  | "user_joined"
  | "referral_created"
  | "tier_changed"
  | "session_created"
  | "session_expired"
  | "rate_limit_exceeded"
  | "authentication_failed";

/**
 * Audit Log Entry
 * Structured audit log for compliance and debugging
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  severity: "info" | "warn" | "error";
}

// ============================================================================
// HEALTH CHECK TYPES
// ============================================================================

/**
 * Health Check Status
 * System health status for monitoring
 */
export interface HealthCheckStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string; // ISO8601
  service: string;
  version: string;
  uptime: number; // seconds
  checks: {
    database: "ok" | "error";
    memory: "ok" | "warning" | "critical";
    [key: string]: string;
  };
}

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
    typeof obj.sessionToken === "string" &&
    typeof obj.magicLinkToken === "string" &&
    obj.sessionExpiresAt instanceof Date
  );
}

/**
 * Type guard for TierType
 */
export function isTierType(value: any): value is TierType {
  return ["normal", "1month", "3months", "founder"].includes(value);
}

/**
 * Type guard for SSEEventType
 */
export function isSSEEventType(value: any): value is SSEEventType {
  return [
    "referral_credited",
    "tier_upgraded",
    "milestone_reached",
    "connection_established",
    "heartbeat",
  ].includes(value);
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

/**
 * Deep Partial - makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep Readonly - makes all nested properties readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Re-export commonly used types for convenience
 */
export type {
  WaitlistUser as User,
  // Referral,
  // TierType,
  // SSEEvent,
  AppConfig as Config,
};