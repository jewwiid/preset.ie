import { CheckCircle, Shield, Briefcase, Building } from 'lucide-react'
import { cn } from '../lib/utils'

interface VerificationBadgesProps {
  verifiedIdentity?: boolean
  verifiedProfessional?: boolean
  verifiedBusiness?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
  layout?: 'inline' | 'stacked'
}

export function VerificationBadges({
  verifiedIdentity = false,
  verifiedProfessional = false,
  verifiedBusiness = false,
  size = 'md',
  className,
  showTooltip = true,
  layout = 'inline'
}: VerificationBadgesProps) {
  // If no verifications, return null
  if (!verifiedIdentity && !verifiedProfessional && !verifiedBusiness) {
    return null
  }

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const badges = []

  // Identity Badge (CheckCircle icon, Primary color)
  if (verifiedIdentity) {
    badges.push({
      key: 'identity',
      icon: CheckCircle,
      color: 'text-primary',
      fill: 'fill-primary/20',
      tooltip: 'Identity verified with government ID',
      label: 'ID'
    })
  }

  // Professional Badge (Briefcase icon, Primary color)
  if (verifiedProfessional) {
    badges.push({
      key: 'professional',
      icon: Briefcase,
      color: 'text-primary',
      fill: 'fill-primary/20',
      tooltip: 'Professional credentials verified',
      label: 'Pro'
    })
  }

  // Business Badge (Building icon, Primary color)
  if (verifiedBusiness) {
    badges.push({
      key: 'business',
      icon: Building,
      color: 'text-primary',
      fill: 'fill-primary/20',
      tooltip: 'Business registration verified',
      label: 'Business'
    })
  }

  return (
    <div
      className={cn(
        "inline-flex items-center",
        layout === 'inline' ? 'gap-1' : 'flex-col gap-0.5',
        className
      )}
    >
      {badges.map(({ key, icon: Icon, color, fill, tooltip }) => (
        <div
          key={key}
          className="inline-flex items-center"
          title={showTooltip ? tooltip : undefined}
        >
          <Icon
            className={cn(
              sizeClasses[size],
              color,
              fill
            )}
            aria-label={tooltip}
          />
        </div>
      ))}
    </div>
  )
}

// Simple badge component for backward compatibility
interface VerifiedBadgeProps {
  verified?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export function VerifiedBadge({
  verified = false,
  size = 'md',
  className,
  showTooltip = true
}: VerifiedBadgeProps) {
  if (!verified) return null

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div
      className={cn("inline-flex items-center", className)}
      title={showTooltip ? "Verified User" : undefined}
    >
      <CheckCircle
        className={cn(
          sizeClasses[size],
          "text-primary fill-primary/20"
        )}
        aria-label="Verified"
      />
    </div>
  )
}
