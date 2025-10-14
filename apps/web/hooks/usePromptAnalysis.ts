'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useToast } from '@/components/ui/toast';

export interface PromptAnalysis {
  promptAnalysis: string;
  styleAlignment: string;
  aspectRatioConsiderations: string;
  cinematicAnalysis?: string;
  baseImageInsights: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  alternativePrompts: string[];
  technicalSuggestions: string[];
  professionalInsights?: string[];
  recommendedPrompt: string;
  confidence: number;
  estimatedImprovement: string;
}

export interface AnalysisParams {
  prompt: string;
  style: string;
  resolution: string;
  aspectRatio: string;
  generationMode: 'text-to-image' | 'image-to-image';
  imageUrl?: string;
  customStylePreset?: any;
  cinematicParameters?: any;
  selectedPersona: string;
  subscriptionTier: 'free' | 'plus' | 'pro';
}

interface UsePromptAnalysisOptions {
  onApplyPrompt?: (prompt: string) => void;
  onSaveAsPreset?: (analysis: PromptAnalysis) => void;
}

export function usePromptAnalysis(options?: UsePromptAnalysisOptions) {
  const { session } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  const analyzePrompt = async (params: AnalysisParams): Promise<boolean> => {
    if (!session?.access_token) {
      showError('Authentication Error', 'Please sign in to use prompt analysis');
      return false;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/playground/analyze-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          originalPrompt: params.prompt,
          baseImageUrl: params.imageUrl,
          style: params.style,
          resolution: params.resolution,
          aspectRatio: params.aspectRatio,
          generationMode: params.generationMode,
          customStylePreset: params.customStylePreset,
          cinematicParameters: params.cinematicParameters,
          analysisPersona: params.selectedPersona,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze prompt');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setSelectedPrompt(data.analysis.recommendedPrompt);
      showSuccess('Analysis Complete', 'Your prompt has been analyzed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze prompt';
      setError(errorMessage);
      showError('Analysis Failed', errorMessage);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      showSuccess('Copied!', 'Prompt copied to clipboard');
    } catch (err) {
      showError('Copy Failed', 'Failed to copy prompt to clipboard');
    }
  };

  const applyPrompt = () => {
    if (selectedPrompt && options?.onApplyPrompt) {
      options.onApplyPrompt(selectedPrompt);
      showSuccess('Applied!', 'Recommended prompt has been applied');
    }
  };

  const saveAsPreset = () => {
    if (analysis && options?.onSaveAsPreset) {
      options.onSaveAsPreset(analysis);
      showSuccess('Saved!', 'Analysis saved as preset');
    }
  };

  const reset = () => {
    setAnalysis(null);
    setError(null);
    setSelectedPrompt('');
  };

  return {
    isAnalyzing,
    analysis,
    error,
    selectedPrompt,
    setSelectedPrompt,
    analyzePrompt,
    copyPrompt,
    applyPrompt,
    saveAsPreset,
    reset,
  };
}
