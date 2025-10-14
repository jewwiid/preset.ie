'use client';

import React from 'react';
import { HelpCircle, Sparkles, Mic, MousePointer, AtSign } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MentionHelpTooltipProps {
  children: React.ReactNode;
  context?: 'generate' | 'stitch' | 'edit' | 'video' | 'batch';
}

export default function MentionHelpTooltip({ children, context = 'generate' }: MentionHelpTooltipProps) {
  const getContextExamples = () => {
    switch (context) {
      case 'generate':
        return [
          "A @portrait of a woman during @golden-hour with @wide-angle lens",
          "Create a @landscape with @dramatic-lighting and @rule-of-thirds composition",
          "Design a @product shot with @studio-lighting and @clean-background"
        ];
      case 'stitch':
        return [
          "Combine @image-1 with @image-2 using @seamless-blend technique",
          "Merge @portrait with @landscape using @double-exposure style",
          "Blend @source-image with @reference-image using @soft-transition"
        ];
      case 'edit':
        return [
          "Enhance @portrait with @vintage-style and @warm-tones",
          "Apply @film-grain to @landscape with @35mm-lens effect",
          "Edit @product with @professional-retouching and @color-grading"
        ];
      case 'video':
        return [
          "Create @cinematic-motion with @smooth-pan and @24fps",
          "Animate @character with @walking-cycle and @natural-movement",
          "Generate @time-lapse of @cityscape with @dramatic-transitions"
        ];
      case 'batch':
        return [
          "Process @multiple-images with @consistent-style and @batch-settings",
          "Apply @preset-1 to @image-set with @variation-control",
          "Generate @series with @progressive-enhancement and @quality-optimization"
        ];
      default:
        return [
          "A @portrait with @dramatic-lighting and @professional-composition",
          "Create @landscape with @cinematic-style and @golden-hour mood"
        ];
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'generate':
        return "Generate images with cinematic parameters, subjects, and styles";
      case 'stitch':
        return "Blend and combine multiple images with advanced techniques";
      case 'edit':
        return "Enhance and modify existing images with professional effects";
      case 'video':
        return "Create animated content with motion and cinematic techniques";
      case 'batch':
        return "Process multiple images with consistent styling and parameters";
      default:
        return "Use mentions to reference cinematic parameters, subjects, and styles";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md p-0">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AtSign className="h-4 w-4 text-primary" />
                Smart Mentions
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {getContextDescription()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Mic className="h-3 w-3 text-primary" />
                  <span className="font-medium">Voice Input</span>
                  <Badge variant="secondary" className="text-xs">Auto-detect</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium">AI Analysis</span>
                  <Badge variant="secondary" className="text-xs">Smart</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <MousePointer className="h-3 w-3 text-primary" />
                  <span className="font-medium">Text Selection</span>
                  <Badge variant="secondary" className="text-xs">Manual</Badge>
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Example prompts:</div>
                <div className="space-y-1">
                  {getContextExamples().map((example, index) => (
                    <div key={index} className="text-xs bg-muted/50 p-2 rounded border-l-2 border-primary/30">
                      {example}
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Types */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Available mentions:</div>
                <div className="flex flex-wrap gap-1">
                  {['@subjects', '@styles', '@lighting', '@camera', '@colors', '@locations', '@presets', '@images'].map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                <div className="font-medium mb-1">💡 Tips:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Speak naturally - AI will detect mentions automatically</li>
                  <li>• Select text and right-click to convert to mentions</li>
                  <li>• Use @ to start typing for autocomplete suggestions</li>
                  <li>• Mentions are highlighted in Preset green</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
