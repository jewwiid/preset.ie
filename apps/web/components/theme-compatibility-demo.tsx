"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { applyTweakcnTheme, exampleThemes, checkTweakcnCompatibility } from "@/lib/theme-utils"

/**
 * Demo component showing tweakcn theme compatibility
 * This demonstrates how all shadcn/ui components work uniformly with theme switching
 */
export function ThemeCompatibilityDemo() {
  const [currentTheme, setCurrentTheme] = useState<"default" | "blue">("default")
  const [isDark, setIsDark] = useState(false)

  const handleThemeChange = (theme: "default" | "blue") => {
    setCurrentTheme(theme)
    const themeColors = (exampleThemes[theme] as any)[isDark ? "dark" : "light"]
    if (typeof window !== "undefined") {
      applyTweakcnTheme(themeColors, isDark ? "dark" : "light")
    }
  }

  const handleModeToggle = () => {
    const newMode = !isDark
    setIsDark(newMode)
    const themeColors = (exampleThemes[currentTheme] as any)[newMode ? "dark" : "light"]
    if (typeof window !== "undefined") {
      applyTweakcnTheme(themeColors, newMode ? "dark" : "light")
    }
  }

  const runCompatibilityCheck = () => {
    if (typeof window !== "undefined") {
      const result = checkTweakcnCompatibility()
      alert(`Compatibility: ${result.compatible ? "✅ Compatible" : "❌ Issues found"}\\n\\n${result.recommendations.join("\\n")}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tweakcn Theme Compatibility Demo</CardTitle>
          <CardDescription>
            This demo shows how your shadcn/ui components work uniformly with theme switching,
            making them fully compatible with tweakcn theme generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              variant={currentTheme === "default" ? "default" : "outline"}
              onClick={() => handleThemeChange("default")}
            >
              Default Theme
            </Button>
            <Button 
              variant={currentTheme === "blue" ? "default" : "outline"}
              onClick={() => handleThemeChange("blue")}
            >
              Blue Theme
            </Button>
            <Button variant="secondary" onClick={handleModeToggle}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button variant="outline" onClick={runCompatibilityCheck}>
              Check Compatibility
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Component Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>All form elements use uniform theme variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Theme-aware input" />
            <Textarea placeholder="Theme-aware textarea" />
            <div className="flex items-center space-x-2">
              <Checkbox id="demo-checkbox" />
              <label htmlFor="demo-checkbox">Themed checkbox</label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="demo-switch" />
              <label htmlFor="demo-switch">Themed switch</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UI Components</CardTitle>
            <CardDescription>Visual components adapt to theme changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>TC</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
          <CardDescription>Complex components maintain theme consistency</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>Theme System Overview</AccordionTrigger>
              <AccordionContent>
                Your project uses a uniform shadcn/ui theme system with CSS custom properties.
                All components reference the same set of theme variables, ensuring consistent
                styling across theme changes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Tweakcn Integration</AccordionTrigger>
              <AccordionContent>
                Tweakcn generates CSS custom properties that directly replace your existing
                theme variables. This allows for seamless theme switching without component changes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How to Use Tweakcn</AccordionTrigger>
              <AccordionContent>
                1. Visit https://tweakcn.com/ <br />
                2. Customize your theme using the visual editor <br />
                3. Export the CSS variables <br />
                4. Replace the values in your globals.css :root section <br />
                5. All components update automatically!
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>All button variants use consistent theme variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🎨</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}