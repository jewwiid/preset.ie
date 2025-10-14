/**
 * Text Selection Context Menu
 * 
 * Context menu that appears on text selection to convert selected text
 * into @mentions with type detection and manual type selection.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AtSign, Type, Camera, Palette, MapPin, Ruler, Sparkles, X } from 'lucide-react';
import type { MentionableEntity, MentionType } from '@/lib/utils/mention-types';
import { suggestSimilarEntities } from '@/lib/utils/universal-mention-parser';

interface TextSelectionMenuProps {
  onConvertToMention: (text: string, entity: MentionableEntity) => void;
  availableEntities: MentionableEntity[];
  className?: string;
}

interface SelectionState {
  text: string;
  startIndex: number;
  endIndex: number;
  x: number;
  y: number;
  visible: boolean;
}

const MENTION_TYPE_ICONS: Record<MentionType, React.ComponentType<{ size?: number; className?: string }>> = {
  'subject': Type,
  'cinematic-parameter': Camera,
  'location': MapPin,
  'color': Palette,
  'dimension': Ruler,
  'preset': Sparkles,
  'source-image': Camera,
  'style': Sparkles,
  'lighting': Sparkles,
  'camera': Camera,
  'composition': Type,
  'mood': Type,
  'time': Type,
  'weather': Type,
  'shot-size': Camera,
  'depth-of-field': Camera,
  'resolution': Ruler,
  'edit-type': Type
};

const MENTION_TYPE_LABELS: Record<MentionType, string> = {
  'subject': 'Subject',
  'cinematic-parameter': 'Cinematic',
  'location': 'Location',
  'color': 'Color',
  'dimension': 'Dimension',
  'preset': 'Preset',
  'source-image': 'Image',
  'style': 'Style',
  'lighting': 'Lighting',
  'camera': 'Camera',
  'composition': 'Composition',
  'mood': 'Mood',
  'time': 'Time',
  'weather': 'Weather',
  'shot-size': 'Shot Size',
  'depth-of-field': 'Depth of Field',
  'resolution': 'Resolution',
  'edit-type': 'Edit Type'
};

export default function TextSelectionMenu({
  onConvertToMention,
  availableEntities,
  className = ''
}: TextSelectionMenuProps) {
  const [selection, setSelection] = useState<SelectionState>({
    text: '',
    startIndex: 0,
    endIndex: 0,
    x: 0,
    y: 0,
    visible: false
  });
  
  const [suggestedEntities, setSuggestedEntities] = useState<MentionableEntity[]>([]);
  const [selectedType, setSelectedType] = useState<MentionType | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelection(prev => ({ ...prev, visible: false }));
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 2) {
      setSelection(prev => ({ ...prev, visible: false }));
      return;
    }

    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Calculate menu position
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;

    setSelection({
      text: selectedText,
      startIndex: range.startOffset,
      endIndex: range.endOffset,
      x,
      y,
      visible: true
    });

    // Get suggested entities
    const suggestions = suggestSimilarEntities(selectedText, availableEntities, 5);
    setSuggestedEntities(suggestions);
    setSelectedType(null);
    setShowTypeSelector(false);
  }, [availableEntities]);

  // Handle click outside to close menu
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setSelection(prev => ({ ...prev, visible: false }));
    }
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setSelection(prev => ({ ...prev, visible: false }));
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTextSelection, handleClickOutside, handleKeyDown]);

  // Handle converting to mention
  const handleConvertToMention = useCallback((entity: MentionableEntity) => {
    onConvertToMention(selection.text, entity);
    setSelection(prev => ({ ...prev, visible: false }));
    
    // Clear selection
    const windowSelection = window.getSelection();
    if (windowSelection) {
      windowSelection.removeAllRanges();
    }
  }, [selection.text, onConvertToMention]);

  // Handle manual type selection
  const handleTypeSelection = useCallback((type: MentionType) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    
    // Find or create entity for this type
    const existingEntity = availableEntities.find(e => 
      e.type === type && e.label.toLowerCase() === selection.text.toLowerCase()
    );
    
    if (existingEntity) {
      handleConvertToMention(existingEntity);
    } else {
      // Create a new entity
      const newEntity: MentionableEntity = {
        id: `manual-${type}-${Date.now()}`,
        label: selection.text,
        type,
        value: selection.text,
        color: '#0FA678',
        metadata: {
          category: MENTION_TYPE_LABELS[type],
          confidence: 0.8
        }
      };
      handleConvertToMention(newEntity);
    }
  }, [selection.text, availableEntities, handleConvertToMention]);

  // Get available mention types
  const availableTypes = Array.from(new Set(availableEntities.map(e => e.type)));

  if (!selection.visible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}
      style={{
        left: Math.min(selection.x - 150, window.innerWidth - 320),
        top: Math.max(selection.y - 200, 10),
        width: 300
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Convert to @mention</h4>
          <button
            onClick={() => setSelection(prev => ({ ...prev, visible: false }))}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          Selected: <span className="font-medium">"{selection.text}"</span>
        </div>

        {/* Suggested entities */}
        {suggestedEntities.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Suggestions:</div>
            <div className="space-y-1">
              {suggestedEntities.map((entity, index) => {
                const IconComponent = MENTION_TYPE_ICONS[entity.type] || Type;
                return (
                  <button
                    key={index}
                    onClick={() => handleConvertToMention(entity)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    <IconComponent size={14} className="text-gray-500" />
                    <span className="flex-1">@{entity.label}</span>
                    <span className="text-xs text-gray-500">{MENTION_TYPE_LABELS[entity.type]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual type selection */}
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Or select type:</div>
          
          {!showTypeSelector ? (
            <button
              onClick={() => setShowTypeSelector(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              <AtSign size={14} />
              <span>Choose mention type...</span>
            </button>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableTypes.map((type) => {
                const IconComponent = MENTION_TYPE_ICONS[type] || Type;
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeSelection(type)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    <IconComponent size={14} className="text-gray-500" />
                    <span>{MENTION_TYPE_LABELS[type]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="border-t pt-3 mt-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Quick actions:</div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const entity: MentionableEntity = {
                  id: `quick-subject-${Date.now()}`,
                  label: selection.text,
                  type: 'subject',
                  value: selection.text,
                  color: '#0FA678',
                  metadata: { category: 'Subject', confidence: 0.7 }
                };
                handleConvertToMention(entity);
              }}
              className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              As Subject
            </button>
            <button
              onClick={() => {
                const entity: MentionableEntity = {
                  id: `quick-style-${Date.now()}`,
                  label: selection.text,
                  type: 'style',
                  value: selection.text,
                  color: '#0FA678',
                  metadata: { category: 'Style', confidence: 0.7 }
                };
                handleConvertToMention(entity);
              }}
              className="flex-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              As Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
