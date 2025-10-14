'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Sparkles, 
  MousePointer, 
  AtSign, 
  HelpCircle,
  Lightbulb,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Copy,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MentionExamplesPanel from '@/app/components/ui/mention-examples-panel';
import MentionTutorialModal from '@/app/components/ui/mention-tutorial-modal';

const featureHighlights = [
  {
    icon: Mic,
    title: "Voice Input",
    description: "Speak naturally and let AI automatically detect and convert words to @mentions",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Sparkles,
    title: "AI Analysis",
    description: "Use AI to analyze existing text and enhance it with intelligent @mentions",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: MousePointer,
    title: "Manual Selection",
    description: "Select any text and convert it to mentions with right-click context menu",
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    icon: AtSign,
    title: "Smart Autocomplete",
    description: "Type @ to get intelligent, categorized suggestions for mentions",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];

const mentionTypes = [
  { 
    type: 'subjects', 
    description: 'What you want to create', 
    examples: ['@portrait', '@landscape', '@character', '@product'],
    icon: '🎯'
  },
  { 
    type: 'styles', 
    description: 'Artistic and cinematic styles', 
    examples: ['@vintage', '@cinematic', '@professional', '@artistic'],
    icon: '🎨'
  },
  { 
    type: 'lighting', 
    description: 'Lighting conditions and styles', 
    examples: ['@golden-hour', '@dramatic-lighting', '@studio-lighting', '@natural-light'],
    icon: '💡'
  },
  { 
    type: 'camera', 
    description: 'Camera settings and techniques', 
    examples: ['@wide-angle', '@shallow-depth', '@macro-lens', '@tilt-shift'],
    icon: '📷'
  },
  { 
    type: 'colors', 
    description: 'Color palettes and tones', 
    examples: ['@warm-tones', '@cool-tones', '@monochrome', '@vibrant-colors'],
    icon: '🌈'
  },
  { 
    type: 'locations', 
    description: 'Settings and environments', 
    examples: ['@studio', '@outdoor', '@urban', '@natural'],
    icon: '📍'
  },
  { 
    type: 'presets', 
    description: 'Your saved presets', 
    examples: ['@my-portrait-preset', '@cinematic-style', '@product-photo'],
    icon: '⚙️'
  },
  { 
    type: 'images', 
    description: 'Referenced source images', 
    examples: ['@reference-image', '@style-image', '@source-photo'],
    icon: '🖼️'
  }
];

const workflowSteps = [
  {
    step: 1,
    title: "Start with Voice or Text",
    description: "Either speak your prompt naturally or start typing. The system works with both approaches.",
    example: "Say: 'A portrait of a woman with dramatic lighting' or type it directly"
  },
  {
    step: 2,
    title: "AI Detects Mentions",
    description: "Our AI automatically identifies words that can be converted to @mentions for better results.",
    example: "Converts to: 'A @portrait of a woman with @dramatic-lighting'"
  },
  {
    step: 3,
    title: "Visual Feedback",
    description: "Mentions are highlighted in Preset green so you can see what's been detected.",
    example: "Green highlights show detected mentions"
  },
  {
    step: 4,
    title: "Enhanced Generation",
    description: "The AI uses these mentions to create more accurate and consistent results.",
    example: "Better, more consistent image generation"
  }
];

export default function MentionsHelpPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Smart Mentions Help
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Learn how to use Smart Mentions to create better prompts with cinematic parameters, 
            subjects, styles, and more. Enhance your creative workflow with AI-powered mention detection.
          </p>
          <div className="flex justify-center gap-4">
            <MentionTutorialModal context="generate">
              <Button className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Interactive Tutorial
              </Button>
            </MentionTutorialModal>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Documentation
            </Button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureHighlights.map((feature, index) => (
            <Card key={index} className="border-l-4 border-l-primary/30">
              <CardContent className="p-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", feature.bgColor)}>
                  <feature.icon className={cn("h-5 w-5", feature.color)} />
                </div>
                <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="types">Mention Types</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  What are Smart Mentions?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Smart Mentions are a revolutionary way to reference cinematic parameters, subjects, styles, 
                  and other entities in your prompts. They're automatically highlighted and provide intelligent 
                  suggestions to enhance your creative workflow across all Preset tools.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">✨ Key Benefits:</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Automatic mention detection from voice input</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>AI-powered text analysis and enhancement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Intelligent autocomplete suggestions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Visual highlighting for better readability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Cross-tab mention sharing</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">🎯 Perfect for:</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Cinematic parameter references</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Subject type specifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Style and mood descriptions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Source image references</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Preset and template usage</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Pro Tip</h4>
                      <p className="text-sm text-muted-foreground">
                        Mentions work best when you speak naturally or write descriptively. The AI understands context 
                        and will suggest the most relevant mentions for your creative intent. Start with voice input 
                        for the most natural experience!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Mention Types</CardTitle>
                <p className="text-sm text-muted-foreground">
                  These are the different categories of mentions you can use in your prompts across all Preset tools.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentionTypes.map((type) => (
                    <Card key={type.type} className="border-l-4 border-l-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{type.icon}</span>
                          <h4 className="font-medium capitalize">
                            {type.type.replace('-', ' ')}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
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

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How Smart Mentions Work</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Follow this simple workflow to get the most out of Smart Mentions in your creative process.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      <div className="text-xs bg-muted/50 p-2 rounded border-l-2 border-primary/30">
                        {step.example}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <MentionExamplesPanel 
              context="generate" 
              onExampleSelect={(example) => {
                // In a real app, this would insert the example into the current prompt
                console.log('Selected example:', example);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Start */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Ready to Get Started?</h3>
              <p className="text-muted-foreground">
                Try Smart Mentions in any of our tools. Start with voice input for the most natural experience!
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Try Voice Input
                </Button>
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Try @ Mentions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
