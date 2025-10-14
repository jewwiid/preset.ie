'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionExample {
  title: string;
  description: string;
  prompt: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface MentionExamplesPanelProps {
  context?: 'generate' | 'stitch' | 'edit' | 'video' | 'batch';
  onExampleSelect?: (example: MentionExample) => void;
  className?: string;
}

const examplePrompts: Record<string, MentionExample[]> = {
  generate: [
    {
      title: "Professional Portrait",
      description: "Create a stunning portrait with cinematic lighting and composition",
      prompt: "A @portrait of a professional woman with @dramatic-lighting, @shallow-depth-of-field, and @rule-of-thirds composition. @studio-lighting with @warm-tones and @professional-retouching.",
      category: "Portrait",
      difficulty: "beginner",
      tags: ["portrait", "lighting", "composition", "professional"]
    },
    {
      title: "Cinematic Landscape",
      description: "Generate a breathtaking landscape with cinematic parameters",
      prompt: "A @landscape of a mountain range during @golden-hour with @wide-angle lens, @dramatic-lighting, and @cinematic-composition. @film-grain texture with @warm-color-palette.",
      category: "Landscape",
      difficulty: "intermediate",
      tags: ["landscape", "cinematic", "lighting", "composition"]
    },
    {
      title: "Product Photography",
      description: "Professional product shot with studio lighting and clean background",
      prompt: "A @product shot of a luxury watch with @studio-lighting, @clean-background, and @professional-composition. @high-resolution with @color-grading and @commercial-style.",
      category: "Product",
      difficulty: "beginner",
      tags: ["product", "studio", "commercial", "professional"]
    },
    {
      title: "Character Design",
      description: "Create a fantasy character with detailed styling and mood",
      prompt: "A @character design of a @fantasy-warrior with @detailed-armor, @epic-lighting, and @heroic-pose. @concept-art style with @rich-colors and @dynamic-composition.",
      category: "Character",
      difficulty: "advanced",
      tags: ["character", "fantasy", "concept-art", "detailed"]
    },
    {
      title: "Abstract Art",
      description: "Generate abstract artwork with creative parameters",
      prompt: "An @abstract composition with @geometric-shapes, @vibrant-colors, and @modern-art style. @minimalist approach with @bold-contrasts and @contemporary-aesthetic.",
      category: "Abstract",
      difficulty: "intermediate",
      tags: ["abstract", "geometric", "modern", "colorful"]
    }
  ],
  stitch: [
    {
      title: "Seamless Blend",
      description: "Combine two images with perfect blending",
      prompt: "Blend @portrait-image with @landscape-background using @seamless-transition. @double-exposure technique with @soft-edges and @natural-lighting integration.",
      category: "Blending",
      difficulty: "intermediate",
      tags: ["blending", "double-exposure", "seamless", "transition"]
    },
    {
      title: "Surreal Composition",
      description: "Create a surreal image by combining unexpected elements",
      prompt: "Merge @cityscape with @ocean-waves using @surreal-blend. @impossible-perspective with @dreamlike-lighting and @fantasy-elements.",
      category: "Surreal",
      difficulty: "advanced",
      tags: ["surreal", "impossible", "fantasy", "creative"]
    },
    {
      title: "Texture Overlay",
      description: "Apply texture overlay to enhance an image",
      prompt: "Apply @vintage-texture to @portrait-image with @film-grain effect. @retro-style with @warm-tones and @nostalgic-mood.",
      category: "Texture",
      difficulty: "beginner",
      tags: ["texture", "vintage", "film-grain", "retro"]
    }
  ],
  edit: [
    {
      title: "Color Grading",
      description: "Enhance colors and mood of an existing image",
      prompt: "Apply @professional-color-grading to @portrait with @warm-tones and @cinematic-look. @high-contrast with @vibrant-saturation and @film-emulation.",
      category: "Color",
      difficulty: "intermediate",
      tags: ["color-grading", "cinematic", "professional", "enhancement"]
    },
    {
      title: "Style Transfer",
      description: "Apply artistic style to an existing image",
      prompt: "Transform @landscape-image with @impressionist-style and @painterly-texture. @artistic-rendering with @brush-strokes and @color-harmony.",
      category: "Style",
      difficulty: "advanced",
      tags: ["style-transfer", "artistic", "impressionist", "painterly"]
    },
    {
      title: "Retouching",
      description: "Professional retouching and enhancement",
      prompt: "Apply @professional-retouching to @portrait with @skin-smoothing and @eye-enhancement. @natural-look with @subtle-improvements and @high-quality-finish.",
      category: "Retouching",
      difficulty: "intermediate",
      tags: ["retouching", "professional", "enhancement", "natural"]
    }
  ],
  video: [
    {
      title: "Cinematic Motion",
      description: "Create smooth cinematic camera movement",
      prompt: "Generate @cinematic-motion with @smooth-pan across @landscape. @24fps with @film-look and @dramatic-lighting. @professional-camera-movement with @cinematic-composition.",
      category: "Motion",
      difficulty: "intermediate",
      tags: ["cinematic", "motion", "camera-movement", "film"]
    },
    {
      title: "Character Animation",
      description: "Animate a character with natural movement",
      prompt: "Animate @character with @walking-cycle and @natural-movement. @smooth-animation with @realistic-physics and @expressive-gestures.",
      category: "Animation",
      difficulty: "advanced",
      tags: ["animation", "character", "movement", "natural"]
    },
    {
      title: "Time Lapse",
      description: "Create a time-lapse effect with dramatic transitions",
      prompt: "Generate @time-lapse of @cityscape with @dramatic-transitions. @speed-ramping with @cinematic-lighting and @smooth-motion-blur.",
      category: "Time Lapse",
      difficulty: "intermediate",
      tags: ["time-lapse", "transitions", "cinematic", "motion"]
    }
  ],
  batch: [
    {
      title: "Style Consistency",
      description: "Apply consistent styling across multiple images",
      prompt: "Process @image-set with @consistent-style and @professional-look. @batch-processing with @color-harmony and @unified-aesthetic.",
      category: "Consistency",
      difficulty: "intermediate",
      tags: ["consistency", "batch", "style", "professional"]
    },
    {
      title: "Variation Control",
      description: "Generate variations while maintaining core elements",
      prompt: "Create @variations of @base-image with @controlled-changes. @progressive-enhancement with @quality-optimization and @creative-exploration.",
      category: "Variation",
      difficulty: "advanced",
      tags: ["variation", "control", "enhancement", "creative"]
    }
  ]
};

export default function MentionExamplesPanel({ 
  context = 'generate', 
  onExampleSelect,
  className 
}: MentionExamplesPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Portrait', 'Landscape']));
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  const examples = examplePrompts[context] || examplePrompts.generate;
  
  const categories = Array.from(new Set(examples.map(ex => ex.category)));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const copyExample = async (example: MentionExample) => {
    try {
      await navigator.clipboard.writeText(example.prompt);
      setCopiedExample(example.title);
      setTimeout(() => setCopiedExample(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>💡</span>
          Example Prompts with Mentions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click any example to use it, or copy to clipboard. These prompts demonstrate how to use @mentions effectively.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory(category)}
              className="w-full justify-start p-0 h-auto font-medium"
            >
              {expandedCategories.has(category) ? (
                <ChevronDown className="h-4 w-4 mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              {category}
              <Badge variant="secondary" className="ml-2 text-xs">
                {examples.filter(ex => ex.category === category).length}
              </Badge>
            </Button>
            
            {expandedCategories.has(category) && (
              <div className="space-y-2 ml-6">
                {examples
                  .filter(ex => ex.category === category)
                  .map((example, index) => (
                    <Card key={index} className="border-l-4 border-l-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{example.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {example.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getDifficultyColor(example.difficulty))}
                            >
                              {example.difficulty}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyExample(example)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedExample === example.title ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div 
                          className="text-xs bg-muted/50 p-2 rounded cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => onExampleSelect?.(example)}
                        >
                          {example.prompt}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {example.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground border-t pt-3">
          <div className="font-medium mb-1">🎯 How to use:</div>
          <ul className="space-y-1">
            <li>• Click any example to insert it into your prompt</li>
            <li>• Copy examples to clipboard for later use</li>
            <li>• Modify examples to match your specific needs</li>
            <li>• @mentions are automatically highlighted and functional</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
