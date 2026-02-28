"use server";

/**
 * Server Actions for Waitlist
 * 
 * Consolidated server actions that replace tRPC procedures.
 * Form-first design with FormData support for progressive enhancement.
 * 
 * @module app/actions
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { WaitlistService } from "@/lib/services/WaitlistService";
import { ReferralService } from "@/lib/services/ReferralService";
import { emailService } from "@/lib/services/EmailService";
import { getUserFromToken } from "@/lib/auth";
import {
  generateReferralCode,
  generateUniqueCode,
  generateMagicLinkToken,
} from "@/lib/utils/generators";
import {
  buildReferralLink,
  buildAbsoluteReferralLink,
  buildMagicLinkUrl,
} from "@/lib/utils/links";
import {
  calculateTier,
  getTierInfo,
  getNextTierThreshold,
} from "@/lib/utils/tiers";
import {
  strictEmailSchema,
  isAllowedEmailDomain,
  BLOCKED_EMAIL_DOMAINS,
} from "@/lib/utils/validators";
import type { WaitlistJoinResponse, UserStatsResponse } from "@/lib/types";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const joinWaitlistSchema = z.object({
  email: strictEmailSchema,
  username: z.string().max(100).optional().nullable(),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phoneNumber: z
    .string()
    .regex(/^[\d+\-\s()]{7,20}$/)
    .max(20)
    .optional()
    .nullable(),
  marketingOptIn: z.boolean().default(false),
  additionalRemarks: z.string().max(500).optional().nullable(),
  referralCode: z
    .string()
    .length(8)
    .regex(/^[A-Za-z0-9]{8}$/)
    .optional()
    .nullable(),
});

const slackAccessSchema = z.object({
  q1Answer: z.string().min(1),
  q2Answer: z.string().min(10).max(2000),
});

// ============================================================================
// TYPE DEFINITIONS FOR FORM STATE
// ============================================================================

export type FormActionState<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
} | null;

// ============================================================================
// FORM ACTION: JOIN WAITLIST
// ============================================================================

/**
 * Internal: run join logic and return state (for testing or alternate flows).
 */
async function joinWaitlistInternal(
  formData: FormData
): Promise<FormActionState<WaitlistJoinResponse>> {
  try {
    // Parse form data
    const rawData = {
      email: formData.get("email") as string,
      username: formData.get("username") as string | null,
      firstName: formData.get("firstName") as string | null,
      lastName: formData.get("lastName") as string | null,
      phoneNumber: formData.get("phoneNumber") as string | null,
      marketingOptIn: formData.get("marketingOptIn") === "true",
      additionalRemarks: formData.get("additionalRemarks") as string | null,
      referralCode: formData.get("referralCode") as string | null,
    };

    // Validate
    const validated = joinWaitlistSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Invalid input",
      };
    }

    const input = validated.data;

    // Initialize services
    const waitlistService = new WaitlistService(db);
    const referralService = new ReferralService(db);

    // Check if email already exists
    const existingUser = await waitlistService.findUserByEmail(input.email);

    // Validate email domain
    if (!isAllowedEmailDomain(input.email, BLOCKED_EMAIL_DOMAINS)) {
      return {
        success: false,
        error: "Please use a real email address (no temporary/disposable emails)",
      };
    }

    let user;
    let newReferralCreated = false;
    let message = "";

    if (existingUser) {
      // EMAIL EXISTS - Handle duplicate scenario
      user = existingUser;
      message = "User already exists";

      // If referral code provided, attempt to create referral
      if (input.referralCode) {
        try {
          const referrer = await waitlistService.findUserByReferralCode(
            input.referralCode
          );

          if (!referrer) {
            return {
              success: false,
              error: "Referral code not found",
            };
          }

          // Prevent self-referral
          if (referrer.id === user.id) {
            return {
              success: false,
              error: "Cannot refer yourself",
            };
          }

          // Check if referral already exists
          const existingReferral = await referralService.referralExists(
            referrer.id,
            user.id
          );

          if (existingReferral) {
            return {
              success: false,
              error: "You have already been referred by this user",
            };
          }

          // Create referral relationship
          await referralService.createReferral(referrer.id, user.id);
          newReferralCreated = true;
          message = "Referral credited to existing user";
        } catch (error) {
          return {
            success: false,
            error: "Failed to process referral",
          };
        }
      }
    } else {
      // NEW USER - Create waitlist entry
      try {
        // Generate unique referral code
        const userReferralCode = await generateUniqueCode(
          generateReferralCode,
          async (code: string) => {
            const existing = await waitlistService.findUserByReferralCode(code);
            return !!existing;
          },
          5
        );

        // Generate magic link token
        const magicLinkToken = await generateMagicLinkToken();

        // Create new user
        user = await waitlistService.createUser({
          email: input.email,
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          marketingOptIn: input.marketingOptIn ?? false,
          additionalRemarks: input.additionalRemarks,
          referralCode: userReferralCode,
          magicLinkToken: magicLinkToken,
        });

        message = "Successfully joined waitlist";

        // Send magic link email
        try {
          await emailService.sendMagicLinkEmail({
            email: user.email,
            magicLinkUrl: buildMagicLinkUrl(user.magicLinkToken),
            referralCode: user.referralCode,
            referralLink: buildAbsoluteReferralLink(user.referralCode),
          });
          await db.markWelcomeEmailSent(user.id);
        } catch {
          // Email not sent (no-op when disabled)
        }

        // If referral code provided, create referral relationship
        if (input.referralCode) {
          try {
            const referrer = await waitlistService.findUserByReferralCode(
              input.referralCode
            );

            if (!referrer) {
              // Referral code not found - continue without referral
            } else if (referrer.id === user.id) {
              // Self-referral - skip
            } else {
              await referralService.createReferral(referrer.id, user.id);
              newReferralCreated = true;
              message = "Successfully joined waitlist with referral";
            }
          } catch {
            // Referral creation failed - continue
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error && error.message.includes("already exists")
            ? "Email already joined waitlist"
            : "Failed to join waitlist",
        };
      }
    }

    // Calculate user's referral stats
    const actualReferralCount = await referralService.countUserReferrals(user.id);
    const displayReferralCount = Math.min(actualReferralCount, 10);
    const tier = calculateTier(actualReferralCount);
    const tierInfo = getTierInfo(tier);

    // Build referral link
    const referralLink = buildReferralLink(user.referralCode);
    const magicLinkUrl = buildMagicLinkUrl(user.magicLinkToken);

    const response: WaitlistJoinResponse = {
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
        magicLinkUrl,
        magicLinkToken: user.magicLinkToken,
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

    return {
      success: true,
      data: response,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Join Waitlist Action (form action)
 *
 * Handles waitlist signup. Redirects on success or error.
 * Use as <form action={joinWaitlistAction}> — no useFormState needed.
 *
 * @param formData - Form data from submission
 */
export async function joinWaitlistAction(formData: FormData): Promise<never> {
  const result = await joinWaitlistInternal(formData);
  if (result?.success && result.data?.user?.magicLinkToken) {
    redirect(
      `/join/success?token=${encodeURIComponent(result.data.user.magicLinkToken)}`
    );
  }
  const error = result?.error ?? "Something went wrong";
  redirect(`/join?error=${encodeURIComponent(error)}`);
}

// ============================================================================
// UTILITY ACTION: VALIDATE REFERRAL CODE
// ============================================================================

/**
 * Validate Referral Code Action
 * 
 * Validates if a referral code exists.
 * Used for real-time validation in forms.
 * 
 * @param code - Referral code to validate
 * @returns Validation result
 */
export async function validateReferralCodeAction(code: string): Promise<{
  valid: boolean;
  referrerEmail?: string;
  message?: string;
}> {
  try {
    if (!code || code.length !== 8) {
      return {
        valid: false,
        message: "Referral code must be 8 characters",
      };
    }

    const waitlistService = new WaitlistService(db);
    const referrer = await waitlistService.findUserByReferralCode(code);

    if (referrer) {
      return {
        valid: true,
        referrerEmail: referrer.email,
        message: "Referral code is valid",
      };
    } else {
      return {
        valid: false,
        message: "Referral code not found",
      };
    }
  } catch {
    return {
      valid: false,
      message: "Failed to validate referral code",
    };
  }
}

// ============================================================================
// FORM ACTION: SUBMIT SLACK ACCESS SURVEY
// ============================================================================

/**
 * Submit Slack Access Survey Action
 * 
 * Handles Slack access survey form submission.
 * Requires authentication.
 * 
 * @param prevState - Previous form state
 * @param formData - Form data
 * @returns Form state
 */
export async function submitSlackAccessAction(
  prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    // Authenticate via magic link token from form
    const token = formData.get("token");
    const user = await getUserFromToken(typeof token === "string" ? token : null);
    if (!user) {
      return {
        success: false,
        error: "Please use your magic link to access this page",
      };
    }

    // Parse form data
    const rawData = {
      q1Answer: formData.get("q1Answer") as string,
      q2Answer: formData.get("q2Answer") as string,
    };

    // Validate
    const validated = slackAccessSchema.safeParse(rawData);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Invalid input",
      };
    }

    const waitlistService = new WaitlistService(db);
    const result = await waitlistService.submitSlackAccess(user.id, validated.data);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "Please log in to submit the survey",
      };
    }

    return {
      success: false,
      error: "Failed to submit survey",
    };
  }
}

// ============================================================================
// SERVER FUNCTION: GET STATS BY TOKEN (for server components)
// ============================================================================

/**
 * Get Stats By Token
 * 
 * Server-side function to get user stats by magic link token.
 * Used directly in server components (not a form action).
 * 
 * @param token - Magic link token
 * @returns User stats or null
 */
export async function getStatsByToken(token: string): Promise<UserStatsResponse | null> {
  try {
    const user = await getUserFromToken(token);
    if (!user) return null;

    const referralService = new ReferralService(db);
    const actualReferralCount = await referralService.countUserReferrals(user.id);
    const displayReferralCount = Math.min(actualReferralCount, 10);
    const tier = calculateTier(actualReferralCount);
    const tierInfo = getTierInfo(tier);
    const nextTierAt = getNextTierThreshold(actualReferralCount);
    const nextTierLabel = nextTierAt ? getTierInfo(calculateTier(nextTierAt)).label : null;
    const referralLink = buildReferralLink(user.referralCode);

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
    };
  } catch {
    return null;
  }
}
