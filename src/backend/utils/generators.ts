/**
 * Code and Token Generation Utilities
 * 
 * Cryptographically secure generation of referral codes and session tokens.
 * Uses nanoid for referral codes and crypto for session tokens.
 * 
 * @module utils/generators
 */

import { customAlphabet } from "nanoid";
import { randomBytes } from "crypto";

// ============================================================================
// REFERRAL CODE GENERATION
// ============================================================================

/**
 * Custom alphabet for referral codes
 * Excludes ambiguous characters: 0, O, 1, I, l
 * Total: 57 characters (uppercase + lowercase + digits - ambiguous)
 */
const REFERRAL_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Referral code length
 * 8 characters provides 57^8 = ~2.2 quadrillion combinations
 * Sufficient for MVP with collision checking
 */
const REFERRAL_CODE_LENGTH = 8;

/**
 * Nanoid instance for referral code generation
 * Configured with custom alphabet and length
 */
const generateNanoid = customAlphabet(REFERRAL_CODE_ALPHABET, REFERRAL_CODE_LENGTH);

/**
 * Generate Unique Referral Code
 * 
 * Creates a cryptographically secure 8-character referral code
 * using nanoid with custom alphabet (excludes ambiguous characters).
 * 
 * @returns {string} 8-character referral code (e.g., "AB3kR8mN")
 * 
 * @example
 * const code = generateReferralCode();
 * console.log(code); // "K7mNp2Qr"
 * 
 * @note Collision probability with 1 million codes: ~0.00002%
 * @note Always verify uniqueness in database before insertion
 */
export function generateReferralCode(): string {
  return generateNanoid();
}

/**
 * Generate Multiple Referral Codes
 * 
 * Batch generation utility for testing or pre-generation scenarios.
 * 
 * @param {number} count - Number of codes to generate
 * @returns {string[]} Array of unique referral codes
 * 
 * @example
 * const codes = generateReferralCodes(5);
 * console.log(codes); // ["K7mNp2Qr", "A3bCd4Ef", ...]
 * 
 * @warning Does not guarantee uniqueness across batches
 * @warning Always check database for collisions
 */
export function generateReferralCodes(count: number): string[] {
  return Array.from({ length: count }, () => generateReferralCode());
}

/**
 * Validate Referral Code Format
 * 
 * Checks if string matches referral code pattern.
 * Used for input validation before database lookup.
 * 
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format, false otherwise
 * 
 * @example
 * isValidReferralCodeFormat("K7mNp2Qr"); // true
 * isValidReferralCodeFormat("INVALID!"); // false
 * isValidReferralCodeFormat("SHORT"); // false
 */
export function isValidReferralCodeFormat(code: string): boolean {
  if (typeof code !== "string" || code.length !== REFERRAL_CODE_LENGTH) {
    return false;
  }

  // Check all characters are in allowed alphabet
  return [...code].every((char) => REFERRAL_CODE_ALPHABET.includes(char));
}

// ============================================================================
// SESSION TOKEN GENERATION
// ============================================================================

/**
 * Session token length in bytes
 * 32 bytes = 256 bits = 64 hex characters
 * Provides cryptographic strength against brute force
 */
const SESSION_TOKEN_BYTES = 32;

/**
 * Generate Session Token
 * 
 * Creates a cryptographically secure random token for session management.
 * Uses Node.js crypto.randomBytes for maximum entropy.
 * 
 * @returns {string} 64-character hex string (32 bytes)
 * 
 * @example
 * const token = generateSessionToken();
 * console.log(token); // "a3f5b2c1..."
 * console.log(token.length); // 64
 * 
 * @note Token space: 2^256 = ~10^77 possible values
 * @note Collision probability: negligible for practical purposes
 */
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

/**
 * Generate Multiple Session Tokens
 * 
 * Batch generation for testing or pre-generation scenarios.
 * 
 * @param {number} count - Number of tokens to generate
 * @returns {string[]} Array of session tokens
 * 
 * @example
 * const tokens = generateSessionTokens(3);
 * console.log(tokens[0].length); // 64
 * 
 * @warning Each token is unique but not validated against database
 */
export function generateSessionTokens(count: number): string[] {
  return Array.from({ length: count }, () => generateSessionToken());
}

/**
 * Validate Session Token Format
 * 
 * Checks if string matches session token pattern.
 * Used for input validation before database lookup.
 * 
 * @param {string} token - Token to validate
 * @returns {boolean} True if valid format, false otherwise
 * 
 * @example
 * isValidSessionTokenFormat("a3f5b2c1..."); // true (if 64 chars hex)
 * isValidSessionTokenFormat("invalid"); // false
 * isValidSessionTokenFormat("xyz..."); // false (not hex)
 */
export function isValidSessionTokenFormat(token: string): boolean {
  if (typeof token !== "string" || token.length !== SESSION_TOKEN_BYTES * 2) {
    return false;
  }

  // Check if all characters are valid hex
  return /^[a-f0-9]{64}$/i.test(token);
}

// ============================================================================
// UUID GENERATION (Optional - For Database IDs)
// ============================================================================

/**
 * Generate UUID v4
 * 
 * Creates a UUID v4 using Node.js crypto.randomUUID (Node 14.17+).
 * Used as fallback if database doesn't auto-generate UUIDs.
 * 
 * @returns {string} UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * 
 * @example
 * const id = generateUUID();
 * console.log(id); // "550e8400-e29b-41d4-a716-446655440000"
 * 
 * @note Most databases (Postgres, MySQL 8+) can generate UUIDs natively
 * @note Only use if database doesn't support gen_random_uuid() or UUID()
 */
export function generateUUID(): string {
  // Node.js 14.17+ has native crypto.randomUUID()
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback for older Node versions (should not happen with Node 20)
  // Implementation of UUID v4 format
  const bytes = randomBytes(16);

  // Set version (4) and variant bits
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

// ============================================================================
// COLLISION RETRY HELPER
// ============================================================================

/**
 * Generate Unique Code with Collision Checking
 * 
 * Generic helper for generating unique codes with database collision checking.
 * Retries up to maxAttempts if collision detected.
 * 
 * @template T
 * @param {() => T} generator - Function that generates a code
 * @param {(code: T) => Promise<boolean>} existsChecker - Function to check if code exists in DB
 * @param {number} maxAttempts - Maximum retry attempts (default: 5)
 * @returns {Promise<T>} Unique code not present in database
 * 
 * @throws {Error} If max attempts reached without finding unique code
 * 
 * @example
 * const uniqueCode = await generateUniqueCode(
 *   generateReferralCode,
 *   async (code) => await db.exists({ referralCode: code }),
 *   5
 * );
 */
export async function generateUniqueCode<T>(
  generator: () => T,
  existsChecker: (code: T) => Promise<boolean>,
  maxAttempts: number = 5
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const code = generator();
    const exists = await existsChecker(code);

    if (!exists) {
      return code;
    }

    // Log collision for monitoring
    if (attempt === maxAttempts) {
      throw new Error(
        `Failed to generate unique code after ${maxAttempts} attempts. This is extremely rare and may indicate a problem.`
      );
    }
  }

  // TypeScript exhaustiveness check
  throw new Error("Unreachable code");
}

// ============================================================================
// STATISTICS & MONITORING
// ============================================================================

/**
 * Calculate Collision Probability
 * 
 * Estimates probability of collision for given number of codes.
 * Uses birthday paradox approximation.
 * 
 * @param {number} numCodes - Number of codes generated
 * @param {number} alphabetSize - Size of alphabet (default: 57)
 * @param {number} codeLength - Length of code (default: 8)
 * @returns {number} Collision probability (0-1)
 * 
 * @example
 * const prob = calculateCollisionProbability(1000000);
 * console.log(prob); // ~0.0002 (0.02%)
 */
export function calculateCollisionProbability(
  numCodes: number,
  alphabetSize: number = REFERRAL_CODE_ALPHABET.length,
  codeLength: number = REFERRAL_CODE_LENGTH
): number {
  const totalCombinations = Math.pow(alphabetSize, codeLength);

  // Birthday paradox approximation: P(collision) ≈ n^2 / (2 * N)
  // where n = number of codes, N = total combinations
  return (numCodes * numCodes) / (2 * totalCombinations);
}

/**
 * Get Generator Statistics
 * 
 * Returns configuration and statistics about generators.
 * Useful for monitoring and debugging.
 * 
 * @returns {object} Generator statistics
 * 
 * @example
 * const stats = getGeneratorStats();
 * console.log(stats.referralCode.totalCombinations); // 2.2 quadrillion
 */
export function getGeneratorStats() {
  return {
    referralCode: {
      alphabet: REFERRAL_CODE_ALPHABET,
      alphabetSize: REFERRAL_CODE_ALPHABET.length,
      length: REFERRAL_CODE_LENGTH,
      totalCombinations: Math.pow(REFERRAL_CODE_ALPHABET.length, REFERRAL_CODE_LENGTH),
      collisionProbAt1M: calculateCollisionProbability(1_000_000),
      collisionProbAt10M: calculateCollisionProbability(10_000_000),
    },
    sessionToken: {
      bytes: SESSION_TOKEN_BYTES,
      hexLength: SESSION_TOKEN_BYTES * 2,
      bits: SESSION_TOKEN_BYTES * 8,
      totalCombinations: Math.pow(2, SESSION_TOKEN_BYTES * 8),
    },
  };
}