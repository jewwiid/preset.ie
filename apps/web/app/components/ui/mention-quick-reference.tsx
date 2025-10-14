'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Mic, 
  Sparkles, 
  MousePointer, 
  AtSign, 
  ChevronDown,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionQuickReferenceProps {
  className?: string;
  compact?: boolean;
}

const quickExamples = [
  {
    category: "Portrait",
    examples: [
      "A @portrait with @dramatic-lighting",
      "@professional headshot with @studio-lighting",
      "@character design with @cinematic-style"
    ]
  },
  {
    category: "Landscape", 
    examples: [
      "@landscape during @golden-hour",
      "@mountain scene with @wide-angle lens",
      "@cityscape with @dramatic-lighting"
    ]
  },
  {
    category: "Product",
    examples: [
      "@product shot with @clean-background",
      "@commercial photography with @studio-lighting",
      "@lifestyle product with @natural-lighting"
    ]
  }
];

const mentionShortcuts = [
  { key: "@subjects", description: "What to create", examples: "portrait, landscape, character" },
  { key: "@styles", description: "Artistic styles", examples: "vintage, cinematic, professional" },
  { key: "@lighting", description: "Light conditions", examples: "golden-hour, dramatic, studio" },
  { key: "@camera", description: "Camera settings", examples: "wide-angle, macro, tilt-shift" },
  { key: "@colors", description: "Color palettes", examples: "warm-tones, cool-tones, monochrome" },
  { key: "@locations", description: "Environments", examples: "studio, outdoor, urban" }
];

export default function MentionQuickReference({ className, compact = false }: MentionQuickReferenceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-primary" />
                  Smart Mentions Quick Reference
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Methods */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <Mic className="h-3 w-3 text-blue-600" />
                  <span>Voice Input</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  <span>AI Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <MousePointer className="h-3 w-3 text-green-600" />
                  <span>Text Selection</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <AtSign className="h-3 w-3 text-orange-600" />
                  <span>@ Autocomplete</span>
                </div>
              </div>

              {/* Quick Examples */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Quick Examples:</div>
                {quickExamples.slice(0, 2).map((category, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-xs font-medium">{category.category}:</div>
                    {category.examples.slice(0, 1).map((example, exIndex) => (
                      <div 
                        key={exIndex}
                        className="text-xs bg-muted/50 p-1 rounded cursor-pointer hover:bg-muted/70 transition-colors flex items-center justify-between"
                        onClick={() => copyToClipboard(example)}
                      >
                        <span>{example}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedText === example ? (
                            <Check className="h-2 w-2 text-green-600" />
                          ) : (
                            <Copy className="h-2 w-2" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AtSign className="h-5 w-5 text-primary" />
          Smart Mentions Quick Reference
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quick guide to using Smart Mentions in your prompts
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Methods */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">🎯 How to Use Mentions:</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Mic className="h-4 w-4 text-blue-600" />
              <span>Voice Input</span>
              <Badge variant="secondary" className="text-xs">Auto-detect</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>AI Analysis</span>
              <Badge variant="secondary" className="text-xs">Smart</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MousePointer className="h-4 w-4 text-green-600" />
              <span>Text Selection</span>
              <Badge variant="secondary" className="text-xs">Manual</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AtSign className="h-4 w-4 text-orange-600" />
              <span>@ Autocomplete</span>
              <Badge variant="secondary" className="text-xs">Suggestions</Badge>
            </div>
          </div>
        </div>

        {/* Mention Types */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">📝 Available Mention Types:</h4>
          <div className="grid grid-cols-1 gap-2">
            {mentionShortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {shortcut.key}
                  </Badge>
                  <span className="text-muted-foreground">{shortcut.description}</span>
                </div>
                <span className="text-xs text-muted-foreground">{shortcut.examples}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Examples */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">💡 Quick Examples:</h4>
          <div className="space-y-2">
            {quickExamples.map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="text-sm font-medium">{category.category}:</div>
                <div className="space-y-1">
                  {category.examples.map((example, exIndex) => (
                    <div 
                      key={exIndex}
                      className="text-xs bg-muted/50 p-2 rounded cursor-pointer hover:bg-muted/70 transition-colors flex items-center justify-between group"
                      onClick={() => copyToClipboard(example)}
                    >
                      <span>{example}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedText === example ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2">💡 Pro Tips:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Speak naturally - AI detects mentions automatically</li>
            <li>• Select text and right-click to convert to mentions</li>
            <li>• Type @ for intelligent autocomplete suggestions</li>
            <li>• Mentions are highlighted in Preset green</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
