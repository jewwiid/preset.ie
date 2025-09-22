'use client'

import * as React from "react"
import { cn } from "../../lib/utils"

interface SliderProps {
  value: number | number[]
  onValueChange: (value: number | number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, className, ...props }, ref) => {
    // Handle both single value and range values
    const isRange = Array.isArray(value)
    const currentValue = isRange ? value[0] : value
    const percentage = ((currentValue - min) / (max - min)) * 100

    return (
      <div className={cn("relative w-full", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => {
            const newValue = Number(e.target.value)
            if (isRange) {
              onValueChange([newValue, value[1]])
            } else {
              onValueChange(newValue)
            }
          }}
          className={cn(
            "w-full h-2 rounded-lg appearance-none cursor-pointer",
            "focus:outline-none",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]",
            "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0",
            "[&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:bg-[var(--primary)]/90",
            "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:border-0",
            "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
          )}
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--muted) ${percentage}%, var(--muted) 100%)`
          }}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }