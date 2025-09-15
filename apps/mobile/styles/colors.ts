// Preset Brand Colors - Mobile Design System
export const colors = {
  preset: {
    50: '#f0fdf9',
    100: '#ccfbef',
    200: '#99f6e0',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#00876f', // Primary Brand
    600: '#0d7d72',
    700: '#15706b',
    800: '#155e56',
    900: '#134e48',
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Platform specific colors
  ios: {
    systemBlue: '#007AFF',
    systemGreen: '#34C759',
    systemRed: '#FF3B30',
    systemYellow: '#FFCC00',
    systemPurple: '#AF52DE',
    systemOrange: '#FF9500',
  },
  
  android: {
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },
  
  // Border colors
  border: {
    primary: '#e5e7eb',
    secondary: '#d1d5db',
    focus: '#00876f',
  },
}

// Dark mode colors
export const darkColors = {
  preset: {
    50: '#134e48',
    100: '#155e56',
    200: '#15706b',
    300: '#0d7d72',
    400: '#00876f',
    500: '#2dd4bf', // Primary Brand (inverted)
    600: '#5eead4',
    700: '#99f6e0',
    800: '#ccfbef',
    900: '#f0fdf9',
  },
  
  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral colors
  gray: {
    50: '#111827',
    100: '#1f2937',
    200: '#374151',
    300: '#4b5563',
    400: '#6b7280',
    500: '#9ca3af',
    600: '#d1d5db',
    700: '#e5e7eb',
    800: '#f3f4f6',
    900: '#f9fafb',
  },
  
  // Background colors
  background: {
    primary: '#111827',
    secondary: '#1f2937',
    tertiary: '#374151',
  },
  
  // Text colors
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
    inverse: '#111827',
  },
  
  // Border colors
  border: {
    primary: '#374151',
    secondary: '#4b5563',
    focus: '#2dd4bf',
  },
}

// Gradient definitions
export const gradients = {
  preset: ['#00876f', '#2dd4bf'],
  presetLight: ['#f0fdf9', '#ccfbef'],
  presetDark: ['#134e48', '#155e56'],
  success: ['#10b981', '#059669'],
  warning: ['#f59e0b', '#d97706'],
  error: ['#ef4444', '#dc2626'],
  info: ['#3b82f6', '#2563eb'],
}

// Shadow definitions
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
}
