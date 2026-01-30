/**
 * Admin/Pro User Whitelist
 *
 * Users in this list get Pro access without requiring a Stripe subscription.
 * Add email addresses to grant permanent Pro access.
 */

// Whitelisted email addresses that get Pro access automatically
export const PRO_WHITELIST: string[] = [
  'gatordevin@gmail.com',
  'football2nick@gmail.com',
]

/**
 * Check if a user should have Pro access
 * @param email - The user's email address
 * @returns true if the user has Pro access (either whitelisted or has active subscription)
 */
export function isProUser(email: string | null | undefined): boolean {
  if (!email) return false
  return PRO_WHITELIST.includes(email.toLowerCase())
}

/**
 * Check if an email is in the admin whitelist
 * @param email - The user's email address
 * @returns true if the user is in the whitelist
 */
export function isWhitelistedUser(email: string | null | undefined): boolean {
  if (!email) return false
  return PRO_WHITELIST.includes(email.toLowerCase())
}
