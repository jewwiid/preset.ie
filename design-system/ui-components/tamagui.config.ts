import { createTamagui } from '@tamagui/core';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';
import { createAnimations } from '@tamagui/animations-react-native';

const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
});

const media = {
  xs: { maxWidth: 475 },
  sm: { maxWidth: 640 },
  md: { maxWidth: 768 },
  lg: { maxWidth: 1024 },
  xl: { maxWidth: 1280 },
  xxl: { maxWidth: 1536 },
  gtXs: { minWidth: 476 },
  gtSm: { minWidth: 641 },
  gtMd: { minWidth: 769 },
  gtLg: { minWidth: 1025 },
  gtXl: { minWidth: 1281 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
  hoverNone: { hover: 'none' },
  pointerCoarse: { pointer: 'coarse' },
};

const headingFont = createInterFont({
  transform: {
    6: 'uppercase',
    7: 'none',
  },
  color: {
    6: '$colorFocus',
    7: '$color',
  },
  letterSpacing: {
    5: 2,
    6: 1,
    7: 0,
    8: -1,
    9: -2,
    10: -3,
    12: -4,
    14: -5,
    15: -6,
  },
});

const bodyFont = createInterFont({
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    14: -4,
    15: -6,
  },
});

// Extended tokens with our brand colors
const customTokens = {
  color: {
    brandPrimary: '#00876f',
    brandSecondary: '#ccfbef', 
    brandAccent: '#f59e0b',
    ...tokens.color,
  },
  space: tokens.space,
  size: tokens.size,
  radius: tokens.radius,
  zIndex: tokens.zIndex,
};

// Custom themes with our brand colors
const customThemes = {
  ...themes,
  light: {
    ...themes.light,
    brandPrimary: '#00876f',
    brandSecondary: '#ccfbef',
    brandAccent: '#f59e0b',
  },
  dark: {
    ...themes.dark,
    brandPrimary: '#2dd4bf',
    brandSecondary: '#134e48',
    brandAccent: '#fbbf24',
  },
};

export const config = createTamagui({
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens: customTokens,
  themes: customThemes,
  media,
});

export default config;

export type Conf = typeof config;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}