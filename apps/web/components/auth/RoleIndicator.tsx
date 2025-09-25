'use client'

import { Badge } from '../ui/badge'
import { CheckCircle2, Users, Camera, UserCheck } from 'lucide-react'

interface RoleIndicatorProps {
  role: 'CONTRIBUTOR' | 'TALENT' | 'BOTH'
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
}

export function RoleIndicator({ role, className = '', variant = 'default' }: RoleIndicatorProps) {
  const getRoleConfig = () => {
    switch (role) {
      case 'CONTRIBUTOR':
        return {
          label: 'Contributor',
          icon: Camera,
          description: 'Photographer, videographer, or cinematographer',
          variant: 'default' as const,
          className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
        }
      case 'TALENT':
        return {
          label: 'Talent',
          icon: Users,
          description: 'Model, actor, or creative professional',
          variant: 'secondary' as const,
          className: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500'
        }
      case 'BOTH':
        return {
          label: 'Both',
          icon: UserCheck,
          description: 'Creative professional and talent',
          variant: 'outline' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white border-green-500'
        }
    }
  }

  const config = getRoleConfig()
  const Icon = config.icon

  if (variant === 'minimal') {
    return (
      <Badge 
        variant={config.variant}
        className={`${config.className} flex items-center gap-1.5 px-3 py-1 ${className}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 p-3 bg-card border border-border rounded-lg ${className}`}>
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Role:</span>
        <Badge 
          variant={config.variant}
          className={`${config.className} flex items-center gap-1.5 px-2 py-0.5 text-xs`}
        >
          <CheckCircle2 className="w-2.5 h-2.5" />
          {config.label}
        </Badge>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 p-4 bg-card border border-border rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Role:</span>
      </div>
      
      <Badge 
        variant={config.variant}
        className={`${config.className} flex items-center gap-1.5 px-3 py-1`}
      >
        <CheckCircle2 className="w-3 h-3" />
        {config.label}
      </Badge>
      
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {config.description}
      </span>
    </div>
  )
}

export default RoleIndicator
