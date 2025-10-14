'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMentionSystem, MentionableItem } from '../../../hooks/useMentionSystem';
import VoiceToTextButton from '@/components/ui/VoiceToTextButton';
import { typewriterWithMentions } from '../../../lib/utils/voice-mention-parser';
import AIAnalyzeButton from '@/app/components/ui/ai-analyze-button';
import TextSelectionMenu from '@/app/components/ui/text-selection-menu';
import { parseAndHighlight, type ParseResult } from '@/lib/utils/universal-mention-parser';
import type { MentionableEntity, MentionType } from '@/lib/utils/mention-types';
import type { MentionDetectionContext, MentionDetectionResult } from '@/lib/ai/mention-detection';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  mentionableItems: MentionableItem[];
  onMentionSelect?: (item: MentionableItem) => void;
  disabled?: boolean;
  rows?: number;
  userSubscriptionTier?: string;
  enableVoiceToText?: boolean;
  // Enhanced universal mention props
  mentionTypes?: MentionType[];
  enableAIMentions?: boolean;
  onAIMentionDetect?: (text: string) => Promise<string>;
  colorCodedMentions?: boolean;
  allowTextSelection?: boolean;
  mentionContext?: MentionDetectionContext;
  availableEntities?: MentionableEntity[];
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  mentionableItems,
  onMentionSelect,
  disabled = false,
  rows = 4,
  userSubscriptionTier = 'FREE',
  enableVoiceToText = true,
  // Enhanced universal mention props
  mentionTypes,
  enableAIMentions = false,
  onAIMentionDetect,
  colorCodedMentions = true,
  allowTextSelection = true,
  mentionContext,
  availableEntities = []
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const {
    activeMatch,
    suggestions,
    selectedIndex,
    handleTextChange,
    handleMentionSelect,
    handleKeyDown,
    isActive} = useMentionSystem({
    items: mentionableItems,
    onMentionSelect: (item) => {
      onMentionSelect?.(item);
      setShowSuggestions(false);
    }});

  // Update cursor position when text changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(newCursorPosition);
    handleTextChange(newValue, newCursorPosition);
  };

  // Handle cursor position changes
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart || 0);
    }
  };

  // Handle keyboard events
  const handleKeyDownEvent = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const result = handleKeyDown(e);
    
    if (result) {
      // Replace the mention in the text
      const newValue = 
        value.slice(0, result.start) + 
        result.replacement + 
        value.slice(result.end);
      
      onChange(newValue);
      
      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = result.start + result.replacement.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPosition(newCursorPos);
        }
      }, 0);
    }
  };

  // Show/hide suggestions based on active state
  useEffect(() => {
    setShowSuggestions(isActive && suggestions.length > 0);
  }, [isActive, suggestions.length]);

  // Calculate suggestions position
  const getSuggestionsPosition = () => {
    if (!textareaRef.current || !activeMatch) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const textareaRect = textarea.getBoundingClientRect();
    
    // Create a temporary element to measure text position
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.font = window.getComputedStyle(textarea).font;
    tempDiv.style.width = textarea.style.width;
    tempDiv.style.padding = window.getComputedStyle(textarea).padding;
    tempDiv.textContent = value.slice(0, activeMatch.start);
    
    document.body.appendChild(tempDiv);
    const tempRect = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    return {
      top: tempRect.bottom - textareaRect.top + 5,
      left: tempRect.left - textareaRect.left};
  };

  const suggestionsPosition = getSuggestionsPosition();

  // Enhanced mention parsing with universal entities
  const enhancedMentionableItems = useMemo(() => {
    // Combine legacy mentionable items with universal entities
    const legacyItems = mentionableItems.map(item => ({
      id: item.id,
      label: item.label,
      type: 'source-image' as MentionType,
      value: item.label,
      thumbnail: item.thumbnail,
      metadata: {
        category: 'Image',
        description: item.description,
        confidence: 1.0
      }
    }));
    
    return [...legacyItems, ...availableEntities];
  }, [mentionableItems, availableEntities]);

  // Parse text for universal mentions
  useEffect(() => {
    if (value && availableEntities.length > 0) {
      const result = parseAndHighlight(value, availableEntities, {
        fuzzyMatch: true,
        contextAware: true,
        highlightColors: colorCodedMentions,
        minConfidence: 0.6
      });
      setParseResult(result);
    } else {
      setParseResult(null);
    }
  }, [value, availableEntities, colorCodedMentions]);

  // Smart voice-to-text processing that handles mentions
  const processVoiceText = async (transcribedText: string) => {
    // Get the base text (current value + space if needed)
    const base = value.endsWith(' ') || !value ? value : value + ' ';
    
    // Use the enhanced typewriter with mention processing
    await typewriterWithMentions(
      transcribedText,
      mentionableItems,
      (newText) => onChange(base + newText),
      {
        delay: 8,
        processMentions: true
      }
    );
  };

  // Handle AI mention detection
  const handleAIMentionDetection = useCallback((result: MentionDetectionResult) => {
    onChange(result.mentionedText);
  }, [onChange]);

  // Handle text selection to mention conversion
  const handleTextSelectionToMention = useCallback((text: string, entity: MentionableEntity) => {
    const mentionText = `@${entity.label}`;
    const newValue = value.replace(text, mentionText);
    onChange(newValue);
  }, [value, onChange]);

  // Enhanced text rendering with universal mentions
  const renderTextWithMentions = useMemo(() => {
    // If we have parse results, use the enhanced highlighting
    if (parseResult && parseResult.mentions.length > 0) {
      return parseResult.highlightedText;
    }

    // Fallback to legacy mention parsing
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(value)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: value.slice(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      // Find the mentionable item (check both legacy and universal entities)
      const mentionText = match[1];
      const mentionableItem = mentionableItems.find(item => 
        item.label.toLowerCase() === mentionText.toLowerCase()
      );
      
      const universalEntity = availableEntities.find(entity =>
        entity.label.toLowerCase() === mentionText.toLowerCase()
      );

      // Add the mention with enhanced styling
      parts.push({
        type: 'mention',
        content: match[0],
        label: mentionText,
        item: mentionableItem,
        entity: universalEntity,
        key: `mention-${match.index}`
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push({
        type: 'text',
        content: value.slice(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts;
  }, [value, mentionableItems, availableEntities, parseResult]);

  return (
    <div className="relative">
      {/* Hidden textarea for input handling */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onSelect={handleCursorChange}
        onKeyDown={handleKeyDownEvent}
        placeholder={placeholder}
        className={cn(
          'resize-none absolute inset-0 opacity-0 pointer-events-none',
          className
        )}
        disabled={disabled}
        rows={rows}
      />
      
      {/* Action buttons */}
      <div className="absolute right-2 bottom-2 z-10 flex gap-2">
        {/* AI Analyze button */}
        {enableAIMentions && mentionContext && availableEntities.length > 0 && (
          <AIAnalyzeButton
            onAnalyze={handleAIMentionDetection}
            text={value}
            context={mentionContext}
            availableEntities={availableEntities}
            disabled={disabled || userSubscriptionTier === 'FREE'}
            size="sm"
          />
        )}
        
        {/* Voice-to-text button */}
        {enableVoiceToText && (
          <VoiceToTextButton
            onAppendText={processVoiceText}
            disabled={disabled}
            userSubscriptionTier={userSubscriptionTier as 'FREE' | 'PLUS' | 'PRO'}
            size={32}
          />
        )}
      </div>
      
      {/* Visible styled text display */}
      <div 
        className={cn(
          'min-h-[80px] p-3 border border-input rounded-md bg-background text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'whitespace-pre-wrap break-words cursor-text',
          (enableVoiceToText || enableAIMentions) ? 'pr-20' : '',
          className
        )}
        style={{ minHeight: `${rows * 1.5}rem` }}
        onClick={() => textareaRef.current?.focus()}
      >
        <TooltipProvider>
          {typeof renderTextWithMentions === 'object' && 'map' in renderTextWithMentions ? (
            // Legacy rendering for array of parts
            renderTextWithMentions.map((part) => {
              if (part.type === 'text') {
                return <span key={part.key}>{part.content}</span>;
              } else {
                const mentionItem = part.item;
                const universalEntity = part.entity;
                const entity = universalEntity || mentionItem;
                
                return (
                  <Tooltip key={part.key}>
                    <TooltipTrigger asChild>
                      <span 
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer shadow-sm",
                          entity 
                            ? "text-white border border-transparent hover:opacity-80"
                            : "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 hover:border-destructive/40"
                        )}
                        style={entity && universalEntity ? { backgroundColor: universalEntity.color || '#0FA678' } : undefined}
                      >
                        {part.content}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {entity ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {mentionItem?.thumbnail && (
                              <div className="w-6 h-6 rounded overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={mentionItem.thumbnail}
                                  alt={mentionItem.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm">{entity.label}</div>
                              {universalEntity?.metadata?.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {universalEntity.metadata.category}
                                </Badge>
                              )}
                              {mentionItem?.type && (
                                <Badge variant="secondary" className="text-xs">
                                  {mentionItem.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {(mentionItem?.description || universalEntity?.metadata?.description) && (
                            <div className="text-xs text-muted-foreground">
                              {mentionItem?.description || universalEntity?.metadata?.description}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium text-destructive">@{part.label}</div>
                          <div className="text-xs text-muted-foreground">
                            Reference not found - check spelling
                          </div>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }
            })
          ) : (
            // Enhanced rendering from parseResult
            renderTextWithMentions
          )}
        </TooltipProvider>
        
        {/* Show placeholder when empty */}
        {!value && placeholder && (
          <span className="text-muted-foreground pointer-events-none">
            {placeholder}
          </span>
        )}
      </div>
      
      {/* Mention Suggestions - Enhanced Autocomplete */}
      {showSuggestions && (
        <Card 
          className="absolute z-50 w-80 max-h-60 overflow-y-auto shadow-xl border-2 border-primary/30 bg-background/95 backdrop-blur-sm ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            top: suggestionsPosition.top,
            left: suggestionsPosition.left}}
        >
          <CardContent className="p-2">
            <div className="space-y-1">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b border-border/50 mb-2">
                Select an image to reference:
              </div>
              {suggestions.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-150',
                    index === selectedIndex
                      ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                      : 'hover:bg-muted/80 hover:scale-[1.01]'
                  )}
                  onClick={() => {
                    const result = handleMentionSelect(item);
                    if (result) {
                      const newValue = 
                        value.slice(0, result.start) + 
                        result.replacement + 
                        value.slice(result.end);
                      onChange(newValue);
                      setShowSuggestions(false);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  {item.thumbnail && (
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border">
                      <img
                        src={item.thumbnail}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {item.label}
                    </div>
                    {item.type && (
                      <Badge 
                        variant={index === selectedIndex ? "secondary" : "outline"} 
                        className="text-xs mt-1"
                      >
                        {item.type}
                      </Badge>
                    )}
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Selection indicator */}
                  {index === selectedIndex && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
              
              {suggestions.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No matching images found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Text Selection Context Menu */}
      {allowTextSelection && availableEntities.length > 0 && (
        <TextSelectionMenu
          onConvertToMention={handleTextSelectionToMention}
          availableEntities={availableEntities}
        />
      )}
    </div>
  );
}
