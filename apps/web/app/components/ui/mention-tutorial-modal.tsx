'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Sparkles, 
  MousePointer, 
  AtSign, 
  Play, 
  CheckCircle, 
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionTutorialModalProps {
  children: React.ReactNode;
  context?: 'generate' | 'stitch' | 'edit' | 'video' | 'batch';
}

const tutorialSteps = [
  {
    id: 'voice',
    title: 'Voice Input',
    icon: Mic,
    description: 'Speak naturally and let AI detect mentions automatically',
    steps: [
      'Click the microphone button',
      'Speak your prompt naturally',
      'AI automatically converts words to @mentions',
      'Text appears with highlighted mentions'
    ],
    example: 'Say: "A portrait of a woman with dramatic lighting" → Gets converted to: "A @portrait of a woman with @dramatic-lighting"'
  },
  {
    id: 'ai',
    title: 'AI Analysis',
    icon: Sparkles,
    description: 'Use AI to analyze and enhance your existing text',
    steps: [
      'Type or paste your prompt',
      'Click the AI analyze button',
      'AI identifies mentionable entities',
      'Text is enhanced with @mentions'
    ],
    example: 'Input: "A landscape with golden hour lighting" → AI enhances to: "A @landscape with @golden-hour @lighting"'
  },
  {
    id: 'manual',
    title: 'Manual Selection',
    icon: MousePointer,
    description: 'Select text and convert it to mentions manually',
    steps: [
      'Select any text in your prompt',
      'Right-click or use the context menu',
      'Choose from available mention types',
      'Text is converted to @mention'
    ],
    example: 'Select "portrait" → Choose "Subject" → Becomes "@portrait"'
  },
  {
    id: 'autocomplete',
    title: 'Autocomplete',
    icon: AtSign,
    description: 'Type @ to get intelligent suggestions',
    steps: [
      'Type @ anywhere in your prompt',
      'See categorized suggestions appear',
      'Use arrow keys to navigate',
      'Press Enter or click to select'
    ],
    example: 'Type "@port" → See suggestions: @portrait, @portrait-lighting, @portrait-style'
  }
];

const mentionTypes = [
  { type: 'subjects', description: 'What you want to create', examples: ['@portrait', '@landscape', '@character', '@product'] },
  { type: 'styles', description: 'Artistic and cinematic styles', examples: ['@vintage', '@cinematic', '@professional', '@artistic'] },
  { type: 'lighting', description: 'Lighting conditions and styles', examples: ['@golden-hour', '@dramatic-lighting', '@studio-lighting', '@natural-light'] },
  { type: 'camera', description: 'Camera settings and techniques', examples: ['@wide-angle', '@shallow-depth', '@macro-lens', '@tilt-shift'] },
  { type: 'colors', description: 'Color palettes and tones', examples: ['@warm-tones', '@cool-tones', '@monochrome', '@vibrant-colors'] },
  { type: 'locations', description: 'Settings and environments', examples: ['@studio', '@outdoor', '@urban', '@natural'] },
  { type: 'presets', description: 'Your saved presets', examples: ['@my-portrait-preset', '@cinematic-style', '@product-photo'] },
  { type: 'images', description: 'Referenced source images', examples: ['@reference-image', '@style-image', '@source-photo'] }
];

export default function MentionTutorialModal({ children, context = 'generate' }: MentionTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const getContextTitle = () => {
    switch (context) {
      case 'generate': return 'Image Generation';
      case 'stitch': return 'Image Stitching';
      case 'edit': return 'Image Editing';
      case 'video': return 'Video Creation';
      case 'batch': return 'Batch Processing';
      default: return 'Creative Workflow';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Smart Mentions Tutorial - {getContextTitle()}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="methods">Methods</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  What are Smart Mentions?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Smart Mentions are a powerful way to reference cinematic parameters, subjects, styles, and other entities 
                  in your prompts. They're automatically highlighted and provide intelligent suggestions to enhance your creative workflow.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">✨ Key Benefits:</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Automatic mention detection from voice input</li>
                      <li>• AI-powered text analysis and enhancement</li>
                      <li>• Intelligent autocomplete suggestions</li>
                      <li>• Visual highlighting for better readability</li>
                      <li>• Cross-tab mention sharing</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">🎯 Perfect for:</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Cinematic parameter references</li>
                      <li>• Subject type specifications</li>
                      <li>• Style and mood descriptions</li>
                      <li>• Source image references</li>
                      <li>• Preset and template usage</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-1">Pro Tip</h4>
                      <p className="text-xs text-muted-foreground">
                        Mentions work best when you speak naturally or write descriptively. The AI understands context 
                        and will suggest the most relevant mentions for your creative intent.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-4">
            <div className="space-y-4">
              {tutorialSteps.map((step, index) => (
                <Card key={step.id} className={cn(
                  "transition-all duration-200",
                  currentStep === index && "ring-2 ring-primary/20 bg-primary/5"
                )}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-base">
                      <div className={cn(
                        "p-2 rounded-lg",
                        currentStep === index ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <step.icon className="h-4 w-4" />
                      </div>
                      {step.title}
                      {currentStep === index && (
                        <Badge variant="secondary" className="ml-auto">Current</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Steps:</h4>
                        <ol className="text-xs space-y-1">
                          {step.steps.map((stepText, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-2">
                              <span className="text-primary font-medium">{stepIndex + 1}.</span>
                              <span>{stepText}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Example:</h4>
                        <div className="text-xs bg-muted/50 p-2 rounded border-l-2 border-primary/30">
                          {step.example}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {tutorialSteps.map((_, stepIndex) => (
                          <button
                            key={stepIndex}
                            onClick={() => setCurrentStep(stepIndex)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              currentStep === stepIndex ? "bg-primary" : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setCurrentStep(Math.min(tutorialSteps.length - 1, currentStep + 1))}
                          disabled={currentStep === tutorialSteps.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="types" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Mention Types</CardTitle>
                <p className="text-sm text-muted-foreground">
                  These are the different categories of mentions you can use in your prompts
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentionTypes.map((type) => (
                    <Card key={type.type} className="border-l-4 border-l-primary/30">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm mb-2 capitalize">
                          {type.type.replace('-', ' ')}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {type.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {type.examples.map((example) => (
                            <Badge key={example} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Example Prompts for {getContextTitle()}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  See how mentions work in real prompts for your workflow
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {context === 'generate' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded border-l-4 border-l-primary/30">
                      <h4 className="font-medium text-sm mb-1">Professional Portrait</h4>
                      <p className="text-xs text-muted-foreground">
                        "A @portrait of a professional woman with @dramatic-lighting, @shallow-depth-of-field, and @rule-of-thirds composition. @studio-lighting with @warm-tones and @professional-retouching."
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded border-l-4 border-l-primary/30">
                      <h4 className="font-medium text-sm mb-1">Cinematic Landscape</h4>
                      <p className="text-xs text-muted-foreground">
                        "A @landscape of a mountain range during @golden-hour with @wide-angle lens, @dramatic-lighting, and @cinematic-composition. @film-grain texture with @warm-color-palette."
                      </p>
                    </div>
                  </div>
                )}
                
                {context === 'stitch' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded border-l-4 border-l-primary/30">
                      <h4 className="font-medium text-sm mb-1">Seamless Blend</h4>
                      <p className="text-xs text-muted-foreground">
                        "Blend @portrait-image with @landscape-background using @seamless-transition. @double-exposure technique with @soft-edges and @natural-lighting integration."
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-1">Ready to Start?</h4>
                      <p className="text-xs text-muted-foreground">
                        Try speaking one of these examples or start typing with @ to see suggestions in action!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
