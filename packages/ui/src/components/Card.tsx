import { styled } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';

export const Card = styled(YStack, {
  name: 'PresetCard',
  backgroundColor: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$4',
  padding: '$4',
  shadowColor: '#00000010',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 3,
  elevation: 1,
  
  variants: {
    variant: {
      default: {
        backgroundColor: '$background',
        borderColor: '$borderColor',
      },
      
      elevated: {
        backgroundColor: '$background',
        borderColor: '$borderColor',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 3,
      },
      
      outlined: {
        backgroundColor: 'transparent',
        borderColor: '$borderColor',
        borderWidth: 1,
      },
    },
    
    size: {
      sm: {
        padding: '$3',
        borderRadius: '$3',
      },
      
      md: {
        padding: '$4',
        borderRadius: '$4',
      },
      
      lg: {
        padding: '$5',
        borderRadius: '$4',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export const CardHeader = styled(YStack, {
  name: 'PresetCardHeader',
  marginBottom: '$3',
  gap: '$1',
});

export const CardContent = styled(YStack, {
  name: 'PresetCardContent',
  gap: '$2',
});

export const CardFooter = styled(YStack, {
  name: 'PresetCardFooter',
  marginTop: '$3',
  gap: '$2',
});

export type CardProps = typeof Card extends (...args: any[]) => any
  ? Parameters<typeof Card>[0]
  : never;