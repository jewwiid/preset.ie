import { Platform, Dimensions, StatusBar } from 'react-native'
import { colors } from '../styles/colors'

// Platform detection utilities
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isWeb = Platform.OS === 'web'

// Device dimensions
export const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
export const { width: windowWidth, height: windowHeight } = Dimensions.get('screen')

// Safe area utilities
export const getStatusBarHeight = () => {
  if (isIOS) {
    return 44 // iOS status bar height
  } else if (isAndroid) {
    return StatusBar.currentHeight || 24
  }
  return 0
}

export const getBottomSafeArea = () => {
  if (isIOS) {
    return 34 // iOS home indicator height
  }
  return 0
}

// Platform-specific styles
export const platformStyles = {
  // iOS-specific styles
  ios: {
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    card: {
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }),
    },
    button: {
      borderRadius: 12,
      ...Platform.select({
        ios: {
          shadowColor: colors.preset[500],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
      }),
    },
    navigationBar: {
      backgroundColor: colors.background.primary,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border.primary,
    },
    tabBar: {
      backgroundColor: colors.background.primary,
      borderTopWidth: 0.5,
      borderTopColor: colors.border.primary,
    },
  },
  
  // Android-specific styles
  android: {
    elevation: {
      elevation: 2,
    },
    card: {
      backgroundColor: colors.background.primary,
      borderRadius: 8,
      elevation: 2,
    },
    button: {
      borderRadius: 8,
      elevation: 2,
    },
    navigationBar: {
      backgroundColor: colors.preset[500],
      elevation: 4,
    },
    tabBar: {
      backgroundColor: colors.background.primary,
      elevation: 8,
    },
  },
  
  // Cross-platform styles
  common: {
    card: {
      backgroundColor: colors.background.primary,
      borderRadius: isIOS ? 12 : 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    button: {
      borderRadius: isIOS ? 12 : 8,
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
  },
}

// Platform-specific colors
export const platformColors = {
  ios: {
    systemBlue: '#007AFF',
    systemGreen: '#34C759',
    systemRed: '#FF3B30',
    systemYellow: '#FFCC00',
    systemPurple: '#AF52DE',
    systemOrange: '#FF9500',
    separator: '#C6C6C8',
    groupedBackground: '#F2F2F7',
  },
  android: {
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    surface: '#FFFFFF',
    surfaceVariant: '#F4F0F7',
    outline: '#79747E',
  },
}

// Platform-specific fonts
export const platformFonts = {
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    mono: 'monospace',
  },
}

// Platform-specific animations
export const platformAnimations = {
  ios: {
    spring: {
      damping: 0.8,
      stiffness: 100,
    },
    timing: {
      duration: 300,
      easing: 'ease-in-out',
    },
  },
  android: {
    spring: {
      damping: 0.7,
      stiffness: 120,
    },
    timing: {
      duration: 250,
      easing: 'ease-in-out',
    },
  },
}

// Platform-specific haptics
export const hapticFeedback = {
  light: () => {
    if (isIOS) {
      // Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else if (isAndroid) {
      // Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  },
  medium: () => {
    if (isIOS) {
      // Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else if (isAndroid) {
      // Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  },
  heavy: () => {
    if (isIOS) {
      // Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } else if (isAndroid) {
      // Use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
  },
  success: () => {
    if (isIOS) {
      // Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else if (isAndroid) {
      // Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
  },
  error: () => {
    if (isIOS) {
      // Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } else if (isAndroid) {
      // Use Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  },
}

// Platform-specific keyboard behavior
export const keyboardBehavior = {
  ios: 'padding',
  android: 'height',
}

// Platform-specific status bar styles
export const statusBarStyle = {
  ios: 'dark-content',
  android: 'light-content',
}

// Platform-specific navigation behavior
export const navigationBehavior = {
  ios: {
    headerBackTitleVisible: false,
    headerLargeTitle: true,
    headerTransparent: false,
  },
  android: {
    headerBackTitleVisible: false,
    headerLargeTitle: false,
    headerTransparent: false,
  },
}
