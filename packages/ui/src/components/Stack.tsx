import { styled } from '@tamagui/core';
import { XStack, YStack, ZStack } from '@tamagui/stacks';

// Enhanced XStack (horizontal) with preset-specific defaults
export const HStack = styled(XStack, {
  name: 'PresetHStack',
  
  variants: {
    spacing: {
      xs: { gap: '$1' },
      sm: { gap: '$2' },
      md: { gap: '$3' },
      lg: { gap: '$4' },
      xl: { gap: '$5' },
    },
    
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
    },
    
    justify: {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      between: { justifyContent: 'space-between' },
      around: { justifyContent: 'space-around' },
      evenly: { justifyContent: 'space-evenly' },
    },
  } as const,
  
  defaultVariants: {
    spacing: 'md',
    align: 'center',
    justify: 'start',
  },
});

// Enhanced YStack (vertical) with preset-specific defaults
export const VStack = styled(YStack, {
  name: 'PresetVStack',
  
  variants: {
    spacing: {
      xs: { gap: '$1' },
      sm: { gap: '$2' },
      md: { gap: '$3' },
      lg: { gap: '$4' },
      xl: { gap: '$5' },
    },
    
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
    },
    
    justify: {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      between: { justifyContent: 'space-between' },
      around: { justifyContent: 'space-around' },
      evenly: { justifyContent: 'space-evenly' },
    },
  } as const,
  
  defaultVariants: {
    spacing: 'md',
    align: 'stretch',
    justify: 'start',
  },
});

// Enhanced ZStack (layered) with preset-specific defaults
export const Stack = styled(ZStack, {
  name: 'PresetStack',
  
  variants: {
    align: {
      start: { alignItems: 'flex-start' },
      center: { alignItems: 'center' },
      end: { alignItems: 'flex-end' },
      stretch: { alignItems: 'stretch' },
    },
    
    justify: {
      start: { justifyContent: 'flex-start' },
      center: { justifyContent: 'center' },
      end: { justifyContent: 'flex-end' },
      between: { justifyContent: 'space-between' },
      around: { justifyContent: 'space-around' },
      evenly: { justifyContent: 'space-evenly' },
    },
  } as const,
  
  defaultVariants: {
    align: 'center',
    justify: 'center',
  },
});

// Export original Tamagui stacks for flexibility
export { XStack, YStack, ZStack };

// Type definitions
export type HStackProps = any;
export type VStackProps = any;
export type StackProps = any;