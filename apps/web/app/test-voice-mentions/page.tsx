'use client';

import { useState } from 'react';
import { MentionInput } from '@/app/components/ui/mention-input';
import { MentionableItem } from '@/hooks/useMentionSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestVoiceMentionsPage() {
  const [stitchPrompt, setStitchPrompt] = useState('');
  const [playgroundPrompt, setPlaygroundPrompt] = useState('');

  // Mock mentionable items for Stitch (images)
  const stitchMentionableItems: MentionableItem[] = [
    {
      id: '1',
      label: 'Character',
      type: 'Character',
      thumbnail: '/logo.svg',
      description: 'Main character reference'
    },
    {
      id: '2',
      label: 'Location',
      type: 'Location',
      thumbnail: '/logo.svg',
      description: 'Background location'
    },
    {
      id: '3',
      label: 'Style',
      type: 'Style',
      thumbnail: '/logo.svg',
      description: 'Art style reference'
    },
    {
      id: '4',
      label: 'Model',
      type: 'Model',
      thumbnail: '/logo.svg',
      description: 'Fashion model'
    },
    {
      id: '5',
      label: 'Product',
      type: 'Product',
      thumbnail: '/logo.svg',
      description: 'Product reference'
    }
  ];

  // Mock mentionable items for Playground (subject types)
  const playgroundMentionableItems: MentionableItem[] = [
    {
      id: '1',
      label: 'portrait',
      type: 'Subject',
      description: 'Portrait photography'
    },
    {
      id: '2',
      label: 'landscape',
      type: 'Subject',
      description: 'Landscape photography'
    },
    {
      id: '3',
      label: 'character',
      type: 'Subject',
      description: 'Character design'
    },
    {
      id: '4',
      label: 'product',
      type: 'Subject',
      description: 'Product photography'
    },
    {
      id: '5',
      label: 'fashion',
      type: 'Subject',
      description: 'Fashion photography'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Voice-to-Text with Smart Mentions</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Test the integrated voice-to-text system that automatically converts spoken words into proper mentions 
            when they match available items. Works across Stitch, Playground, and all text inputs.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Stitch Control Panel Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Stitch</Badge>
                Image References
              </CardTitle>
              <CardDescription>
                Voice input automatically converts spoken image types to @mentions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stitch Prompt
                </label>
                <MentionInput
                  value={stitchPrompt}
                  onChange={setStitchPrompt}
                  placeholder="Try saying: 'Create 5 images showing character in different locations with consistent style'"
                  mentionableItems={stitchMentionableItems}
                  onMentionSelect={(item) => {
                    console.log('Stitch mentioned:', item.label);
                  }}
                  rows={4}
                  userSubscriptionTier="PLUS"
                  enableVoiceToText={true}
                />
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Available mentions:</strong></p>
                <div className="flex flex-wrap gap-1">
                  {stitchMentionableItems.map(item => (
                    <Badge key={item.id} variant="outline" className="text-xs">
                      @{item.label}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2">
                  <strong>Voice examples:</strong> "character", "location", "style", "model", "product"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Playground Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">Playground</Badge>
                Subject Types
              </CardTitle>
              <CardDescription>
                Voice input converts spoken subject types to @mentions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Playground Prompt
                </label>
                <MentionInput
                  value={playgroundPrompt}
                  onChange={setPlaygroundPrompt}
                  placeholder="Try saying: 'Create a portrait of a character in fashion style'"
                  mentionableItems={playgroundMentionableItems}
                  onMentionSelect={(item) => {
                    console.log('Playground mentioned:', item.label);
                  }}
                  rows={4}
                  userSubscriptionTier="PLUS"
                  enableVoiceToText={true}
                />
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Available mentions:</strong></p>
                <div className="flex flex-wrap gap-1">
                  {playgroundMentionableItems.map(item => (
                    <Badge key={item.id} variant="outline" className="text-xs">
                      @{item.label}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2">
                  <strong>Voice examples:</strong> "portrait", "landscape", "character", "product", "fashion"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Voice-to-Text Integration Features</CardTitle>
            <CardDescription>
              Comprehensive voice input system with smart mention detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Smart Mention Detection</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatically converts spoken words to @mentions</li>
                  <li>• Case-insensitive matching</li>
                  <li>• Partial word matching</li>
                  <li>• Handles voice transcription variations</li>
                  <li>• Works with image types, subjects, and custom labels</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Cross-Platform Compatibility</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stitch Control Panel with image references</li>
                  <li>• Playground PromptBuilder with subject types</li>
                  <li>• Gig creation forms with descriptions</li>
                  <li>• Showcase and moodboard descriptions</li>
                  <li>• All text inputs across the platform</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Voice Processing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 30-second recording limit with auto-stop</li>
                  <li>• Circular progress timer animation</li>
                  <li>• Pulse animation during recording</li>
                  <li>• Typewriter effect for transcribed text</li>
                  <li>• Real-time mention conversion</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Subscription & Credits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Free for PLUS/PRO subscribers</li>
                  <li>• No credit deduction required</li>
                  <li>• FREE users see upgrade prompt</li>
                  <li>• OpenAI Whisper API integration</li>
                  <li>• High accuracy transcription</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
            <CardDescription>
              Try these voice commands to see smart mention detection in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-sm mb-2">Stitch Examples</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-muted rounded text-xs">
                    <strong>Say:</strong> "Create 5 images showing character in different locations"<br/>
                    <strong>Result:</strong> "Create 5 images showing @Character in different locations"
                  </div>
                  <div className="p-2 bg-muted rounded text-xs">
                    <strong>Say:</strong> "Use model with product in style reference"<br/>
                    <strong>Result:</strong> "Use @Model with @Product in @Style reference"
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Playground Examples</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-muted rounded text-xs">
                    <strong>Say:</strong> "Create a portrait of a character"<br/>
                    <strong>Result:</strong> "Create a @portrait of a @character"
                  </div>
                  <div className="p-2 bg-muted rounded text-xs">
                    <strong>Say:</strong> "Fashion product in landscape style"<br/>
                    <strong>Result:</strong> "@fashion @product in @landscape style"
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
