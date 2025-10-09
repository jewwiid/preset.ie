/**
 * Verification Badge Utilities
 * Helper functions for managing multi-badge verification system
 */

export interface VerificationBadges {
  identity: boolean
  professional: boolean
  business: boolean
}

export interface VerificationBadgeRow {
  badge_type: 'verified_age' | 'verified_email' | 'verified_identity' | 'verified_professional' | 'verified_business'
  issued_at: string
  expires_at: string | null
  revoked_at: string | null
}

/**
 * Parse verification badges from database rows into boolean flags
 */
export function parseVerificationBadges(badges: VerificationBadgeRow[] | null): VerificationBadges {
  if (!badges || badges.length === 0) {
    return {
      identity: false,
      professional: false,
      business: false
    }
  }

  const now = new Date()
  const activeBadges = badges.filter(badge => {
    // Badge must not be revoked
    if (badge.revoked_at) return false

    // Badge must not be expired
    if (badge.expires_at && new Date(badge.expires_at) <= now) return false

    return true
  })

  return {
    identity: activeBadges.some(b => b.badge_type === 'verified_identity'),
    professional: activeBadges.some(b => b.badge_type === 'verified_professional'),
    business: activeBadges.some(b => b.badge_type === 'verified_business')
  }
}

/**
 * Check if user has any active verification
 */
export function hasAnyVerification(badges: VerificationBadges): boolean {
  return badges.identity || badges.professional || badges.business
}

/**
 * Get verification level count (0-3)
 */
export function getVerificationLevel(badges: VerificationBadges): number {
  let count = 0
  if (badges.identity) count++
  if (badges.professional) count++
  if (badges.business) count++
  return count
}

/**
 * Get verification badge types as array
 */
export function getVerificationTypes(badges: VerificationBadges): string[] {
  const types: string[] = []
  if (badges.identity) types.push('Identity')
  if (badges.professional) types.push('Professional')
  if (badges.business) types.push('Business')
  return types
}

/**
 * Supabase query fragment for fetching verification badges
 * Use this in your .select() calls
 */
export const VERIFICATION_BADGES_QUERY = `
  verification_badges:verification_badges!verification_badges_user_id_fkey(
    badge_type,
    issued_at,
    expires_at,
    revoked_at
  )
`
