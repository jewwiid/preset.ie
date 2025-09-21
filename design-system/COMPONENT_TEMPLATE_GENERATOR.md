# Component Template Generator

## 🚀 **Quick Component Templates**

Copy and paste these templates to ensure consistent, theme-aware components:

### **1. Basic Card Component**
```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconName } from 'lucide-react'

interface BasicCardProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export default function BasicCard({ title, description, children, action }: BasicCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconName className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {action && (
          <div className="pt-4 border-t border-border">
            <Button 
              onClick={action.onClick}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {action.label}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### **2. Form Component**
```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FormComponentProps {
  onSubmit: (data: FormData) => void
  loading?: boolean
}

export default function FormComponent({ onSubmit, loading = false }: FormComponentProps) {
  const [formData, setFormData] = useState({
    // Add your form fields here
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Form Title</CardTitle>
        <CardDescription>Form description</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="field-name" className="text-base font-medium">
              Field Label
            </Label>
            <Input
              id="field-name"
              type="text"
              placeholder="Enter value"
              value={formData.fieldName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fieldName: e.target.value }))}
              className="bg-background border-border focus:ring-primary"
            />
            <p className="text-sm text-muted-foreground">Helper text</p>
          </div>

          {/* Select Input */}
          <div className="space-y-2">
            <Label htmlFor="select-field" className="text-base font-medium">
              Select Option
            </Label>
            <Select>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Choose option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Label htmlFor="textarea-field" className="text-base font-medium">
              Description
            </Label>
            <Textarea
              id="textarea-field"
              placeholder="Enter description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background border-border focus:ring-primary min-h-[100px]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              className="border-border hover:bg-muted"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

### **3. List/Grid Component**
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ListItem {
  id: string
  title: string
  description?: string
  status?: 'active' | 'inactive' | 'pending'
  avatar?: string
  metadata?: string
}

interface ListComponentProps {
  title: string
  items: ListItem[]
  onItemClick?: (item: ListItem) => void
  emptyMessage?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }
}

export default function ListComponent({ 
  title, 
  items, 
  onItemClick, 
  emptyMessage = "No items found",
  emptyAction 
}: ListComponentProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-600 border-green-200'
      case 'inactive':
        return 'bg-muted text-muted-foreground border-border'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-200'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (items.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground/50 text-2xl">📭</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{emptyMessage}</h3>
            {emptyAction && (
              <Button 
                onClick={emptyAction.onClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {emptyAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline" className="border-border">
            {items.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              {item.avatar && (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {item.title.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                )}
                {item.metadata && (
                  <p className="text-xs text-muted-foreground mt-1">{item.metadata}</p>
                )}
              </div>
              
              {item.status && (
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### **4. Modal/Dialog Component**
```typescript
'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ModalComponentProps {
  trigger: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function ModalComponent({ 
  trigger, 
  title, 
  description, 
  children, 
  open, 
  onOpenChange,
  size = 'md' 
}: ModalComponentProps) {
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className={`${sizeClasses[size]} bg-background border-border`}>
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### **5. Loading States Component**
```typescript
'use client'

import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStatesProps {
  type: 'skeleton' | 'spinner' | 'pulse'
  message?: string
}

export default function LoadingStates({ type, message = 'Loading...' }: LoadingStatesProps) {
  
  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  if (type === 'pulse') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-muted" />
                <Skeleton className="h-3 w-5/6 bg-muted" />
                <Skeleton className="h-3 w-4/6 bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Default skeleton
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3 bg-muted" />
      <Skeleton className="h-4 w-2/3 bg-muted" />
      <Skeleton className="h-32 w-full bg-muted" />
    </div>
  )
}
```

## 🎯 **Usage Instructions**

1. **Copy the template** that matches your component type
2. **Replace placeholder content** with your specific implementation
3. **Update the interface** to match your props
4. **Customize styling** using only theme-aware classes
5. **Test in both light and dark modes**

## ✅ **Built-in Features**

All templates include:
- ✅ **Theme-aware styling** (no hardcoded colors)
- ✅ **Responsive design** patterns
- ✅ **Proper TypeScript** interfaces
- ✅ **Accessibility** considerations
- ✅ **Loading states** and error handling
- ✅ **Consistent spacing** and typography
- ✅ **Shadcn component** integration

This ensures every new component automatically follows your design system!
