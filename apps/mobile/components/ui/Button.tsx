import React from 'react'
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { colors } from '../../styles/colors'
import { typography } from '../../styles/typography'
import { spacing, borderRadius } from '../../styles/spacing'

export interface ButtonProps {
  children: React.ReactNode
  onPress: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle | ViewStyle[]
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.component.button,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.5 : 1,
    }

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: {
        paddingHorizontal: spacing.component.padding.sm,
        paddingVertical: spacing.component.padding.xs,
        minHeight: 32,
      },
      default: {
        paddingHorizontal: spacing.component.padding.md,
        paddingVertical: spacing.component.padding.sm,
        minHeight: 40,
      },
      lg: {
        paddingHorizontal: spacing.component.padding.lg,
        paddingVertical: spacing.component.padding.md,
        minHeight: 48,
      },
    }

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: colors.preset[500],
        ...Platform.select({
          ios: {
            shadowColor: colors.preset[500],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.preset[500],
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      link: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 0,
        minHeight: 'auto',
      },
      destructive: {
        backgroundColor: colors.error,
        ...Platform.select({
          ios: {
            shadowColor: colors.error,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
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
      sm: typography.buttonSmall,
      default: typography.button,
      lg: typography.buttonLarge,
    }

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      default: {
        color: colors.text.inverse,
      },
      outline: {
        color: colors.preset[500],
      },
      ghost: {
        color: colors.preset[500],
      },
      link: {
        color: colors.preset[500],
        textDecorationLine: 'underline',
      },
      destructive: {
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
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? colors.text.inverse : colors.preset[500]}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  )
}
