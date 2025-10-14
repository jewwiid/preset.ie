/**
 * AI Mention Detection Library
 * 
 * Client-side library for AI-powered mention detection that analyzes text
 * and automatically inserts @mentions for recognized entities.
 */

import { supabase } from '@/lib/supabase';
import type { MentionableEntity, MentionType } from '@/lib/utils/mention-types';

// Re-export types for convenience
export type { MentionableEntity, MentionType };

export interface MentionDetectionContext {
  mode: 'text-to-image' | 'image-to-image' | 'video' | 'edit' | 'batch';
  availableImages?: string[];
  currentPreset?: any;
  cinematicParams?: any;
  selectedImages?: string[];
}

export interface MentionDetectionOptions {
  confidence?: number;
  maxMentions?: number;
  preserveOriginal?: boolean;
  timeout?: number;
}

export interface MentionDetectionResult {
  originalText: string;
  mentionedText: string;
  detectedEntities: MentionableEntity[];
  confidence: number;
  suggestions?: string[];
  error?: string;
}


/**
 * Main function to detect mentions using AI
 */
export async function aiDetectMentions(
  text: string,
  context: MentionDetectionContext,
  availableEntities: MentionableEntity[],
  options: MentionDetectionOptions = {}
): Promise<MentionDetectionResult> {
  const {
    confidence = 0.7,
    maxMentions = 20,
    preserveOriginal = true,
    timeout = 10000
  } = options;

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new MentionDetectionError({
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Prepare request
    const requestBody = {
      text,
      context,
      availableEntities,
      options: {
        confidence,
        maxMentions,
        preserveOriginal
      }
    };

    console.log('Sending AI mention detection request:', {
      textLength: text.length,
      entityCount: availableEntities.length,
      mode: context.mode
    });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('/api/ai-mentions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new MentionDetectionError({
            message: 'Authentication failed',
            code: 'UNAUTHORIZED'
          });
        }
        
        if (response.status === 403) {
          throw new MentionDetectionError({
            message: errorData.error || 'Subscription required for AI mention detection',
            code: 'SUBSCRIPTION_REQUIRED'
          });
        }
        
        if (response.status >= 500) {
          throw new MentionDetectionError({
            message: errorData.error || 'AI service temporarily unavailable',
            code: 'API_ERROR',
            details: { status: response.status }
          });
        }
        
        throw new MentionDetectionError({
          message: errorData.error || 'Request failed',
          code: 'API_ERROR',
          details: { status: response.status }
        });
      }

      const result: MentionDetectionResult = await response.json();
      
      console.log('AI mention detection successful:', {
        detectedCount: result.detectedEntities.length,
        confidence: result.confidence,
        textChanged: result.mentionedText !== result.originalText
      });

      return result;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof MentionDetectionError) {
        throw fetchError;
      }
      
      if (fetchError.name === 'AbortError') {
        throw new MentionDetectionError({
          message: 'Request timed out',
          code: 'TIMEOUT'
        });
      }
      
      throw new MentionDetectionError({
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: fetchError
      });
    }

  } catch (error) {
    if (error instanceof MentionDetectionError) {
      throw error;
    }
    
    console.error('Unexpected error in AI mention detection:', error);
    throw new MentionDetectionError({
      message: 'An unexpected error occurred',
      code: 'API_ERROR',
      details: error
    });
  }
}

/**
 * Batch detect mentions for multiple texts
 */
export async function batchDetectMentions(
  texts: string[],
  context: MentionDetectionContext,
  availableEntities: MentionableEntity[],
  options: MentionDetectionOptions = {}
): Promise<MentionDetectionResult[]> {
  const results: MentionDetectionResult[] = [];
  
  // Process texts in parallel with concurrency limit
  const concurrency = 3;
  const chunks = [];
  
  for (let i = 0; i < texts.length; i += concurrency) {
    chunks.push(texts.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(text => 
      aiDetectMentions(text, context, availableEntities, options)
        .catch(error => ({
          originalText: text,
          mentionedText: text,
          detectedEntities: [],
          confidence: 0,
          error: error.message
        }))
    );
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Smart mention detection that combines AI and rule-based approaches
 */
export async function smartDetectMentions(
  text: string,
  context: MentionDetectionContext,
  availableEntities: MentionableEntity[],
  options: MentionDetectionOptions = {}
): Promise<MentionDetectionResult> {
  // First, try AI detection
  try {
    const aiResult = await aiDetectMentions(text, context, availableEntities, options);
    
    // If AI confidence is high, return AI result
    if (aiResult.confidence >= 0.8) {
      return aiResult;
    }
    
    // Otherwise, fall back to rule-based detection
    console.log('AI confidence low, falling back to rule-based detection');
    return fallbackRuleBasedDetection(text, availableEntities, options);
    
  } catch (error) {
    console.log('AI detection failed, using rule-based fallback:', error);
    return fallbackRuleBasedDetection(text, availableEntities, options);
  }
}

/**
 * Rule-based fallback mention detection
 */
function fallbackRuleBasedDetection(
  text: string,
  availableEntities: MentionableEntity[],
  options: MentionDetectionOptions = {}
): MentionDetectionResult {
  const mentionedText = text;
  const detectedEntities: MentionableEntity[] = [];
  
  // Simple keyword matching
  const words = text.toLowerCase().split(/\s+/);
  
  for (const entity of availableEntities) {
    const entityWords = entity.label.toLowerCase().split(/\s+/);
    
    // Check if all entity words are present in text
    const isMatch = entityWords.every(word => 
      words.some(textWord => textWord.includes(word) || word.includes(textWord))
    );
    
    if (isMatch) {
      detectedEntities.push({
        ...entity,
        metadata: {
          ...entity.metadata,
          confidence: 0.6 // Lower confidence for rule-based
        }
      });
    }
  }
  
  return {
    originalText: text,
    mentionedText,
    detectedEntities,
    confidence: detectedEntities.length > 0 ? 0.6 : 0,
    suggestions: ['Rule-based detection used']
  };
}

/**
 * Validate mention detection context
 */
export function validateMentionContext(context: MentionDetectionContext): string[] {
  const errors: string[] = [];
  
  if (!context.mode) {
    errors.push('Mode is required');
  }
  
  const validModes = ['text-to-image', 'image-to-image', 'video', 'edit', 'batch'];
  if (context.mode && !validModes.includes(context.mode)) {
    errors.push(`Invalid mode: ${context.mode}. Must be one of: ${validModes.join(', ')}`);
  }
  
  if (context.availableImages && !Array.isArray(context.availableImages)) {
    errors.push('Available images must be an array');
  }
  
  if (context.selectedImages && !Array.isArray(context.selectedImages)) {
    errors.push('Selected images must be an array');
  }
  
  return errors;
}

/**
 * Get context-specific entity suggestions
 */
export function getContextualEntitySuggestions(
  context: MentionDetectionContext,
  availableEntities: MentionableEntity[]
): MentionableEntity[] {
  const suggestions: MentionableEntity[] = [];
  
  switch (context.mode) {
    case 'text-to-image':
      suggestions.push(
        ...availableEntities.filter(e => 
          ['subject', 'style', 'lighting', 'location', 'dimension', 'mood'].includes(e.type)
        )
      );
      break;
      
    case 'image-to-image':
      suggestions.push(
        ...availableEntities.filter(e => 
          ['edit-type', 'style', 'lighting', 'dimension'].includes(e.type)
        )
      );
      break;
      
    case 'video':
      suggestions.push(
        ...availableEntities.filter(e => 
          ['cinematic-parameter', 'camera', 'motion', 'dimension'].includes(e.type)
        )
      );
      break;
      
    case 'edit':
      suggestions.push(
        ...availableEntities.filter(e => 
          ['edit-type', 'style', 'dimension'].includes(e.type)
        )
      );
      break;
      
    case 'batch':
      suggestions.push(
        ...availableEntities.filter(e => 
          ['subject', 'style', 'dimension'].includes(e.type)
        )
      );
      break;
  }
  
  return suggestions.slice(0, 10); // Limit suggestions
}

/**
 * Custom error class for mention detection
 */
export class MentionDetectionError extends Error {
  public readonly code: 'UNAUTHORIZED' | 'SUBSCRIPTION_REQUIRED' | 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT';
  public readonly details?: any;
  
  constructor({ message, code, details }: { 
    message: string; 
    code: 'UNAUTHORIZED' | 'SUBSCRIPTION_REQUIRED' | 'API_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT'; 
    details?: any 
  }) {
    super(message);
    this.name = 'MentionDetectionError';
    this.code = code;
    this.details = details;
  }
}

