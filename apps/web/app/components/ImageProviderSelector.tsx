'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ImageProvider {
  id: 'nanobanana' | 'seedream';
  name: string;
  emoji: string;
  costPerCredit: number;
  tagline: string;
}

const providers: ImageProvider[] = [
  {
    id: 'nanobanana',
    name: 'NanoBanana',
    emoji: '🍌',
    costPerCredit: 1,
    tagline: 'Fast & reliable'},
  {
    id: 'seedream',
    name: 'Seedream V4',
    emoji: '🌊',
    costPerCredit: 2,
    tagline: 'Higher quality'},
];

interface ImageProviderSelectorProps {
  selectedProvider: 'nanobanana' | 'seedream';
  onProviderChange: (provider: 'nanobanana' | 'seedream') => void;
  userCredits: number;
}

export function ImageProviderSelector({
  selectedProvider,
  onProviderChange,
  userCredits}: ImageProviderSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Provider</Label>

      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const canAfford = userCredits >= provider.costPerCredit;

          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-primary border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              } ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => canAfford && onProviderChange(provider.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{provider.emoji}</span>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        {provider.name}
                        {isSelected && (
                          <CheckCircle className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{provider.tagline}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{provider.costPerCredit} credit{provider.costPerCredit !== 1 ? 's' : ''}</span>
                  {!canAfford && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                      Insufficient
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
