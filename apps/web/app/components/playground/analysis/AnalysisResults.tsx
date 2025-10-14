'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Sparkles } from 'lucide-react';
import { PromptAnalysis } from '@/hooks/usePromptAnalysis';
import { AnalysisPersona } from '@/lib/constants/analysisPersonas';

interface AnalysisResultsProps {
  analysis: PromptAnalysis;
  selectedPrompt: string;
  selectedPersona: AnalysisPersona;
  onPromptChange: (prompt: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onApplyPrompt: () => void;
}

export function AnalysisResults({
  analysis,
  selectedPrompt,
  selectedPersona,
  onPromptChange,
  onCopyPrompt,
  onApplyPrompt}: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Main Analysis Section - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Core Analysis */}
        <div className="space-y-4">
          {/* Prompt Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prompt Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{analysis.promptAnalysis}</p>
            </CardContent>
          </Card>

          {/* Style Alignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Style Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{analysis.styleAlignment}</p>
            </CardContent>
          </Card>

          {/* Aspect Ratio Considerations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aspect Ratio Considerations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{analysis.aspectRatioConsiderations}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Technical Analysis */}
        <div className="space-y-4">
          {/* Cinematic Analysis */}
          {analysis.cinematicAnalysis && analysis.cinematicAnalysis !== 'N/A - no cinematic parameters provided' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm text-primary">Cinematic Analysis</CardTitle>
                <CardDescription className="text-primary/80">
                  Analysis of cinematic parameters and their impact on the visual narrative
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{analysis.cinematicAnalysis}</p>
              </CardContent>
            </Card>
          )}

          {/* Base Image Insights */}
          {analysis.baseImageInsights && analysis.baseImageInsights !== 'N/A - no base image provided' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Base Image Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{analysis.baseImageInsights}</p>
              </CardContent>
            </Card>
          )}

          {/* Professional Insights */}
          {analysis.professionalInsights && analysis.professionalInsights.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm text-primary">
                  {selectedPersona.icon} Professional Insights
                </CardTitle>
                <CardDescription className="text-primary/80">
                  Expert recommendations from {selectedPersona.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.professionalInsights.map((insight, index) => (
                    <li key={index} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary-500 mt-1">💡</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Strengths and Weaknesses - Full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-primary">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">⚠</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Improvements and Technical Suggestions - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Improvements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Specific Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary-500 mt-1">💡</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Technical Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Technical Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.technicalSuggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-muted-foreground mt-1">🔧</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Alternative Prompts - Full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alternative Prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.alternativePrompts.map((prompt, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm text-foreground">{prompt}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onCopyPrompt(prompt)} className="flex-shrink-0">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Prompt - Full width */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm text-primary">Recommended Improved Prompt</CardTitle>
          <CardDescription className="text-primary/80">
            Estimated improvement: {analysis.estimatedImprovement}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <textarea
              value={selectedPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-sm bg-background text-foreground"
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onCopyPrompt(selectedPrompt)}>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button
                size="sm"
                onClick={onApplyPrompt}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Apply & Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
