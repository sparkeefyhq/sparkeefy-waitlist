/**
 * Referral Service
 *
 * Core business logic for referral management.
 * Handles referral relationship creation, duplicate prevention, referral counting.
 *
 * @module services/ReferralService
 */

import type { Referral } from "../types";
import { validateReferralRelationship } from "../utils/referrals";

export interface ReferralDatabaseClient {
  createReferral(data: { referrerId: string; refereeId: string }): Promise<Referral>;
  findReferralByUsers(referrerId: string, refereeId: string): Promise<Referral | null>;
  countUserReferrals(userId: string): Promise<number>;
}

export class ReferralService {
  constructor(private db: ReferralDatabaseClient) {}

  async createReferral(referrerId: string, refereeId: string): Promise<Referral> {
    const validation = validateReferralRelationship(referrerId, refereeId);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid referral relationship");
    }

    const existing = await this.db.findReferralByUsers(referrerId, refereeId);
    if (existing) {
      throw new Error("This referral relationship already exists");
    }

    return this.db.createReferral({ referrerId, refereeId });
  }

  async referralExists(referrerId: string, refereeId: string): Promise<boolean> {
    const existing = await this.db.findReferralByUsers(referrerId, refereeId);
    return !!existing;
  }

  async countUserReferrals(userId: string): Promise<number> {
    return this.db.countUserReferrals(userId);
  }
}
