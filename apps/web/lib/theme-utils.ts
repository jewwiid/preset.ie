/**
 * Theme utilities for tweakcn compatibility
 * 
 * This file provides utilities to work with tweakcn themes
 * and demonstrates the uniform shadcn theme structure
 */

export type Theme = "light" | "dark"

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  "card-foreground": string
  popover: string
  "popover-foreground": string
  primary: string
  "primary-foreground": string
  secondary: string
  "secondary-foreground": string
  muted: string
  "muted-foreground": string
  accent: string
  "accent-foreground": string
  destructive: string
  "destructive-foreground": string
  border: string
  input: string
  ring: string
  radius: string
}

/**
 * Apply a tweakcn-generated theme to the document
 * @param themeColors - CSS custom property values from tweakcn
 * @param theme - light or dark mode
 */
export function applyTweakcnTheme(themeColors: Partial<ThemeColors>, theme: Theme = "light") {
  const root = document.documentElement
  
  // Apply theme colors as CSS custom properties
  Object.entries(themeColors).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--${key}`, value)
    }
  })
  
  // Toggle dark class
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

/**
 * Example tweakcn theme configurations
 * These would typically be generated from https://tweakcn.com/
 */
export const exampleThemes = {
  default: {
    light: {
      background: "0 0% 100%",
      foreground: "0 0% 3.9%",
      primary: "0 0% 9%",
      "primary-foreground": "0 0% 98%",
      secondary: "0 0% 96.1%",
      "secondary-foreground": "0 0% 9%",
      muted: "0 0% 96.1%",
      "muted-foreground": "0 0% 45.1%",
      accent: "0 0% 96.1%",
      "accent-foreground": "0 0% 9%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "0 0% 98%",
      border: "0 0% 89.8%",
      input: "0 0% 89.8%",
      ring: "0 0% 3.9%",
      radius: "0.5rem"
    },
    dark: {
      background: "0 0% 3.9%",
      foreground: "0 0% 98%",
      primary: "0 0% 98%",
      "primary-foreground": "0 0% 9%",
      secondary: "0 0% 14.9%",
      "secondary-foreground": "0 0% 98%",
      muted: "0 0% 14.9%",
      "muted-foreground": "0 0% 63.9%",
      accent: "0 0% 14.9%",
      "accent-foreground": "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      "destructive-foreground": "0 0% 98%",
      border: "0 0% 14.9%",
      input: "0 0% 14.9%",
      ring: "0 0% 83.1%"
    }
  },
  blue: {
    light: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      primary: "221.2 83.2% 53.3%",
      "primary-foreground": "210 40% 98%",
      secondary: "210 40% 96%",
      "secondary-foreground": "222.2 84% 4.9%",
      muted: "210 40% 96%",
      "muted-foreground": "215.4 16.3% 46.9%",
      accent: "210 40% 96%",
      "accent-foreground": "222.2 84% 4.9%",
      destructive: "0 84.2% 60.2%",
      "destructive-foreground": "210 40% 98%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "221.2 83.2% 53.3%",
      radius: "0.5rem"
    }
  }
}

/**
 * Check if the current project structure is compatible with tweakcn
 * @returns boolean indicating compatibility
 */
export function checkTweakcnCompatibility(): {
  compatible: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Check for required shadcn/ui structure
  const requiredVars = [
    "--background", "--foreground", "--primary", "--primary-foreground",
    "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
    "--accent", "--accent-foreground", "--destructive", "--destructive-foreground",
    "--border", "--input", "--ring"
  ]
  
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)
  
  requiredVars.forEach(cssVar => {
    const value = computedStyle.getPropertyValue(cssVar)
    if (!value.trim()) {
      issues.push(`Missing CSS variable: ${cssVar}`)
    }
  })
  
  // Check for hsl() format
  const backgroundValue = computedStyle.getPropertyValue("--background")
  if (backgroundValue && !backgroundValue.includes("hsl(")) {
    // This is acceptable - tweakcn works with raw HSL values
  }
  
  // Recommendations
  if (issues.length === 0) {
    recommendations.push("✅ All required CSS variables are present")
    recommendations.push("✅ Project structure is compatible with tweakcn")
    recommendations.push("🎨 Visit https://tweakcn.com/ to generate custom themes")
    recommendations.push("📋 Copy CSS variables from tweakcn and use applyTweakcnTheme()")
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    recommendations
  }
}