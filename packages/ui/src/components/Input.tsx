import { styled } from '@tamagui/core';
import { Input as TamaguiInput } from '@tamagui/input';

export const Input = styled(TamaguiInput, {
  name: 'PresetInput',
  backgroundColor: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$3',
  color: '$color',
  
  variants: {
    variant: {
      default: {
        backgroundColor: '$background',
        borderColor: '$borderColor',
        
        focusStyle: {
          borderColor: '$brandPrimary',
        },
      },
      
      filled: {
        backgroundColor: '$gray2',
        borderColor: 'transparent',
        
        focusStyle: {
          backgroundColor: '$background',
          borderColor: '$brandPrimary',
        },
      },
    },
    
    size: {
      sm: {
        height: '$7',
        paddingHorizontal: '$3',
        borderRadius: '$2',
      },
      
      md: {
        height: '$8',
        paddingHorizontal: '$4',
        borderRadius: '$3',
      },
      
      lg: {
        height: '$10',
        paddingHorizontal: '$5',
        borderRadius: '$3',
      },
    },
    
    error: {
      true: {
        borderColor: '$red9',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'default',
    size: 'md',
    error: false,
  },
});

export type InputProps = any;