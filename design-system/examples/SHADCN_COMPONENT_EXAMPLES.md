# Shadcn Component Examples - Preset Design System

## 🎯 Overview

This document provides comprehensive examples of how to use shadcn/ui components within the Preset Design System, showcasing real-world patterns and best practices.

## 🎨 Core Component Examples

### Button Variants

```tsx
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Download } from "lucide-react"

export function ButtonExamples() {
  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Primary Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Create Gig</Button>
          <Button size="lg">Post Showcase</Button>
          <Button disabled>Processing...</Button>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Secondary Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">Save Draft</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="ghost">Learn More</Button>
        </div>
      </div>

      {/* Destructive Actions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Destructive Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive">Delete Account</Button>
          <Button variant="destructive" size="sm">Remove</Button>
        </div>
      </div>

      {/* Icon Buttons */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Icon Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading States */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Loading States</h3>
        <div className="flex flex-wrap gap-2">
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
          <Button variant="outline" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Card Layouts

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function CardExamples() {
  return (
    <div className="space-y-6">
      {/* Basic Card */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to Preset</CardTitle>
          <CardDescription>
            Your creative marketplace for photographers and videographers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Join thousands of creatives sharing their work and finding opportunities.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Get Started</Button>
        </CardFooter>
      </Card>

      {/* Profile Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src="/avatars/profile.jpg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <CardTitle>John Doe</CardTitle>
          <CardDescription>Professional Photographer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">Portrait</Badge>
            <Badge variant="outline">Wedding</Badge>
            <Badge variant="outline">Commercial</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Experience</span>
              <span className="font-medium">5 years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">$150/hour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span className="font-medium">New York, NY</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button className="flex-1">View Profile</Button>
          <Button variant="outline" className="flex-1">Message</Button>
        </CardFooter>
      </Card>

      {/* Feature Card with Gradient */}
      <Card className="w-full max-w-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Experience</h4>
                <p className="text-xs text-blue-600 dark:text-blue-300">Professional level</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">5+</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$12,345</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Form Components

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FormExamples() {
  return (
    <div className="space-y-6">
      {/* Basic Form */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter your email"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Enter your password"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="talent">Talent</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Create Account</Button>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              placeholder="Tell us about yourself..."
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="New York, NY" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" placeholder="https://yourwebsite.com" />
          </div>
          <div className="flex gap-2">
            <Button>Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form with Validation */}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Contact Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input 
              id="contactEmail" 
              type="email" 
              placeholder="Enter your email"
              className="border-destructive"
            />
            <Alert variant="destructive">
              <AlertDescription>
                Please enter a valid email address
              </AlertDescription>
            </Alert>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea 
              id="message" 
              placeholder="Enter your message"
              className="min-h-[120px]"
            />
          </div>
          <Button className="w-full" disabled>
            Send Message
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Badge and Status Components

```tsx
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

export function StatusExamples() {
  return (
    <div className="space-y-6">
      {/* Badge Variants */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Badge Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Active</Badge>
          <Badge variant="secondary">Pending</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Draft</Badge>
        </div>
      </div>

      {/* Skill Tags */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Skill Tags</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            Photography
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
            Videography
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            Editing
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            Lighting
          </Badge>
        </div>
      </div>

      {/* Alert Messages */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Alert Messages</h3>
        
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile has been successfully updated!
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            There was an error processing your request. Please try again.
          </AlertDescription>
        </Alert>

        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your account will be suspended if payment is not received within 7 days.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription>
            New features are available! Check out our latest updates.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
```

### Navigation Components

```tsx
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavigationExamples() {
  return (
    <div className="space-y-6">
      {/* Main Navigation */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Browse</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <li>
                  <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    <div className="text-sm font-medium leading-none">Photography</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Browse photography services and portfolios
                    </p>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                    <div className="text-sm font-medium leading-none">Videography</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Find videography services and reels
                    </p>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
              Marketplace
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">John Doe</p>
              <p className="text-xs leading-none text-muted-foreground">
                john@example.com
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

### Data Display Components

```tsx
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export function DataDisplayExamples() {
  return (
    <div className="space-y-6">
      {/* Data Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Recent Gigs</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/avatars/client1.jpg" />
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  Alice Brown
                </div>
              </TableCell>
              <TableCell>Wedding Photography</TableCell>
              <TableCell>
                <Badge variant="default">Completed</Badge>
              </TableCell>
              <TableCell>2024-01-15</TableCell>
              <TableCell>$2,500</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/avatars/client2.jpg" />
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  Charlie Davis
                </div>
              </TableCell>
              <TableCell>Corporate Video</TableCell>
              <TableCell>
                <Badge variant="secondary">In Progress</Badge>
              </TableCell>
              <TableCell>2024-01-20</TableCell>
              <TableCell>$1,800</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Tabs */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Portfolio</h3>
        <Tabs defaultValue="photography" className="w-full">
          <TabsList>
            <TabsTrigger value="photography">Photography</TabsTrigger>
            <TabsTrigger value="videography">Videography</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          </TabsList>
          <TabsContent value="photography" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="aspect-square bg-muted rounded-lg"></div>
            </div>
          </TabsContent>
          <TabsContent value="videography" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="aspect-video bg-muted rounded-lg"></div>
              <div className="aspect-video bg-muted rounded-lg"></div>
            </div>
          </TabsContent>
          <TabsContent value="testimonials" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm">"John was absolutely amazing to work with. The photos exceeded our expectations!"</p>
                <p className="text-xs text-muted-foreground mt-2">- Alice Brown</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm">"Professional, creative, and delivered on time. Highly recommended!"</p>
                <p className="text-xs text-muted-foreground mt-2">- Charlie Davis</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

## 🎨 Responsive Design Patterns

```tsx
export function ResponsiveExamples() {
  return (
    <div className="space-y-6">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold">Mobile First</h4>
            <p className="text-sm text-muted-foreground">
              Responsive design that works on all devices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold">Flexible Layout</h4>
            <p className="text-sm text-muted-foreground">
              Adapts to different screen sizes automatically
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold">Consistent Spacing</h4>
            <p className="text-sm text-muted-foreground">
              Maintains visual hierarchy across breakpoints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Typography */}
      <div className="space-y-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
          Responsive Heading
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
          This text scales appropriately across different screen sizes
        </p>
      </div>

      {/* Responsive Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button className="w-full sm:w-auto">Primary Action</Button>
        <Button variant="outline" className="w-full sm:w-auto">Secondary Action</Button>
      </div>
    </div>
  )
}
```

## 🌙 Dark Mode Examples

```tsx
export function DarkModeExamples() {
  return (
    <div className="space-y-6">
      {/* Cards that adapt to dark mode */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Adaptive Card</CardTitle>
          <CardDescription>
            This card automatically adapts to light and dark themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The colors change based on the user's theme preference
          </p>
        </CardContent>
      </Card>

      {/* Brand colors with dark mode */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Brand Colors</h3>
        <div className="flex gap-2">
          <Badge className="bg-preset-500 text-white">Preset Green</Badge>
          <Badge className="bg-preset-500/20 text-preset-500 border-preset-500">
            Light Variant
          </Badge>
        </div>
      </div>

      {/* Semantic colors */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Semantic Colors</h3>
        <div className="flex gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>
    </div>
  )
}
```

## 🚀 Best Practices Summary

1. **Consistent Spacing**: Use `space-y-*` and `gap-*` classes
2. **Responsive Design**: Use `md:`, `lg:` prefixes for breakpoints
3. **Accessibility**: Always include proper labels and ARIA attributes
4. **Loading States**: Use skeleton components and disabled states
5. **Error Handling**: Use alert components for user feedback
6. **Theme Integration**: Leverage CSS variables for consistent theming
7. **Component Composition**: Build complex UIs by combining simple components

---

These examples demonstrate how to effectively use shadcn/ui components within your Preset Design System, ensuring consistency, accessibility, and maintainability across your platform.
