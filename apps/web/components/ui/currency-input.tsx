import * as React from "react"
import { Euro } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number | string
  onChange?: (value: number) => void
  currency?: string
  symbol?: string
  disabled?: boolean
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onChange, currency = "EUR", symbol = "€", disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      const numValue = Number(value) || 0
      return numValue > 0 ? numValue.toFixed(2) : ""
    })

    React.useEffect(() => {
      const numValue = Number(value) || 0
      setInternalValue(numValue > 0 ? numValue.toFixed(2) : "")
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Allow empty input
      if (inputValue === "") {
        setInternalValue("")
        onChange?.(0)
        return
      }

      // Parse the input value
      const numValue = parseFloat(inputValue)
      
      if (!isNaN(numValue) && numValue >= 0) {
        setInternalValue(inputValue)
        onChange?.(numValue)
      }
    }

    const handleBlur = () => {
      const numValue = parseFloat(internalValue)
      if (!isNaN(numValue) && numValue > 0) {
        setInternalValue(numValue.toFixed(2))
      }
    }

    return (
      <div className="relative">
        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          type="number"
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="0.00"
          disabled={disabled}
          min="0"
          step="0.01"
          className={cn("pl-10", className)}
          {...props}
        />
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
