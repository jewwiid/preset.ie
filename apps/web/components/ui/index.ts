/**
 * UI Component Consolidation - Centralized Exports
 *
 * This file exports all consolidated UI components for easy importing.
 * Use these components instead of creating custom implementations.
 *
 * @see ../../../MIGRATION_GUIDE.md for usage examples
 * @see ../../../UI_COMPONENT_CONSOLIDATION_PLAN.md for full details
 */

// Loading & Async Components
export { LoadingSpinner } from './loading-spinner'
export { AsyncButton } from './async-button'

// Badge & Icon Components
export { IconBadge } from './icon-badge'

// Card Components
export { InfoCard } from './info-card'
export { EnhancedCardHeader } from './enhanced-card-header'

// Dialog Components
export { DialogFooterActions } from './dialog-footer-actions'

// Re-export commonly used shadcn components for convenience
export { Button } from './button'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
export { Badge } from './badge'
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
export { Input } from './input'
export { Label } from './label'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
