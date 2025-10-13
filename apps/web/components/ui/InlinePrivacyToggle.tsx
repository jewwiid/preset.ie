'use client'

import React from 'react'
import { Switch } from './switch'
import { Label } from './label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { Eye, EyeOff } from 'lucide-react'

interface InlinePrivacyToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  tooltip?: string
  disabled?: boolean
  className?: string
}

export function InlinePrivacyToggle({
  checked,
  onChange,
  label = "Show on profile",
  tooltip = "Toggle visibility of this information on your public profile",
  disabled = false,
  className = ""
}: InlinePrivacyToggleProps) {
  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {checked ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="privacy-toggle" className="text-sm font-normal cursor-pointer">
                {label}
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
        
        <Switch
          id="privacy-toggle"
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </TooltipProvider>
  )
}
