import { CheckCircle } from 'lucide-react'
import { cn } from '../lib/utils'

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
