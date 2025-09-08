import { styled, Text as TamaguiText } from '@tamagui/core';

export const Text = styled(TamaguiText, {
  name: 'PresetText',
  color: '$color',
  fontFamily: '$body',
  
  variants: {
    variant: {
      heading: {
        fontFamily: '$heading',
        fontWeight: '$7',
        color: '$color',
      },
      
      body: {
        fontFamily: '$body',
        fontWeight: '$4',
        color: '$color',
      },
      
      caption: {
        fontFamily: '$body',
        fontWeight: '$4',
        color: '$gray11',
      },
      
      muted: {
        fontFamily: '$body',
        fontWeight: '$4',
        color: '$gray10',
      },
      
      brand: {
        fontFamily: '$body',
        fontWeight: '$5',
        color: '$brandPrimary',
      },
    },
    
    size: {
      xs: {
        fontSize: '$1',
        lineHeight: '$1',
      },
      
      sm: {
        fontSize: '$2',
        lineHeight: '$2',
      },
      
      md: {
        fontSize: '$3',
        lineHeight: '$3',
      },
      
      lg: {
        fontSize: '$4',
        lineHeight: '$4',
      },
      
      xl: {
        fontSize: '$5',
        lineHeight: '$5',
      },
      
      '2xl': {
        fontSize: '$6',
        lineHeight: '$6',
      },
      
      '3xl': {
        fontSize: '$7',
        lineHeight: '$7',
      },
      
      '4xl': {
        fontSize: '$8',
        lineHeight: '$8',
      },
    },
    
    weight: {
      light: {
        fontWeight: '$3',
      },
      
      normal: {
        fontWeight: '$4',
      },
      
      medium: {
        fontWeight: '$5',
      },
      
      semibold: {
        fontWeight: '$6',
      },
      
      bold: {
        fontWeight: '$7',
      },
    },
  } as const,
  
  defaultVariants: {
    variant: 'body',
    size: 'md',
    weight: 'normal',
  },
});

// Pre-configured heading components
export const Heading = styled(Text, {
  variant: 'heading',
  weight: 'bold',
});

export const H1 = styled(Heading, { size: '4xl' });
export const H2 = styled(Heading, { size: '3xl' });
export const H3 = styled(Heading, { size: '2xl' });
export const H4 = styled(Heading, { size: 'xl' });
export const H5 = styled(Heading, { size: 'lg' });
export const H6 = styled(Heading, { size: 'md' });

// Body text variants
export const Body = styled(Text, { variant: 'body' });
export const BodyLarge = styled(Body, { size: 'lg' });
export const BodySmall = styled(Body, { size: 'sm' });

// Caption and helper text
export const Caption = styled(Text, {
  variant: 'caption',
  size: 'sm',
});

export const Muted = styled(Text, {
  variant: 'muted',
  size: 'sm',
});

export type TextProps = any;