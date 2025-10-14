/**
 * AI Analyze Button Component
 * 
 * Button that triggers AI-powered mention detection with loading states,
 * confidence display, and suggestion management.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { aiDetectMentions, type MentionDetectionResult, type MentionDetectionError } from '@/lib/ai/mention-detection';
import type { MentionableEntity, MentionDetectionContext } from '@/lib/ai/mention-detection';

interface AIAnalyzeButtonProps {
  onAnalyze: (result: MentionDetectionResult) => void;
  onError?: (error: string) => void;
  text: string;
  context: MentionDetectionContext;
  availableEntities: MentionableEntity[];
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSuggestions?: boolean;
  className?: string;
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export default function AIAnalyzeButton({
  onAnalyze,
  onError,
  text,
  context,
  availableEntities,
  disabled = false,
  size = 'md',
  showSuggestions = true,
  className = ''
}: AIAnalyzeButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');
  const [result, setResult] = useState<MentionDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim() || disabled) return;

    setState('loading');
    setError(null);
    setResult(null);

    try {
      const detectionResult = await aiDetectMentions(
        text,
        context,
        availableEntities,
        {
          confidence: 0.7,
          maxMentions: 20,
          preserveOriginal: true,
          timeout: 15000
        }
      );

      setResult(detectionResult);
      setState('success');
      onAnalyze(detectionResult);

      // Auto-hide success state after 3 seconds
      setTimeout(() => {
        setState('idle');
      }, 3000);

    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? (err as any).message 
        : 'AI analysis failed. Please try again.';
      
      setError(errorMessage);
      setState('error');
      onError?.(errorMessage);

      // Auto-hide error state after 5 seconds
      setTimeout(() => {
        setState('idle');
        setError(null);
      }, 5000);
    }
  }, [text, context, availableEntities, disabled, onAnalyze, onError]);

  const handleAccept = useCallback(() => {
    if (result) {
      onAnalyze(result);
      setState('idle');
      setResult(null);
    }
  }, [result, onAnalyze]);

  const handleReject = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      default: return 'w-10 h-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 20;
      default: return 18;
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className="animate-spin" size={getIconSize()} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={getIconSize()} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={getIconSize()} />;
      default:
        return <Sparkles size={getIconSize()} />;
    }
  };

  const getButtonTitle = () => {
    switch (state) {
      case 'loading':
        return 'Analyzing text with AI...';
      case 'success':
        return `Found ${result?.detectedEntities.length || 0} mentions`;
      case 'error':
        return error || 'Analysis failed';
      default:
        return 'Analyze text with AI to detect mentions';
    }
  };

  const getButtonClasses = () => {
    const baseClasses = `relative inline-flex items-center justify-center rounded-full transition-all duration-200 ${getButtonSize()}`;
    
    switch (state) {
      case 'loading':
        return `${baseClasses} bg-blue-100 text-blue-600 cursor-wait`;
      case 'success':
        return `${baseClasses} bg-green-100 text-green-600 hover:bg-green-200`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-600 hover:bg-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={disabled || state === 'loading' || !text.trim()}
        className={getButtonClasses()}
        title={getButtonTitle()}
        aria-label={getButtonTitle()}
      >
        {getButtonContent()}
      </button>

      {/* Success/Error Details Popup */}
      {(state === 'success' || state === 'error') && showSuggestions && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3">
            {state === 'success' && result && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">AI Analysis Results</h4>
                  <button
                    onClick={handleReject}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                    <span className="text-gray-400">•</span>
                    <span>{result.detectedEntities.length} mentions found</span>
                  </div>
                  
                  {result.detectedEntities.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-medium text-gray-700">Detected mentions:</div>
                      <div className="flex flex-wrap gap-1">
                        {result.detectedEntities.slice(0, 6).map((entity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: entity.color || '#0FA678' }}
                          >
                            @{entity.label}
                          </span>
                        ))}
                        {result.detectedEntities.length > 6 && (
                          <span className="text-xs text-gray-500">
                            +{result.detectedEntities.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {result.suggestions[0]}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {state === 'error' && error && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-red-900">Analysis Failed</h4>
                  <button
                    onClick={handleReject}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="text-sm text-red-700">
                  {error}
                </div>
                
                <button
                  onClick={handleReject}
                  className="w-full px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
