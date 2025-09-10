'use client'

import { Shield, CheckCircle, AlertCircle, Clock, UserCheck, Briefcase, Building } from 'lucide-react'
// import { Tooltip } from './Tooltip' // Assuming you have a tooltip component

export type BadgeType = 
  | 'verified_age'
  | 'verified_email'
  | 'verified_identity' 
  | 'verified_professional'
  | 'verified_business'
  | 'pending_verification'
  | 'unverified'

interface VerificationBadgeProps {
  type: BadgeType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const badgeConfig = {
  verified_age: {
    icon: CheckCircle,
    label: 'Age Verified',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    tooltip: 'This user has verified they are 18 or older'
  },
  verified_email: {
    icon: CheckCircle,
    label: 'Email Verified',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    tooltip: 'Email address has been verified'
  },
  verified_identity: {
    icon: Shield,
    label: 'ID Verified',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    tooltip: 'Identity verified with government ID'
  },
  verified_professional: {
    icon: Briefcase,
    label: 'Pro Verified',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200',
    tooltip: 'Professional credentials verified'
  },
  verified_business: {
    icon: Building,
    label: 'Business Verified',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-200',
    tooltip: 'Business registration verified'
  },
  pending_verification: {
    icon: Clock,
    label: 'Pending Verification',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    tooltip: 'Verification in progress'
  },
  unverified: {
    icon: AlertCircle,
    label: 'Not Verified',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    tooltip: 'User has not completed verification'
  }
}

export function VerificationBadge({ 
  type, 
  size = 'md', 
  showLabel = false,
  className = '' 
}: VerificationBadgeProps) {
  const config = badgeConfig[type]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  }
  
  const sizes = sizeClasses[size]
  
  const badge = (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${config.bgColor} ${config.borderColor} ${sizes.container}
        ${className}
      `}
    >
      <Icon className={`${config.color} ${sizes.icon}`} />
      {showLabel && (
        <span className={`${config.color} font-medium ${sizes.text}`}>
          {config.label}
        </span>
      )}
    </div>
  )
  
  // If you have a Tooltip component, wrap the badge
  // return (
  //   <Tooltip content={config.tooltip}>
  //     {badge}
  //   </Tooltip>
  // )
  
  // Otherwise, just add a title attribute
  return (
    <div title={config.tooltip} className="inline-block">
      {badge}
    </div>
  )
}

// Compound badge for showing multiple verifications
interface VerificationStatusProps {
  badges: BadgeType[]
  size?: 'sm' | 'md' | 'lg'
  maxDisplay?: number
  className?: string
}

export function VerificationStatus({ 
  badges, 
  size = 'md',
  maxDisplay = 3,
  className = ''
}: VerificationStatusProps) {
  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - maxDisplay
  
  if (badges.length === 0) {
    return <VerificationBadge type="unverified" size={size} />
  }
  
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {displayBadges.map((badge, index) => (
        <VerificationBadge 
          key={badge} 
          type={badge} 
          size={size}
          showLabel={false}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}

// Hook to get user's verification status
export function useVerificationStatus(userId: string) {
  // This would connect to your Supabase database
  // For now, returning mock data
  return {
    isAgeVerified: false,
    isEmailVerified: false,
    isIdentityVerified: false,
    isProfessionalVerified: false,
    isBusinessVerified: false,
    accountStatus: 'pending_verification' as const,
    badges: [] as BadgeType[]
  }
}