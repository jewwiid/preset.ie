'use client'

import React from 'react'
import { ToggleSwitchProps } from '../types/profile'

export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = ''
}: ToggleSwitchProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
          checked 
            ? 'bg-primary' 
            : 'bg-muted'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

// Specialized toggle components for common use cases
export function LocationToggle(props: Omit<ToggleSwitchProps, 'label'>) {
  return <ToggleSwitch {...props} label="Show location" />
}

export function TravelToggle(props: Omit<ToggleSwitchProps, 'label'>) {
  return <ToggleSwitch {...props} label="Available for travel" />
}

export function StudioToggle(props: Omit<ToggleSwitchProps, 'label'>) {
  return <ToggleSwitch {...props} label="Has studio" />
}

export function TattoosToggle(props: Omit<ToggleSwitchProps, 'label'>) {
  return <ToggleSwitch {...props} label="Has tattoos" />
}

export function PiercingsToggle(props: Omit<ToggleSwitchProps, 'label'>) {
  return <ToggleSwitch {...props} label="Has piercings" />
}
