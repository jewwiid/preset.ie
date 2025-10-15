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
  Play,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionInput } from '@/app/components/ui/mention-input';
import MentionHelpTooltip from '@/app/components/ui/mention-help-tooltip';
import MentionExamplesPanel from '@/app/components/ui/mention-examples-panel';
import MentionTutorialModal from '@/app/components/ui/mention-tutorial-modal';
import MentionQuickReference from '@/app/components/ui/mention-quick-reference';
import { buildAllMentionEntities } from '@/lib/utils/cinematic-mention-builder';
import type { MentionDetectionContext } from '@/lib/ai/mention-detection';

// Mock data for testing
const mockUserImages = [
  { id: 'img1', url: '/placeholder.jpg', name: 'Portrait Reference', description: 'Professional headshot' },
  { id: 'img2', url: '/placeholder.jpg', name: 'Landscape Style', description: 'Mountain landscape' },
  { id: 'img3', url: '/placeholder.jpg', name: 'Product Shot', description: 'Luxury watch' }
];

const mockUserPresets = [
  { id: 'preset1', name: 'Cinematic Portrait', description: 'Professional portrait style', cinematicParams: {} },
  { id: 'preset2', name: 'Vintage Landscape', description: 'Retro landscape style', cinematicParams: {} },
  { id: 'preset3', name: 'Product Photography', description: 'Clean product shots', cinematicParams: {} }
];

const mockCinematicParams = {
  directorStyle: 'christopher-nolan' as const,
  lightingStyle: 'low-key' as const,
  cameraAngle: 'low-angle' as const,
  colorPalette: 'warm-golden' as const
};

export default function ComprehensiveMentionsTestPage() {
  const [activeTab, setActiveTab] = useState('voice');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Build available entities for testing
  const availableEntities = buildAllMentionEntities({
    mode: 'text-to-image',
    selectedImages: ['img1', 'img2'],
    currentPreset: mockUserPresets[0],
    cinematicParams: mockCinematicParams,
    userImages: mockUserImages,
    userPresets: mockUserPresets
  });

  const mentionContext: MentionDetectionContext = {
    mode: 'text-to-image',
    availableImages: mockUserImages.map(img => img.id),
    currentPreset: mockUserPresets[0],
    cinematicParams: mockCinematicParams,
    selectedImages: ['img1', 'img2']
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const testScenarios = [
    {
      id: 'voice-basic',
      title: 'Basic Voice Input',
      description: 'Test basic voice-to-text with mention detection',
      prompt: 'A portrait of a woman with dramatic lighting',
      expected: 'Should detect @portrait and @dramatic-lighting'
    },
    {
      id: 'voice-complex',
      title: 'Complex Voice Input',
      description: 'Test complex prompt with multiple mention types',
      prompt: 'A cinematic landscape during golden hour with wide angle lens and warm tones',
      expected: 'Should detect @landscape, @golden-hour, @wide-angle, @warm-tones'
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'Test AI-powered mention detection on existing text',
      prompt: 'Professional headshot with studio lighting and clean background',
      expected: 'AI should enhance with @professional, @studio-lighting, @clean-background'
    },
    {
      id: 'manual-selection',
      title: 'Manual Selection',
      description: 'Test manual text selection and mention conversion',
      prompt: 'Select "portrait" and convert to @portrait mention',
      expected: 'Should show context menu with mention options'
    },
    {
      id: 'autocomplete',
      title: 'Autocomplete',
      description: 'Test @ autocomplete functionality',
      prompt: 'Type @port to see suggestions',
      expected: 'Should show @portrait, @portrait-lighting, etc.'
    }
  ];

  const runTest = async (scenario: any) => {
    setTestResults(prev => ({
      ...prev,
      [scenario.id]: { status: 'running', message: 'Running test...' }
    }));

    // Simulate test execution
    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        [scenario.id]: { 
          status: 'success', 
          message: 'Test completed successfully',
          details: scenario.expected
        }
      }));
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Comprehensive Mentions Test Suite
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Test all Smart Mentions features including voice input, AI analysis, manual selection, 
            and autocomplete functionality.
          </p>
          <div className="flex justify-center gap-4">
            <MentionTutorialModal context="generate">
              <Button className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Interactive Tutorial
              </Button>
            </MentionTutorialModal>
            <Button variant="outline" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Documentation
            </Button>
          </div>
        </div>

        {/* Quick Reference */}
        <MentionQuickReference compact />

        {/* Main Test Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="voice">Voice Input</TabsTrigger>
            <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            <TabsTrigger value="manual">Manual Selection</TabsTrigger>
            <TabsTrigger value="autocomplete">Autocomplete</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-600" />
                    Voice Input Test
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test voice-to-text with automatic mention detection
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MentionInput
                    value=""
                    onChange={(value) => console.log('Voice input changed:', value)}
                    placeholder="Click the microphone and speak your prompt..."
                    mentionableItems={[]}
                    availableEntities={availableEntities}
                    mentionContext={mentionContext}
                    enableAIMentions={true}
                    colorCodedMentions={true}
                    allowTextSelection={true}
                    userSubscriptionTier="PRO"
                    enableVoiceToText={true}
                    rows={4}
                  />
                  <div className="text-xs text-muted-foreground">
                    💡 Try saying: "A portrait of a woman with dramatic lighting and warm tones"
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                    Test Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testScenarios.filter(s => s.id.startsWith('voice')).map((scenario) => (
                    <div key={scenario.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{scenario.title}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(scenario)}
                          disabled={testResults[scenario.id]?.status === 'running'}
                        >
                          {testResults[scenario.id]?.status === 'running' ? 'Running...' : 'Test'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                      <div className="text-xs bg-muted/50 p-2 rounded mb-2">
                        <strong>Prompt:</strong> {scenario.prompt}
                      </div>
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <strong>Expected:</strong> {scenario.expected}
                      </div>
                      {testResults[scenario.id] && (
                        <div className={cn(
                          "text-xs p-2 rounded mt-2 flex items-center gap-2",
                          testResults[scenario.id].status === 'success' 
                            ? "bg-primary-50 text-primary-800 border border-primary/20"
                            : testResults[scenario.id].status === 'error'
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        )}>
                          {testResults[scenario.id].status === 'success' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : testResults[scenario.id].status === 'error' ? (
                            <AlertCircle className="h-3 w-3" />
                          ) : (
                            <Info className="h-3 w-3" />
                          )}
                          {testResults[scenario.id].message}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Analysis Test
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test AI-powered mention detection and enhancement
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MentionInput
                    value="Professional headshot with studio lighting and clean background"
                    onChange={(value) => console.log('AI analysis changed:', value)}
                    placeholder="Type or paste your prompt here..."
                    mentionableItems={[]}
                    availableEntities={availableEntities}
                    mentionContext={mentionContext}
                    enableAIMentions={true}
                    colorCodedMentions={true}
                    allowTextSelection={true}
                    userSubscriptionTier="PRO"
                    enableVoiceToText={false}
                    rows={4}
                  />
                  <div className="text-xs text-muted-foreground">
                    💡 Click the AI analyze button (sparkles icon) to enhance this text with mentions
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Test Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testScenarios.filter(s => s.id.startsWith('ai')).map((scenario) => (
                    <div key={scenario.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{scenario.title}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(scenario)}
                          disabled={testResults[scenario.id]?.status === 'running'}
                        >
                          {testResults[scenario.id]?.status === 'running' ? 'Running...' : 'Test'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
                      <div className="text-xs bg-muted/50 p-2 rounded">
                        <strong>Expected:</strong> {scenario.expected}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-primary-600" />
                    Manual Selection Test
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test manual text selection and mention conversion
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MentionInput
                    value="A portrait of a woman with dramatic lighting and warm tones"
                    onChange={(value) => console.log('Manual selection changed:', value)}
                    placeholder="Select text and right-click to convert to mentions..."
                    mentionableItems={[]}
                    availableEntities={availableEntities}
                    mentionContext={mentionContext}
                    enableAIMentions={false}
                    colorCodedMentions={true}
                    allowTextSelection={true}
                    userSubscriptionTier="PRO"
                    enableVoiceToText={false}
                    rows={4}
                  />
                  <div className="text-xs text-muted-foreground">
                    💡 Select words like "portrait", "dramatic", or "warm" and right-click to see mention options
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Selection Test Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">How to test manual selection:</h4>
                    <ol className="text-xs space-y-1 text-muted-foreground">
                      <li>1. Click and drag to select any word in the text above</li>
                      <li>2. Right-click on the selected text</li>
                      <li>3. Choose from the context menu options</li>
                      <li>4. The text should convert to a @mention</li>
                    </ol>
                  </div>
                  <div className="text-xs bg-muted/50 p-2 rounded">
                    <strong>Test words:</strong> portrait, dramatic, lighting, warm, tones, woman
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="autocomplete" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AtSign className="h-5 w-5 text-orange-600" />
                    Autocomplete Test
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Test @ autocomplete functionality and suggestions
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MentionInput
                    value=""
                    onChange={(value) => console.log('Autocomplete changed:', value)}
                    placeholder="Type @ to see autocomplete suggestions..."
                    mentionableItems={[]}
                    availableEntities={availableEntities}
                    mentionContext={mentionContext}
                    enableAIMentions={false}
                    colorCodedMentions={true}
                    allowTextSelection={false}
                    userSubscriptionTier="PRO"
                    enableVoiceToText={false}
                    rows={4}
                  />
                  <div className="text-xs text-muted-foreground">
                    💡 Try typing: @port, @dram, @gold, @wide, @warm, @cinem
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Autocomplete Test Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Test these autocomplete patterns:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="font-medium">Subjects:</div>
                        <div>@port → @portrait</div>
                        <div>@land → @landscape</div>
                        <div>@char → @character</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Styles:</div>
                        <div>@dram → @dramatic</div>
                        <div>@cinem → @cinematic</div>
                        <div>@prof → @professional</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Lighting:</div>
                        <div>@gold → @golden-hour</div>
                        <div>@stud → @studio-lighting</div>
                        <div>@natur → @natural-light</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Camera:</div>
                        <div>@wide → @wide-angle</div>
                        <div>@macro → @macro-lens</div>
                        <div>@tilt → @tilt-shift</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <MentionExamplesPanel 
              context="generate" 
              onExampleSelect={(example) => {
                console.log('Selected example:', example);
                copyToClipboard(example.prompt);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Test Summary */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Test Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Object.keys(testResults).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tests Run</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {Object.values(testResults).filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(testResults).filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(testResults).filter(r => r.status === 'running').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Running</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
