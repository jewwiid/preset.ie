import { styled } from '@tamagui/core';
import { Button as TamaguiButton } from '@tamagui/button';

export const Button = styled(TamaguiButton, {
  name: 'PresetButton',
  backgroundColor: '$brandPrimary',
  color: 'white',
  borderRadius: '$4',
  
  variants: {
    variant: {
      primary: {
        backgroundColor: '$brandPrimary',
        color: 'white',
        borderColor: '$brandPrimary',
      },
      
      secondary: {
        backgroundColor: '$background',
        color: '$color',
        borderColor: '$borderColor',
      },
      
      outline: {
        backgroundColor: 'transparent',
        color: '$brandPrimary',
        borderColor: '$brandPrimary',
        borderWidth: 1,
      },
    },
    
    size: {
      sm: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
        fontSize: '$2',
        height: '$7',
      },
      
      md: {
        paddingHorizontal: '$4',
        paddingVertical: '$3',
        fontSize: '$3',
        height: '$8',
      },
      
      lg: {
        paddingHorizontal: '$5',
        paddingVertical: '$4',
        fontSize: '$4',
        height: '$10',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonProps = typeof Button extends (...args: any[]) => any
  ? Parameters<typeof Button>[0]
  : never;