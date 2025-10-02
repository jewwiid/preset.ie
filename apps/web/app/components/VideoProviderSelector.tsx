'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Sparkles, Zap } from 'lucide-react';

interface VideoProvider {
  id: 'seedream' | 'wan';
  name: string;
  description: string;
  features: string[];
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
  costPerCredit: number;
  icon: React.ReactNode;
  isAvailable: boolean;
}

const providers: VideoProvider[] = [
  {
    id: 'seedream',
    name: 'Seedream Video',
    description: 'High-quality AI video generation with smooth motion',
    features: ['Image-to-video', 'Smooth motion', 'High quality', 'Fast processing'],
    speed: 'medium',
    quality: 'high',
    costPerCredit: 8,
    icon: <Sparkles className="h-5 w-5" />,
    isAvailable: true,
  },
  {
    id: 'wan',
    name: 'Wan 2.5',
    description: 'Advanced video generation with superior motion quality (Coming Soon)',
    features: ['Ultra-smooth motion', 'Extended duration', 'Advanced effects', '4K output'],
    speed: 'medium',
    quality: 'high',
    costPerCredit: 12,
    icon: <Zap className="h-5 w-5" />,
    isAvailable: false,
  },
];

interface VideoProviderSelectorProps {
  selectedProvider: 'seedream' | 'wan';
  onProviderChange: (provider: 'seedream' | 'wan') => void;
  userCredits: number;
}

export function VideoProviderSelector({
  selectedProvider,
  onProviderChange,
  userCredits,
}: VideoProviderSelectorProps) {
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
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Choose Video Provider</h3>
        <p className="text-xs text-muted-foreground">
          Select your preferred AI video generation provider
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const canAfford = userCredits >= provider.costPerCredit;
          const estimatedVideos = Math.floor(userCredits / provider.costPerCredit);
          const isDisabled = !provider.isAvailable || !canAfford;

          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && onProviderChange(provider.id)}
            >
              <div className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {provider.icon}
                    <h4 className="text-sm font-semibold">{provider.name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {!provider.isAvailable && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Coming Soon
                      </Badge>
                    )}
                    {isSelected && provider.isAvailable && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs leading-tight text-muted-foreground">
                  {provider.description}
                </p>

                {/* Features */}
                <div>
                  <h5 className="text-xs font-medium mb-1.5">Features</h5>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Speed & Quality */}
                <div className="flex space-x-1.5">
                  <Badge className={`${getSpeedColor(provider.speed)} text-[10px] px-1.5 py-0`}>
                    {provider.speed} speed
                  </Badge>
                  <Badge className={`${getQualityColor(provider.quality)} text-[10px] px-1.5 py-0`}>
                    {provider.quality} quality
                  </Badge>
                </div>

                {/* Cost & Affordability */}
                {provider.isAvailable && (
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost per video:</span>
                      <span className="font-medium">{provider.costPerCredit} credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You can generate:</span>
                      <span className="font-medium">
                        {estimatedVideos} video{estimatedVideos !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {!canAfford && provider.isAvailable && (
                  <div className="text-[10px] text-destructive bg-destructive/5 p-1.5 rounded">
                    Insufficient credits. Need at least {provider.costPerCredit} credits.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        <strong>Note:</strong> You can switch providers at any time. Wan 2.5 will offer advanced motion quality and extended duration options when available.
      </p>
    </div>
  );
}
