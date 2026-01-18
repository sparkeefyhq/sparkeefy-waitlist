/**
 * Waitlist tRPC Procedures
 * 
 * All waitlist-related API endpoints for the referral system MVP.
 * Includes join, stats retrieval, and referral code validation.
 * 
 * @module procedures/waitlist
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { t } from "../router";
import { requireAuth, rateLimit } from "../middleware";
import { WaitlistService } from "../../services/WaitlistService";
import { ReferralService } from "../../services/ReferralService";
import { SessionService } from "../../services/SessionService";
import { SSEManager } from "../../sse/SSEManager";
import { logger } from "../../logging/logger";
import { calculateTier, getTierInfo, getNextTierThreshold } from "../../utils/tiers";
import { buildReferralLink } from "../../utils/links";
import { db } from "../../db/client";
import type { 
  WaitlistJoinResponse, 
  UserStatsResponse, 
  ReferralCodeValidationResponse 
} from "../../types/index";

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * Join Waitlist Input Schema
 * Validates all inputs for waitlist.join procedure
 */
const joinWaitlistInput = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim()
    .max(255, "Email must be 255 characters or less"),

  username: z
    .string()
    .max(100, "Username must be 100 characters or less")
    .optional()
    .nullable(),

  firstName: z
    .string()
    .max(100, "First name must be 100 characters or less")
    .optional()
    .nullable(),

  lastName: z
    .string()
    .max(100, "Last name must be 100 characters or less")
    .optional()
    .nullable(),

  phoneNumber: z
    .string()
    .regex(/^[\d+\-\s()]{7,20}$/, "Invalid phone number format")
    .max(20, "Phone number must be 20 characters or less")
    .optional()
    .nullable(),

  marketingOptIn: z
    .boolean()
    .default(false),

  additionalRemarks: z
    .string()
    .max(500, "Remarks must be 500 characters or less")
    .optional()
    .nullable(),

  referralCode: z
    .string()
    .length(8, "Referral code must be exactly 8 characters")
    .regex(/^[A-Za-z0-9]{8}$/, "Referral code must be alphanumeric")
    .toUpperCase()
    .optional()
    .nullable(),
});

/**
 * Get My Stats Input Schema
 * No parameters required (authenticated via session)
 */
const getMyStatsInput = z.object({}).strict();

/**
 * Validate Referral Code Input Schema
 * Validates referral code format
 */
const validateReferralCodeInput = z.object({
  code: z
    .string({ required_error: "Referral code is required" })
    .length(8, "Referral code must be exactly 8 characters")
    .regex(/^[A-Za-z0-9]{8}$/, "Referral code must be alphanumeric")
    .toUpperCase(),
});

// ============================================================================
// TYPE INFERENCE FROM SCHEMAS
// ============================================================================

type JoinWaitlistInput = z.infer<typeof joinWaitlistInput>;
type GetMyStatsInput = z.infer<typeof getMyStatsInput>;
type ValidateReferralCodeInput = z.infer<typeof validateReferralCodeInput>;

// ============================================================================
// PROCEDURE 1: waitlist.join
// ============================================================================

/**
 * Join Waitlist Procedure
 * 
 * Primary endpoint for joining waitlist with optional referral tracking.
 * Handles both new signups and duplicate email scenarios.
 * 
 * @mutation
 * @public
 * @rateLimit 5 requests per IP per hour
 * @realtime Triggers SSE event if referral credited
 */
const join = t.procedure
  .use(rateLimit)
  .input(joinWaitlistInput)
  .mutation(async ({ input, ctx }): Promise<WaitlistJoinResponse> => {
    const startTime = Date.now();
    const requestId = ctx.requestId || "unknown";

    try {
      logger.info("Waitlist join attempt", {
        email: input.email.substring(0, 5) + "***",
        hasReferral: !!input.referralCode,
        requestId,
        ipAddress: ctx.ipAddress,
      });

      // Initialize services
      const waitlistService = new WaitlistService(db);
      const referralService = new ReferralService(db);
      const sessionService = new SessionService();
      const sseManager = new SSEManager();

      // Step 1: Check if email already exists
      const existingUser = await waitlistService.findUserByEmail(input.email);

      let user;
      let newReferralCreated = false;
      let message = "";

      if (existingUser) {
        // EMAIL EXISTS - Handle duplicate scenario
        user = existingUser;
        message = "User already exists";

        logger.info("Existing user detected", {
          userId: user.id,
          email: input.email.substring(0, 5) + "***",
          requestId,
        });

        // If referral code provided, attempt to create referral
        if (input.referralCode) {
          try {
            // Find referrer by code
            const referrer = await waitlistService.findUserByReferralCode(
              input.referralCode
            );

            if (!referrer) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Referral code not found",
              });
            }

            // Prevent self-referral
            if (referrer.id === user.id) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot refer yourself",
              });
            }

            // Check if referral already exists
            const existingReferral = await referralService.referralExists(
              referrer.id,
              user.id
            );

            if (existingReferral) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "You have already been referred by this user",
              });
            }

            // Create referral relationship
            await referralService.createReferral(referrer.id, user.id);
            newReferralCreated = true;

            // Get updated referral count for referrer
            const referralCount = await referralService.countUserReferrals(
              referrer.id
            );
            const tier = calculateTier(referralCount);
            const displayCount = Math.min(referralCount, 10);

            logger.info("Referral credited", {
              referrerId: referrer.id,
              refereeId: user.id,
              refereeEmail: input.email.substring(0, 5) + "***",
              newReferralCount: referralCount,
              newTier: tier,
              requestId,
            });

            // Broadcast SSE event to referrer's active connections
            sseManager.broadcastToUser(referrer.id, {
              type: "referral_credited",
              timestamp: new Date().toISOString(),
              data: {
                actualReferralCount: referralCount,
                displayReferralCount: displayCount,
                tier,
                refereeEmail: input.email,
                message: "New referral completed!",
              },
            });

            message = "Referral credited to existing user";
          } catch (error) {
            // Log referral error but don't fail the join
            if (error instanceof TRPCError) {
              throw error;
            }

            logger.error("Failed to create referral for existing user", {
              error: error instanceof Error ? error.message : String(error),
              userId: user.id,
              referralCode: input.referralCode,
              requestId,
            });

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to process referral",
              cause: error,
            });
          }
        }

        // Set session cookie for existing user (idempotent)
        sessionService.setSessionCookie(
          ctx.res!,
          user.sessionToken,
          ctx.req?.get("host")?.includes("localhost") ? false : true
        );
      } else {
        // NEW USER - Create waitlist entry
        try {
          // Create new user with all provided fields
          user = await waitlistService.createUser({
            email: input.email,
            username: input.username,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
            marketingOptIn: input.marketingOptIn ?? false,
            additionalRemarks: input.additionalRemarks,
            referralCode: undefined,
            sessionToken: undefined,
            sessionExpiresAt: undefined
          });

          message = "Successfully joined waitlist";

          logger.info("New user joined waitlist", {
            userId: user.id,
            email: input.email.substring(0, 5) + "***",
            referralCode: user.referralCode,
            hasMarketing: input.marketingOptIn,
            requestId,
          });

          // If referral code provided, create referral relationship
          if (input.referralCode) {
            try {
              const referrer = await waitlistService.findUserByReferralCode(
                input.referralCode
              );

              if (!referrer) {
                // Log warning but don't fail the join
                logger.warn("Referral code not found for new user", {
                  referralCode: input.referralCode,
                  userId: user.id,
                  requestId,
                });
              } else if (referrer.id === user.id) {
                logger.warn("Self-referral attempt detected", {
                  userId: user.id,
                  requestId,
                });
              } else {
                // Create referral
                await referralService.createReferral(referrer.id, user.id);
                newReferralCreated = true;

                // Get updated referral count
                const referralCount = await referralService.countUserReferrals(
                  referrer.id
                );
                const tier = calculateTier(referralCount);
                const displayCount = Math.min(referralCount, 10);

                logger.info("Referral credited for new user", {
                  referrerId: referrer.id,
                  refereeId: user.id,
                  refereeEmail: input.email.substring(0, 5) + "***",
                  newReferralCount: referralCount,
                  newTier: tier,
                  requestId,
                });

                // Broadcast SSE event to referrer
                sseManager.broadcastToUser(referrer.id, {
                  type: "referral_credited",
                  timestamp: new Date().toISOString(),
                  data: {
                    actualReferralCount: referralCount,
                    displayReferralCount: displayCount,
                    tier,
                    refereeEmail: input.email,
                    message: "New referral completed!",
                  },
                });

                message = "Successfully joined waitlist with referral";
              }
            } catch (error) {
              // Log error but don't fail the join
              logger.error("Failed to process referral for new user", {
                error: error instanceof Error ? error.message : String(error),
                userId: user.id,
                referralCode: input.referralCode,
                requestId,
              });
            }
          }

          // Set session cookie for new user
          sessionService.setSessionCookie(
            ctx.res!,
            user.sessionToken,
            ctx.req?.get("host")?.includes("localhost") ? false : true
          );
        } catch (error) {
          logger.error("Failed to create new user", {
            error: error instanceof Error ? error.message : String(error),
            email: input.email.substring(0, 5) + "***",
            requestId,
          });

          // Map database errors to user-friendly messages
          if (error instanceof Error) {
            if (error.message.includes("unique") || error.message.includes("duplicate")) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Email already joined waitlist",
              });
            }
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to join waitlist",
            cause: error,
          });
        }
      }

      // Calculate user's referral stats
      const actualReferralCount = await referralService.countUserReferrals(user.id);
      const displayReferralCount = Math.min(actualReferralCount, 10);
      const tier = calculateTier(actualReferralCount);
      const tierInfo = getTierInfo(tier);

      // Build referral link
      const referralLink = buildReferralLink(user.referralCode);

      const duration = Date.now() - startTime;

      logger.info("Waitlist join completed", {
        userId: user.id,
        newReferralCreated,
        tier,
        referralCount: actualReferralCount,
        duration: `${duration}ms`,
        requestId,
      });

      // Return complete response
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          marketingOptIn: user.marketingOptIn,
          additionalRemarks: user.additionalRemarks,
          referralCode: user.referralCode,
          referralLink,
          actualReferralCount,
          displayReferralCount,
          tier,
          tierLabel: tierInfo.label,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        newReferralCreated,
        message,
      };
    } catch (error) {
      // Re-throw tRPC errors as-is
      if (error instanceof TRPCError) {
        throw error;
      }

      // Log and wrap unexpected errors
      logger.error("Unexpected error in waitlist.join", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        cause: error,
      });
    }
  });

// ============================================================================
// PROCEDURE 2: waitlist.getMyStats
// ============================================================================

/**
 * Get My Stats Procedure
 * 
 * Retrieve authenticated user's referral statistics including count,
 * tier, and next milestone information.
 * 
 * @query
 * @protected Requires valid session
 * @realtime None (just returns current state)
 */
const getMyStats = t.procedure
  .use(requireAuth)
  .input(getMyStatsInput)
  .query(async ({ ctx }): Promise<UserStatsResponse> => {
    const startTime = Date.now();
    const requestId = ctx.requestId || "unknown";

    try {
      const user = ctx.user!; // Guaranteed by requireAuth middleware

      logger.debug("Stats retrieval request", {
        userId: user.id,
        email: user.email.substring(0, 5) + "***",
        requestId,
      });

      // Initialize services
      const referralService = new ReferralService(db);

      // Get referral count
      const actualReferralCount = await referralService.countUserReferrals(user.id);
      const displayReferralCount = Math.min(actualReferralCount, 10);

      // Calculate tier information
      const tier = calculateTier(actualReferralCount);
      const tierInfo = getTierInfo(tier);
      const nextTierAt = getNextTierThreshold(actualReferralCount);
      const nextTierLabel = nextTierAt ? getTierInfo(calculateTier(nextTierAt)).label : null;

      // Build referral link
      const referralLink = buildReferralLink(user.referralCode);

      const duration = Date.now() - startTime;

      logger.debug("Stats retrieved successfully", {
        userId: user.id,
        referralCount: actualReferralCount,
        tier,
        duration: `${duration}ms`,
        requestId,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          marketingOptIn: user.marketingOptIn,
          additionalRemarks: user.additionalRemarks,
          referralCode: user.referralCode,
          referralLink,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        referralStats: {
          actualReferralCount,
          displayReferralCount,
          tier,
          tierLabel: tierInfo.label,
          nextTierAt: nextTierAt ?? undefined,
          nextTierLabel: nextTierLabel ?? undefined,
        },
        sessionExpiresAt: user.sessionExpiresAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to retrieve stats", {
        error: error instanceof Error ? error.message : String(error),
        userId: ctx.user?.id,
        requestId,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve statistics",
        cause: error,
      });
    }
  });

// ============================================================================
// PROCEDURE 3: waitlist.validateReferralCode
// ============================================================================

/**
 * Validate Referral Code Procedure
 * 
 * Validate referral code existence; used by frontend for UX enhancement
 * (show "Valid code" before user enters email).
 * 
 * @query
 * @public
 * @realtime None
 */
const validateReferralCode = t.procedure
  .input(validateReferralCodeInput)
  .query(async ({ input, ctx }): Promise<ReferralCodeValidationResponse> => {
    const requestId = ctx.requestId || "unknown";

    try {
      logger.debug("Referral code validation request", {
        code: input.code,
        requestId,
      });

      // Initialize service
      const waitlistService = new WaitlistService(db);

      // Check if code exists
      const referrer = await waitlistService.findUserByReferralCode(input.code);

      if (referrer) {
        logger.debug("Referral code is valid", {
          code: input.code,
          referrerId: referrer.id,
          requestId,
        });

        return {
          valid: true,
          referrerEmail: referrer.email,
          message: "Referral code is valid",
        };
      } else {
        logger.debug("Referral code not found", {
          code: input.code,
          requestId,
        });

        return {
          valid: false,
          message: "Referral code not found",
        };
      }
    } catch (error) {
      logger.error("Failed to validate referral code", {
        error: error instanceof Error ? error.message : String(error),
        code: input.code,
        requestId,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate referral code",
        cause: error,
      });
    }
  });

// ============================================================================
// EXPORT WAITLIST ROUTER
// ============================================================================

/**
 * Waitlist Router
 * Combines all waitlist procedures into a single router
 */
export const waitlistRouter = t.router({
  join,
  getMyStats,
  validateReferralCode,
});

// Type export for frontend type-safety
export type WaitlistRouter = typeof waitlistRouter;