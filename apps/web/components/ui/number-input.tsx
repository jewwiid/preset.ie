import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number | string
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value = 0, onChange, min = 0, max, step = 1, disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number>(Number(value) || 0)

    React.useEffect(() => {
      setInternalValue(Number(value) || 0)
    }, [value])

    const handleIncrement = () => {
      const newValue = internalValue + step
      if (max === undefined || newValue <= max) {
        setInternalValue(newValue)
        onChange?.(newValue)
      }
    }

    const handleDecrement = () => {
      const newValue = internalValue - step
      if (newValue >= min) {
        setInternalValue(newValue)
        onChange?.(newValue)
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      if (!isNaN(newValue) && newValue >= min && (max === undefined || newValue <= max)) {
        setInternalValue(newValue)
        onChange?.(newValue)
      }
    }

    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleDecrement}
          disabled={disabled || internalValue <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          ref={ref}
          type="number"
          value={internalValue}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="text-center"
          {...props}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && internalValue >= max)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
