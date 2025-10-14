'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle, Zap, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '../../../lib/auth-context';
import { usePromptAnalysis, PromptAnalysis } from '@/hooks/usePromptAnalysis';
import { usePromptValidation } from '@/hooks/usePromptValidation';
import { ANALYSIS_PERSONAS, AnalysisPersona } from '@/lib/constants/analysisPersonas';
import { AnalysisPersonaSelector } from './analysis/AnalysisPersonaSelector';
import { GenerationContextCard } from './analysis/GenerationContextCard';
import { AnalysisResults } from './analysis/AnalysisResults';

interface PromptAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  originalPrompt: string;
  enhancedPrompt?: string;
  style: string;
  resolution: string;
  aspectRatio: string;
  generationMode: 'text-to-image' | 'image-to-image';
  customStylePreset?: any;
  cinematicParameters?: any;
  onApplyPrompt: (improvedPrompt: string) => void;
  onSaveAsPreset: (analysis: PromptAnalysis) => void;
  subscriptionTier: 'free' | 'plus' | 'pro';
}

export default function PromptAnalysisModal({
  isOpen,
  onClose,
  imageUrl,
  originalPrompt,
  enhancedPrompt,
  style,
  resolution,
  aspectRatio,
  generationMode,
  customStylePreset,
  cinematicParameters,
  onApplyPrompt,
  onSaveAsPreset,
  subscriptionTier,
}: PromptAnalysisModalProps) {
  const { showSuccess, showError } = useToast();
  const { session } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<AnalysisPersona>(ANALYSIS_PERSONAS[0]);
  const [useEnhancedPrompt, setUseEnhancedPrompt] = useState(false);

  // Initialize hooks
  const promptAnalysis = usePromptAnalysis({
    onApplyPrompt: (prompt: string) => {
      onApplyPrompt(prompt);
      onClose();
    },
    onSaveAsPreset: (analysis: PromptAnalysis) => {
      onSaveAsPreset(analysis);
    },
  });

  const validation = usePromptValidation({
    prompt: useEnhancedPrompt && enhancedPrompt ? enhancedPrompt : originalPrompt,
    style,
    resolution,
    aspectRatio,
    generationMode,
    imageUrl,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      promptAnalysis.reset();
    }
  }, [isOpen]);

  // Re-analyze when prompt toggle changes (if analysis already exists)
  useEffect(() => {
    if (promptAnalysis.analysis && enhancedPrompt) {
      handleAnalyze();
    }
  }, [useEnhancedPrompt]);

  const handleAnalyze = async () => {
    if (subscriptionTier === 'free') {
      showError('Prompt analysis is only available for Plus and Pro subscribers');
      return;
    }

    if (!session?.access_token) {
      showError('Authentication required. Please sign in again.');
      return;
    }

    // Validate input data before making API call
    if (!validation.isInputValid) {
      const errorMessage = validation.validateInputs.join('. ') + '.';
      showError(errorMessage);
      return;
    }

    await promptAnalysis.analyzePrompt({
      prompt: useEnhancedPrompt && enhancedPrompt ? enhancedPrompt : originalPrompt,
      style,
      resolution,
      aspectRatio,
      generationMode,
      imageUrl,
      customStylePreset,
      cinematicParameters,
      selectedPersona: selectedPersona.id,
      subscriptionTier,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-popover rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-border popover-fixed"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">AI Prompt Optimizer</h2>
              <p className="text-sm text-muted-foreground">Professional prompt analysis and optimization</p>
            </div>
            {subscriptionTier !== 'free' && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {subscriptionTier === 'plus' ? 'Plus' : 'Pro'} Feature
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={promptAnalysis.isAnalyzing}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Top Row - Only show when no base image */}
          {!imageUrl && (
            <div className="w-full">
              <p className="text-sm font-medium text-foreground mb-2">Current Prompt</p>
              <div
                className="relative w-full bg-muted rounded-lg border border-border p-4"
                style={{ minHeight: '120px' }}
              >
                {!promptAnalysis.analysis && !promptAnalysis.isAnalyzing && !promptAnalysis.error && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Prompt to Analyze</span>
                        </div>
                        <div className="bg-card rounded-lg border border-border p-3">
                          <p className="text-sm text-foreground leading-relaxed">
                            {originalPrompt || 'No prompt provided'}
                          </p>
                        </div>
                      </div>
                      <div className="text-center text-muted-foreground">
                        <p className="text-xs">Ready for AI analysis</p>
                      </div>
                    </div>
                  </div>
                )}

                {promptAnalysis.isAnalyzing && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <LoadingSpinner size="xl" />
                      <p className="text-sm text-foreground">Analyzing prompt...</p>
                      <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
                    </div>
                  </div>
                )}

                {promptAnalysis.analysis && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Analysis Complete!</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(promptAnalysis.analysis.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-3 flex-1">
                      <p className="text-sm text-foreground leading-relaxed">{originalPrompt}</p>
                    </div>
                  </div>
                )}

                {promptAnalysis.error && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                      <p className="text-sm text-destructive font-medium mb-2">Analysis Failed</p>
                      <p className="text-xs text-destructive">{promptAnalysis.error}</p>
                      {promptAnalysis.error.includes('required') && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Please fill in all required fields before analyzing.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content Row - Base Image + Generation Context */}
          <div className="flex gap-6">
            {/* Base Image */}
            {imageUrl && (
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">Base Image</p>
                <div
                  className="relative w-full bg-muted rounded-lg overflow-hidden"
                  style={{ aspectRatio: aspectRatio ? aspectRatio.replace(':', '/') : '1/1' }}
                >
                  <img src={imageUrl} alt="Base image" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* Generation Context */}
            <div className={imageUrl ? 'flex-1' : 'w-full'}>
              <GenerationContextCard
                generationMode={generationMode}
                style={style}
                resolution={resolution}
                aspectRatio={aspectRatio}
                imageUrl={imageUrl}
                customStylePreset={customStylePreset}
                cinematicParameters={cinematicParameters}
                validationState={validation.validationState}
                originalPrompt={originalPrompt}
                enhancedPrompt={enhancedPrompt}
                useEnhancedPrompt={useEnhancedPrompt}
                onToggleEnhancedPrompt={setUseEnhancedPrompt}
              />
            </div>
          </div>

          {/* Analysis Expert */}
          <AnalysisPersonaSelector
            selectedPersona={selectedPersona}
            onSelectPersona={setSelectedPersona}
            personas={ANALYSIS_PERSONAS}
          />

          {/* Analysis Results */}
          {promptAnalysis.analysis && (
            <AnalysisResults
              analysis={promptAnalysis.analysis}
              selectedPrompt={promptAnalysis.selectedPrompt}
              selectedPersona={selectedPersona}
              onPromptChange={promptAnalysis.setSelectedPrompt}
              onCopyPrompt={promptAnalysis.copyPrompt}
              onApplyPrompt={promptAnalysis.applyPrompt}
            />
          )}

          {/* Validation Notice */}
          {subscriptionTier !== 'free' && !validation.isInputValid && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">Missing Required Information</span>
                    <p className="text-sm text-destructive/80 mt-1">
                      Please fill in all required fields before analyzing your prompt
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {validation.validateInputs.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                      {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Notice */}
          {subscriptionTier === 'free' && (
            <Card className="border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-primary-800 dark:text-primary-200">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Premium Feature</span>
                </div>
                <p className="text-sm text-primary-700 dark:text-primary-300 mt-2">
                  Prompt analysis is only available for Plus and Pro subscribers. Upgrade to get AI-powered insights
                  for better image generation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-border bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {promptAnalysis.analysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptAnalysis.saveAsPreset}
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Preset
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={promptAnalysis.isAnalyzing}
              className="border-border hover:bg-accent"
            >
              Close
            </Button>
            {subscriptionTier !== 'free' && (
              <Button
                onClick={handleAnalyze}
                disabled={promptAnalysis.isAnalyzing || !validation.isInputValid}
                className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground shadow-lg"
              >
                {promptAnalysis.isAnalyzing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Optimize Prompt
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
