/**
 * Custom Zod Validators
 * 
 * Extended validation schemas and helpers beyond basic Zod functionality.
 * Provides domain-specific validation for emails, phones, and referral codes.
 * 
 * @module utils/validators
 */

import { z } from "zod";

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Email Validation Schema
 * 
 * Enhanced email validation with normalization.
 * - Validates email format
 * - Converts to lowercase
 * - Trims whitespace
 * - Enforces max length
 * 
 * @example
 * const email = emailSchema.parse("  USER@EXAMPLE.COM  ");
 * // Returns: "user@example.com"
 */
export const emailSchema = z
  .string({ required_error: "Email is required" })
  .email("Invalid email format")
  .toLowerCase()
  .trim()
  .max(255, "Email must be 255 characters or less");

/**
 * Validate Email Domain
 * 
 * Checks if email domain is in allowed/blocked list.
 * Useful for preventing disposable email services.
 * 
 * @param {string} email - Email to validate
 * @param {string[]} blockedDomains - List of blocked domains
 * @returns {boolean} True if domain is allowed
 * 
 * @example
 * isAllowedEmailDomain("user@tempmail.com", ["tempmail.com"]); // false
 * isAllowedEmailDomain("user@gmail.com", ["tempmail.com"]); // true
 */
export function isAllowedEmailDomain(
  email: string,
  blockedDomains: string[] = []
): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return !blockedDomains.includes(domain);
}

/**
 * Common Disposable Email Domains
 * List of known temporary email services
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "throwaway.email",
  "temp-mail.org",
  "fakeinbox.com",
];

// ============================================================================
// PHONE NUMBER VALIDATION
// ============================================================================

/**
 * Phone Number Validation Schema
 * 
 * Flexible phone validation supporting international formats.
 * Allows: digits, spaces, hyphens, parentheses, plus sign
 * Length: 7-20 characters
 * 
 * @example
 * const phone = phoneSchema.parse("+1 (555) 123-4567");
 * // Valid
 */
export const phoneSchema = z
  .string()
  .regex(
    /^[\d+\-\s()]{7,20}$/,
    "Invalid phone number format. Use digits, spaces, hyphens, and parentheses only."
  )
  .max(20, "Phone number must be 20 characters or less");

/**
 * Normalize Phone Number
 * 
 * Removes formatting characters, keeping only digits and plus.
 * 
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone (e.g., "+15551234567")
 * 
 * @example
 * normalizePhone("+1 (555) 123-4567"); // "+15551234567"
 * normalizePhone("555.123.4567"); // "5551234567"
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Validate International Phone
 * 
 * Stricter validation for international format (E.164).
 * Must start with + and have 7-15 digits.
 * 
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid international format
 * 
 * @example
 * isValidInternationalPhone("+15551234567"); // true
 * isValidInternationalPhone("5551234567"); // false (no +)
 */
export function isValidInternationalPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}

// ============================================================================
// REFERRAL CODE VALIDATION
// ============================================================================

/**
 * Referral Code Validation Schema
 * 
 * Validates 8-character alphanumeric referral codes.
 * Converts to uppercase for consistency.
 * 
 * @example
 * const code = referralCodeSchema.parse("abc12xyz");
 * // Returns: "ABC12XYZ"
 */
export const referralCodeSchema = z
  .string({ required_error: "Referral code is required" })
  .length(8, "Referral code must be exactly 8 characters")
  .regex(/^[A-Za-z0-9]{8}$/, "Referral code must be alphanumeric")
  .toUpperCase();

/**
 * Optional Referral Code Schema
 * 
 * Same as referralCodeSchema but allows null/undefined.
 * Used in join procedure where referral is optional.
 */
export const optionalReferralCodeSchema = referralCodeSchema.optional().nullable();

// ============================================================================
// USERNAME VALIDATION
// ============================================================================

/**
 * Username Validation Schema
 * 
 * Allows alphanumeric, underscore, hyphen.
 * Length: 3-100 characters.
 * 
 * @example
 * const username = usernameSchema.parse("john_doe-123");
 * // Valid
 */
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(100, "Username must be 100 characters or less")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens"
  );

/**
 * Optional Username Schema
 */
export const optionalUsernameSchema = usernameSchema.optional().nullable();

// ============================================================================
// NAME VALIDATION
// ============================================================================

/**
 * Name Validation Schema
 * 
 * For first name and last name fields.
 * Allows letters, spaces, apostrophes, hyphens.
 * 
 * @example
 * const name = nameSchema.parse("Mary-Jane O'Brien");
 * // Valid
 */
export const nameSchema = z
  .string()
  .min(1, "Name must be at least 1 character")
  .max(100, "Name must be 100 characters or less")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, apostrophes, and hyphens"
  );

/**
 * Optional Name Schema
 */
export const optionalNameSchema = nameSchema.optional().nullable();

// ============================================================================
// TEXT FIELD VALIDATION
// ============================================================================

/**
 * Remarks/Notes Validation Schema
 * 
 * For additional remarks field.
 * Max 500 characters, allows any printable characters.
 */
export const remarksSchema = z
  .string()
  .max(500, "Remarks must be 500 characters or less")
  .optional()
  .nullable();

/**
 * Long Text Validation Schema
 * 
 * For longer text fields (e.g., descriptions).
 * Max 2000 characters.
 */
export const longTextSchema = z
  .string()
  .max(2000, "Text must be 2000 characters or less")
  .optional()
  .nullable();

// ============================================================================
// BOOLEAN VALIDATION
// ============================================================================

/**
 * Opt-In Validation Schema
 * 
 * For marketing consent and similar boolean flags.
 * Defaults to false (explicit opt-in required).
 */
export const optInSchema = z.boolean().default(false);

// ============================================================================
// UUID VALIDATION
// ============================================================================

/**
 * UUID Validation Schema
 * 
 * Validates UUID v4 format.
 * 
 * @example
 * const id = uuidSchema.parse("550e8400-e29b-41d4-a716-446655440000");
 * // Valid
 */
export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format");

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * URL Validation Schema
 * 
 * Validates HTTP/HTTPS URLs.
 * 
 * @example
 * const url = urlSchema.parse("https://example.com");
 * // Valid
 */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .regex(/^https?:\/\//, "URL must start with http:// or https://");

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Sanitize String
 * 
 * Removes potentially dangerous characters from user input.
 * Prevents XSS and injection attacks.
 * 
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 * 
 * @example
 * sanitizeString("<script>alert('xss')</script>"); 
 * // Returns: "scriptalert('xss')/script" (tags removed)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers (onclick=, etc.)
    .trim();
}

/**
 * Validate and Sanitize Email
 * 
 * Combines validation and sanitization.
 * 
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean; email?: string; error?: string }}
 * 
 * @example
 * const result = validateAndSanitizeEmail("  USER@EXAMPLE.COM  ");
 * // { valid: true, email: "user@example.com" }
 */
export function validateAndSanitizeEmail(email: string): {
  valid: boolean;
  email?: string;
  error?: string;
} {
  try {
    const validated = emailSchema.parse(email);
    return { valid: true, email: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message };
    }
    return { valid: false, error: "Invalid email" };
  }
}

/**
 * Validate Multiple Fields
 * 
 * Generic validator for multiple fields at once.
 * Returns first error encountered or success.
 * 
 * @param {Record<string, any>} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {{ valid: boolean; data?: any; errors?: z.ZodError }}
 * 
 * @example
 * const result = validateMultipleFields(
 *   { email: "test@example.com", username: "john_doe" },
 *   z.object({ email: emailSchema, username: usernameSchema })
 * );
 */
export function validateMultipleFields(
  data: Record<string, any>,
  schema: z.ZodSchema
): {
  valid: boolean;
  data?: any;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error };
    }
    return { valid: false };
  }
}

// ============================================================================
// PAGINATION VALIDATION
// ============================================================================

/**
 * Pagination Schema
 * 
 * Validates pagination parameters.
 * 
 * @example
 * const pagination = paginationSchema.parse({ page: 1, limit: 20 });
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// EXPORT COMBINED SCHEMAS
// ============================================================================

/**
 * User Input Schema
 * 
 * Complete schema for user registration.
 * Used in waitlist.join procedure.
 */
export const userInputSchema = z.object({
  email: emailSchema,
  username: optionalUsernameSchema,
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
  phoneNumber: phoneSchema.optional().nullable(),
  marketingOptIn: optInSchema,
  additionalRemarks: remarksSchema,
  referralCode: optionalReferralCodeSchema,
});

/**
 * Type inference for user input
 */
export type UserInput = z.infer<typeof userInputSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if string is empty or whitespace
 * 
 * @param {string | null | undefined} str - String to check
 * @returns {boolean} True if empty/whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Truncate string to max length
 * 
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 * 
 * @example
 * truncateString("Hello World", 5); // "Hello..."
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

/**
 * Count validation errors
 * 
 * @param {z.ZodError} error - Zod error object
 * @returns {number} Number of validation errors
 */
export function countValidationErrors(error: z.ZodError): number {
  return error.errors.length;
}

/**
 * Format validation errors for display
 * 
 * @param {z.ZodError} error - Zod error object
 * @returns {Record<string, string>} Field-to-error mapping
 * 
 * @example
 * formatValidationErrors(zodError);
 * // { email: "Invalid email format", username: "Too short" }
 */
export function formatValidationErrors(
  error: z.ZodError
): Record<string, string> {
  const formatted: Record<string, string> = {};

  for (const err of error.errors) {
    const field = err.path.join(".");
    formatted[field] = err.message;
  }

  return formatted;
}