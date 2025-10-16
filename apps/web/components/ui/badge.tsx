import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary ring-primary/20 hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground ring-border hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive ring-destructive/20 hover:bg-destructive/20",
        outline: 
          "text-foreground ring-border",
        warning:
          "bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-500/20 hover:bg-orange-500/20",
        info:
          "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20 hover:bg-yellow-500/20",
        success:
          "bg-primary/10 text-primary ring-primary/20 hover:bg-primary/20",
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {} 

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }