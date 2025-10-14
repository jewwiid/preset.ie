'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Camera, Sparkles } from 'lucide-react';

interface GenerationContextCardProps {
  generationMode: 'text-to-image' | 'image-to-image';
  style: string;
  resolution: string;
  aspectRatio: string;
  imageUrl?: string;
  customStylePreset?: any;
  cinematicParameters?: any;
  validationState: {
    prompt: boolean;
    style: boolean;
    resolution: boolean;
    aspectRatio: boolean;
    generationMode: boolean;
    imageUrl: boolean;
  };
  originalPrompt: string;
  enhancedPrompt?: string;
  useEnhancedPrompt: boolean;
  onToggleEnhancedPrompt: (value: boolean) => void;
}

export function GenerationContextCard({
  generationMode,
  style,
  resolution,
  aspectRatio,
  imageUrl,
  customStylePreset,
  cinematicParameters,
  validationState,
  originalPrompt,
  enhancedPrompt,
  useEnhancedPrompt,
  onToggleEnhancedPrompt}: GenerationContextCardProps) {
  return (
    <Card className="border-border bg-primary/5 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Generation Context
        </CardTitle>
        <CardDescription className="text-sm">
          Current settings and parameters for your image generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {useEnhancedPrompt ? 'Enhanced Prompt' : 'Original Prompt'}
              </span>
              {enhancedPrompt && (
                <Badge variant="secondary" className="text-xs">
                  Enhanced Available
                </Badge>
              )}
              {originalPrompt && originalPrompt.trim().length < 10 && (
                <Badge variant="destructive" className="text-xs">
                  Too Short
                </Badge>
              )}
            </div>
            {enhancedPrompt && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Use Enhanced</span>
                <Switch
                  checked={useEnhancedPrompt}
                  onCheckedChange={onToggleEnhancedPrompt}
                  className="scale-75"
                />
              </div>
            )}
          </div>
          <div className="bg-card rounded-lg border border-border p-3">
            <p
              className={`text-sm leading-relaxed ${
                !originalPrompt || originalPrompt.trim().length < 10 ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {useEnhancedPrompt && enhancedPrompt ? enhancedPrompt : originalPrompt || 'No prompt provided'}
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Style</span>
              {!validationState.style && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div className={`text-sm font-medium ${!validationState.style ? 'text-destructive' : 'text-foreground'}`}>
              {style || 'Not selected'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Resolution</span>
              {!validationState.resolution && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div
              className={`text-sm font-medium ${!validationState.resolution ? 'text-destructive' : 'text-foreground'}`}
            >
              {resolution || 'Not selected'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Aspect Ratio</span>
              {!validationState.aspectRatio && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div
              className={`text-sm font-medium ${!validationState.aspectRatio ? 'text-destructive' : 'text-foreground'}`}
            >
              {aspectRatio || 'Not selected'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Mode</span>
              {!validationState.generationMode && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            <div
              className={`text-sm font-medium ${!validationState.generationMode ? 'text-destructive' : 'text-foreground'}`}
            >
              {generationMode || 'Not selected'}
            </div>
          </div>
        </div>

        {/* Custom Preset */}
        {customStylePreset && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Custom Preset</span>
            <div className="bg-card rounded-lg border border-border p-2">
              <div className="text-sm font-medium text-foreground">{customStylePreset.name}</div>
            </div>
          </div>
        )}

        {/* Cinematic Parameters */}
        {cinematicParameters && Object.keys(cinematicParameters).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Cinematic Parameters</span>
            <div className="bg-card rounded-lg border border-border p-2">
              <div className="space-y-1">
                {Object.entries(cinematicParameters).map(([key, value]) => {
                  if (value && typeof value === 'string') {
                    return (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-medium text-foreground">
                          {value
                            .split('-')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
