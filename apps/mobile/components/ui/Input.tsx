import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Platform,
} from 'react-native'
import { colors } from '../../styles/colors'
import { typography } from '../../styles/typography'
import { spacing, borderRadius } from '../../styles/spacing'

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'outline' | 'filled'
  size?: 'sm' | 'default' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: ViewStyle
  inputStyle?: TextStyle
  labelStyle?: TextStyle
  errorStyle?: TextStyle
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'default',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: spacing.sm,
    }

    return {
      ...baseStyle,
    }
  }

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: borderRadius.component.input,
      borderWidth: 1,
      borderColor: error ? colors.error : isFocused ? colors.border.focus : colors.border.primary,
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
        backgroundColor: colors.background.primary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
      },
      filled: {
        backgroundColor: colors.background.secondary,
        borderWidth: 0,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: typography.fontSize.base,
      color: colors.text.primary,
      ...Platform.select({
        ios: {
          paddingVertical: 0,
        },
        android: {
          paddingVertical: 0,
        },
      }),
    }

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: {
        fontSize: typography.fontSize.sm,
      },
      default: {
        fontSize: typography.fontSize.base,
      },
      lg: {
        fontSize: typography.fontSize.lg,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
    }
  }

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    }
  }

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: typography.fontSize.xs,
      color: colors.error,
      marginTop: spacing.xs,
    }
  }

  const getHelperTextStyle = (): TextStyle => {
    return {
      fontSize: typography.fontSize.xs,
      color: colors.text.tertiary,
      marginTop: spacing.xs,
    }
  }

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>{label}</Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={{ marginRight: spacing.sm }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.text.tertiary}
          {...props}
        />
        
        {rightIcon && (
          <View style={{ marginLeft: spacing.sm }}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Text style={[getErrorStyle(), errorStyle]}>{error}</Text>
      )}
      
      {helperText && !error && (
        <Text style={getHelperTextStyle()}>{helperText}</Text>
      )}
    </View>
  )
}
