'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Image, Sparkles } from 'lucide-react';

interface ImageProvider {
  id: 'nanobanana' | 'seedream';
  name: string;
  description: string;
  features: string[];
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
  costPerCredit: number;
  icon: React.ReactNode;
}

const providers: ImageProvider[] = [
  {
    id: 'nanobanana',
    name: 'NanoBanana',
    description: 'Fast and reliable image generation with good quality',
    features: ['Text-to-image', 'Image editing', 'Fast processing', 'Stable API'],
    speed: 'fast',
    quality: 'high',
    costPerCredit: 1,
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: 'seedream',
    name: 'Seedream V4',
    description: 'State-of-the-art image generation with superior quality',
    features: ['Multi-modal generation', 'Ultra-high resolution', 'Advanced editing', '2K output'],
    speed: 'medium',
    quality: 'high',
    costPerCredit: 2,
    icon: <Sparkles className="h-5 w-5" />,
  },
];

interface ImageProviderSelectorProps {
  selectedProvider: 'nanobanana' | 'seedream';
  onProviderChange: (provider: 'nanobanana' | 'seedream') => void;
  userCredits: number;
}

export function ImageProviderSelector({
  selectedProvider,
  onProviderChange,
  userCredits,
}: ImageProviderSelectorProps) {
  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'fast': return 'bg-primary/10 text-primary';
      case 'medium': return 'bg-primary/10 text-primary';
      case 'slow': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-primary/10 text-primary';
      case 'medium': return 'bg-primary/10 text-primary';
      case 'low': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Choose Image Provider</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferred AI image generation provider
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const canAfford = userCredits >= provider.costPerCredit;
          const estimatedImages = Math.floor(userCredits / provider.costPerCredit);

          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              } ${!canAfford ? 'opacity-50' : ''}`}
              onClick={() => canAfford && onProviderChange(provider.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {provider.icon}
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <CardDescription className="text-sm">
                  {provider.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Speed & Quality */}
                  <div className="flex space-x-2">
                    <Badge className={getSpeedColor(provider.speed)}>
                      {provider.speed} speed
                    </Badge>
                    <Badge className={getQualityColor(provider.quality)}>
                      {provider.quality} quality
                    </Badge>
                  </div>

                  {/* Cost & Affordability */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Cost per image:</span>
                      <span className="font-medium">{provider.costPerCredit} credit{provider.costPerCredit !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>You can generate:</span>
                      <span className="font-medium">
                        {estimatedImages} image{estimatedImages !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {!canAfford && (
                    <div className="text-xs text-destructive bg-destructive/5 p-2 rounded">
                      Insufficient credits. Need at least {provider.costPerCredit} credit{provider.costPerCredit !== 1 ? 's' : ''}.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Note:</strong> You can switch providers at any time. Each provider has different 
          capabilities and pricing. Seedream V4 offers higher quality but costs more credits.
        </p>
      </div>
    </div>
  );
}
