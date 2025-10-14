/**
 * Universal Mention Parser
 * 
 * Advanced parser that detects all mention types from text with fuzzy matching,
 * context awareness, and multi-word mention support.
 */

import React from 'react';
import type { MentionableEntity, ParsedMention, MentionType } from './mention-types';

// Re-export types for convenience
export type { ParsedMention, MentionableEntity, MentionType };

export interface ParseOptions {
  fuzzyMatch?: boolean;
  contextAware?: boolean;
  highlightColors?: boolean;
  minConfidence?: number;
  maxMentions?: number;
  caseSensitive?: boolean;
}

export interface ParseResult {
  mentions: ParsedMention[];
  highlightedText: React.ReactNode;
  confidence: number;
  hasUnrecognizedMentions: boolean;
}

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate similarity score (0-1, higher is more similar)
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

// Check if text contains a mention pattern
function isMentionPattern(text: string): boolean {
  return text.startsWith('@') && text.length > 1;
}

// Extract potential mentions from text
function extractPotentialMentions(text: string): Array<{ text: string; startIndex: number; endIndex: number }> {
  const mentions: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  
  // Find @mentions
  const mentionRegex = /@(\w+(?:[-_]\w+)*)/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      text: match[1], // Without the @
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }
  
  return mentions;
}

// Find best matching entity for a text fragment
function findBestMatch(
  text: string,
  entities: MentionableEntity[],
  options: ParseOptions
): { entity: MentionableEntity; confidence: number } | null {
  const normalizedText = options.caseSensitive ? text : text.toLowerCase();
  let bestMatch: { entity: MentionableEntity; confidence: number } | null = null;
  
  for (const entity of entities) {
    let confidence = 0;
    
    // Exact match (highest priority)
    if (entity.label.toLowerCase() === normalizedText) {
      confidence = 1.0;
    } else if (entity.value.toLowerCase() === normalizedText) {
      confidence = 0.95;
    } else if (entity.metadata?.synonyms?.some(syn => syn.toLowerCase() === normalizedText)) {
      confidence = 0.9;
    } else if (options.fuzzyMatch) {
      // Fuzzy matching
      const labelSimilarity = calculateSimilarity(normalizedText, entity.label);
      const valueSimilarity = calculateSimilarity(normalizedText, entity.value);
      const synonymSimilarity = entity.metadata?.synonyms?.reduce((max, syn) => 
        Math.max(max, calculateSimilarity(normalizedText, syn)), 0) || 0;
      
      confidence = Math.max(labelSimilarity, valueSimilarity, synonymSimilarity);
      
      // Boost confidence for partial matches
      if (entity.label.toLowerCase().includes(normalizedText) || 
          normalizedText.includes(entity.label.toLowerCase())) {
        confidence = Math.max(confidence, 0.7);
      }
    }
    
    // Apply minimum confidence threshold
    if (confidence >= (options.minConfidence || 0.6)) {
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { entity, confidence };
      }
    }
  }
  
  return bestMatch;
}

// Context-aware mention detection
function detectContextualMentions(
  text: string,
  entities: MentionableEntity[],
  options: ParseOptions
): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  const words = text.split(/\s+/);
  
  if (!options.contextAware) {
    return mentions;
  }
  
  // Look for multi-word patterns and contextual clues
  for (let i = 0; i < words.length; i++) {
    // Check single words
    const singleWord = words[i].replace(/[^\w]/g, '');
    if (singleWord.length > 2) {
      const match = findBestMatch(singleWord, entities, options);
      if (match) {
        const startIndex = text.indexOf(singleWord);
        mentions.push({
          entity: match.entity,
          startIndex,
          endIndex: startIndex + singleWord.length,
          originalText: singleWord,
          confidence: match.confidence,
          context: words.slice(Math.max(0, i - 2), i + 3).join(' ')
        });
      }
    }
    
    // Check two-word combinations
    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`.replace(/[^\w\s]/g, '');
      const match = findBestMatch(twoWords, entities, options);
      if (match) {
        const startIndex = text.indexOf(twoWords);
        mentions.push({
          entity: match.entity,
          startIndex,
          endIndex: startIndex + twoWords.length,
          originalText: twoWords,
          confidence: match.confidence,
          context: words.slice(Math.max(0, i - 1), i + 4).join(' ')
        });
      }
    }
    
    // Check three-word combinations for complex terms
    if (i < words.length - 2) {
      const threeWords = `${words[i]} ${words[i + 1]} ${words[i + 2]}`.replace(/[^\w\s]/g, '');
      const match = findBestMatch(threeWords, entities, options);
      if (match) {
        const startIndex = text.indexOf(threeWords);
        mentions.push({
          entity: match.entity,
          startIndex,
          endIndex: startIndex + threeWords.length,
          originalText: threeWords,
          confidence: match.confidence,
          context: words.slice(Math.max(0, i - 1), i + 5).join(' ')
        });
      }
    }
  }
  
  return mentions;
}

// Main parsing function
export function parseUniversalMentions(
  text: string,
  availableEntities: MentionableEntity[],
  options: ParseOptions = {}
): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  const defaultOptions: ParseOptions = {
    fuzzyMatch: true,
    contextAware: true,
    highlightColors: true,
    minConfidence: 0.6,
    maxMentions: 50,
    caseSensitive: false,
    ...options
  };
  
  // Extract explicit @mentions first
  const potentialMentions = extractPotentialMentions(text);
  
  for (const potential of potentialMentions) {
    const match = findBestMatch(potential.text, availableEntities, defaultOptions);
    if (match) {
      mentions.push({
        entity: match.entity,
        startIndex: potential.startIndex,
        endIndex: potential.endIndex,
        originalText: potential.text,
        confidence: match.confidence,
        context: text.slice(Math.max(0, potential.startIndex - 20), potential.endIndex + 20)
      });
    }
  }
  
  // Add contextual mentions if enabled
  if (defaultOptions.contextAware) {
    const contextualMentions = detectContextualMentions(text, availableEntities, defaultOptions);
    
    // Merge contextual mentions, avoiding duplicates
    for (const contextual of contextualMentions) {
      const isDuplicate = mentions.some(existing => 
        existing.startIndex === contextual.startIndex && 
        existing.endIndex === contextual.endIndex
      );
      
      if (!isDuplicate) {
        mentions.push(contextual);
      }
    }
  }
  
  // Sort by confidence and limit results
  mentions.sort((a, b) => b.confidence - a.confidence);
  
  if (defaultOptions.maxMentions) {
    mentions.splice(defaultOptions.maxMentions);
  }
  
  return mentions;
}

// Highlight mentions in text with React components
export function highlightMentions(
  text: string,
  mentions: ParsedMention[],
  options: { 
    highlightColors?: boolean;
    className?: string;
    mentionClassName?: string;
  } = {}
): React.ReactNode {
  const { highlightColors = true, className = '', mentionClassName = '' } = options;
  
  if (mentions.length === 0) {
    return <span className={className}>{text}</span>;
  }
  
  // Sort mentions by start index
  const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex);
  
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  
  for (const mention of sortedMentions) {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, mention.startIndex)}
        </span>
      );
    }
    
    // Add highlighted mention
    const mentionColor = highlightColors && mention.entity.color ? mention.entity.color : '#0FA678';
    elements.push(
      <span
        key={`mention-${mention.startIndex}`}
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white ${mentionClassName}`}
        style={{ backgroundColor: mentionColor }}
        title={`${mention.entity.label} (${mention.entity.type}) - ${Math.round(mention.confidence * 100)}% confidence`}
      >
        @{mention.entity.label}
      </span>
    );
    
    lastIndex = mention.endIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }
  
  return <span className={className}>{elements}</span>;
}

// Parse text and return highlighted result
export function parseAndHighlight(
  text: string,
  availableEntities: MentionableEntity[],
  options: ParseOptions = {}
): ParseResult {
  const mentions = parseUniversalMentions(text, availableEntities, options);
  
  // Check for unrecognized @mentions
  const potentialMentions = extractPotentialMentions(text);
  const recognizedMentionTexts = new Set(mentions.map(m => m.originalText));
  const hasUnrecognizedMentions = potentialMentions.some(p => !recognizedMentionTexts.has(p.text));
  
  // Calculate overall confidence
  const confidence = mentions.length > 0 
    ? mentions.reduce((sum, m) => sum + m.confidence, 0) / mentions.length 
    : 0;
  
  return {
    mentions,
    highlightedText: highlightMentions(text, mentions, { highlightColors: options.highlightColors }),
    confidence,
    hasUnrecognizedMentions
  };
}

// Utility to filter entities by type
export function filterEntitiesByType(
  entities: MentionableEntity[],
  types: MentionType[]
): MentionableEntity[] {
  return entities.filter(entity => types.includes(entity.type));
}

// Utility to get entities by category
export function getEntitiesByCategory(
  entities: MentionableEntity[],
  category: string
): MentionableEntity[] {
  return entities.filter(entity => entity.metadata?.category === category);
}

// Utility to suggest similar entities for unrecognized mentions
export function suggestSimilarEntities(
  text: string,
  availableEntities: MentionableEntity[],
  maxSuggestions: number = 5
): MentionableEntity[] {
  const suggestions: Array<{ entity: MentionableEntity; similarity: number }> = [];
  
  for (const entity of availableEntities) {
    const similarity = calculateSimilarity(text.toLowerCase(), entity.label.toLowerCase());
    if (similarity > 0.3) { // Minimum similarity threshold
      suggestions.push({ entity, similarity });
    }
  }
  
  return suggestions
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxSuggestions)
    .map(s => s.entity);
}
