import React from 'react'
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { colors } from '../../styles/colors'
import { typography } from '../../styles/typography'
import { spacing, borderRadius } from '../../styles/spacing'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  size?: 'sm' | 'default' | 'lg'
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
}) => {
  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.component.badge,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    }

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: spacing.component.padding.xs,
        paddingVertical: 2,
        minHeight: 20,
      },
      default: {
        paddingHorizontal: spacing.component.padding.sm,
        paddingVertical: spacing.component.padding.xs,
        minHeight: 24,
      },
      lg: {
        paddingHorizontal: spacing.component.padding.md,
        paddingVertical: spacing.component.padding.sm,
        minHeight: 28,
      },
    }

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: colors.preset[500],
      },
      secondary: {
        backgroundColor: colors.gray[100],
      },
      destructive: {
        backgroundColor: colors.error,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.preset[500],
      },
      success: {
        backgroundColor: colors.success,
      },
      warning: {
        backgroundColor: colors.warning,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: typography.fontWeight.medium,
      textAlign: 'center',
    }

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: {
        fontSize: typography.fontSize.xs,
      },
      default: {
        fontSize: typography.fontSize.sm,
      },
      lg: {
        fontSize: typography.fontSize.base,
      },
    }

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      default: {
        color: colors.text.inverse,
      },
      secondary: {
        color: colors.text.primary,
      },
      destructive: {
        color: colors.text.inverse,
      },
      outline: {
        color: colors.preset[500],
      },
      success: {
        color: colors.text.inverse,
      },
      warning: {
        color: colors.text.inverse,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>{children}</Text>
    </View>
  )
}
