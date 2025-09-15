import { Dimensions, PixelRatio } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// Base dimensions (iPhone 12 Pro)
const BASE_WIDTH = 390
const BASE_HEIGHT = 844

// Responsive scaling functions
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size
}

export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size
}

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor
}

// Font scaling
export const scaleFont = (size: number): number => {
  const newSize = scale(size)
  if (PixelRatio.get() < 3) {
    return newSize * 0.9
  }
  return newSize
}

// Device type detection
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375
}

export const isMediumDevice = (): boolean => {
  return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414
}

export const isLargeDevice = (): boolean => {
  return SCREEN_WIDTH >= 414
}

export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768
}

// Responsive breakpoints
export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
}

// Responsive utilities
export const getResponsiveValue = <T>(values: {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
}): T | undefined => {
  if (SCREEN_WIDTH >= breakpoints.xl && values.xl) return values.xl
  if (SCREEN_WIDTH >= breakpoints.lg && values.lg) return values.lg
  if (SCREEN_WIDTH >= breakpoints.md && values.md) return values.md
  if (SCREEN_WIDTH >= breakpoints.sm && values.sm) return values.sm
  return values.xs
}

// Grid utilities
export const getGridColumns = (): number => {
  if (isTablet()) return 3
  if (isLargeDevice()) return 2
  return 1
}

export const getCardWidth = (columns: number = 2, padding: number = 16): number => {
  return (SCREEN_WIDTH - (padding * (columns + 1))) / columns
}

// Spacing utilities
export const getSpacing = (multiplier: number = 1): number => {
  return moderateScale(16 * multiplier)
}

// Icon size utilities
export const getIconSize = (size: 'small' | 'medium' | 'large' | 'xlarge'): number => {
  const sizes = {
    small: moderateScale(16),
    medium: moderateScale(24),
    large: moderateScale(32),
    xlarge: moderateScale(48),
  }
  return sizes[size]
}

// Button size utilities
export const getButtonHeight = (size: 'small' | 'medium' | 'large'): number => {
  const heights = {
    small: moderateScale(32),
    medium: moderateScale(40),
    large: moderateScale(48),
  }
  return heights[size]
}

// Input size utilities
export const getInputHeight = (size: 'small' | 'medium' | 'large'): number => {
  const heights = {
    small: moderateScale(32),
    medium: moderateScale(40),
    large: moderateScale(48),
  }
  return heights[size]
}

// Typography utilities
export const getFontSize = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'): number => {
  const sizes = {
    xs: scaleFont(12),
    sm: scaleFont(14),
    base: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    '2xl': scaleFont(24),
    '3xl': scaleFont(30),
    '4xl': scaleFont(36),
  }
  return sizes[size]
}

// Border radius utilities
export const getBorderRadius = (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): number => {
  const radiuses = {
    sm: moderateScale(4),
    md: moderateScale(8),
    lg: moderateScale(12),
    xl: moderateScale(16),
    '2xl': moderateScale(20),
  }
  return radiuses[size]
}

// Shadow utilities
export const getShadow = (elevation: 'sm' | 'md' | 'lg' | 'xl'): any => {
  const shadows = {
    sm: {
      shadowOffset: { width: 0, height: moderateScale(1) },
      shadowOpacity: 0.05,
      shadowRadius: moderateScale(2),
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: moderateScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(4),
      elevation: 2,
    },
    lg: {
      shadowOffset: { width: 0, height: moderateScale(4) },
      shadowOpacity: 0.15,
      shadowRadius: moderateScale(8),
      elevation: 4,
    },
    xl: {
      shadowOffset: { width: 0, height: moderateScale(8) },
      shadowOpacity: 0.2,
      shadowRadius: moderateScale(16),
      elevation: 8,
    },
  }
  return shadows[elevation]
}

// Safe area utilities
export const getSafeAreaPadding = (): { top: number; bottom: number; left: number; right: number } => {
  return {
    top: moderateScale(44), // iOS status bar height
    bottom: moderateScale(34), // iOS home indicator height
    left: moderateScale(0),
    right: moderateScale(0),
  }
}

// Layout utilities
export const getContainerPadding = (): number => {
  return moderateScale(16)
}

export const getSectionSpacing = (): number => {
  return moderateScale(24)
}

export const getCardSpacing = (): number => {
  return moderateScale(16)
}

// Image utilities
export const getImageSize = (size: 'thumbnail' | 'small' | 'medium' | 'large' | 'hero'): { width: number; height: number } => {
  const sizes = {
    thumbnail: { width: moderateScale(40), height: moderateScale(40) },
    small: { width: moderateScale(80), height: moderateScale(80) },
    medium: { width: moderateScale(120), height: moderateScale(120) },
    large: { width: moderateScale(200), height: moderateScale(200) },
    hero: { width: SCREEN_WIDTH, height: moderateScale(300) },
  }
  return sizes[size]
}
