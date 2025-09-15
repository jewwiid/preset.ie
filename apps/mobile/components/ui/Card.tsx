import React from 'react'
import {
  View,
  ViewStyle,
  Platform,
} from 'react-native'
import { colors } from '../../styles/colors'
import { spacing, borderRadius, shadows } from '../../styles/spacing'

export interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'outline' | 'elevated'
  padding?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.component.card,
      overflow: 'hidden',
    }

    // Padding styles
    const paddingStyles: Record<string, ViewStyle> = {
      sm: {
        padding: spacing.component.padding.sm,
      },
      md: {
        padding: spacing.component.padding.md,
      },
      lg: {
        padding: spacing.component.padding.lg,
      },
      xl: {
        padding: spacing.component.padding.xl,
      },
    }

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: colors.background.primary,
        borderWidth: 1,
        borderColor: colors.border.primary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border.secondary,
      },
      elevated: {
        backgroundColor: colors.background.primary,
        ...Platform.select({
          ios: shadows.md,
          android: {
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
        }),
      },
    }

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...variantStyles[variant],
    }
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  )
}

// Card Header Component
export interface CardHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return (
    <View style={[{ paddingBottom: spacing.md }, style]}>
      {children}
    </View>
  )
}

// Card Content Component
export interface CardContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return (
    <View style={[{ paddingBottom: spacing.md }, style]}>
      {children}
    </View>
  )
}

// Card Footer Component
export interface CardFooterProps {
  children: React.ReactNode
  style?: ViewStyle
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  return (
    <View style={[{ paddingTop: spacing.md }, style]}>
      {children}
    </View>
  )
}
