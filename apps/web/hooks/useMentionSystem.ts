import { useState, useCallback, useMemo } from 'react';

export interface MentionableItem {
  id: string;
  label: string;
  thumbnail?: string;
  type?: string;
  metadata?: Record<string, any>;
}

export interface MentionMatch {
  start: number;
  end: number;
  query: string;
  item?: MentionableItem;
}

export interface UseMentionSystemOptions {
  items: MentionableItem[];
  triggerChar?: string;
  maxSuggestions?: number;
  onMentionSelect?: (item: MentionableItem, match: MentionMatch) => void;
}

export function useMentionSystem({
  items,
  triggerChar = '@',
  maxSuggestions = 5,
  onMentionSelect,
}: UseMentionSystemOptions) {
  const [activeMatch, setActiveMatch] = useState<MentionMatch | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Parse text for mention patterns
  const parseMentions = useCallback((text: string): MentionMatch[] => {
    const mentions: MentionMatch[] = [];
    const regex = new RegExp(`\\${triggerChar}([^\\s${triggerChar}]*)$`, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      const query = match[1];

      mentions.push({
        start,
        end,
        query,
      });
    }

    return mentions;
  }, [triggerChar]);

  // Get filtered suggestions based on current query
  const suggestions = useMemo(() => {
    if (!activeMatch) return [];

    const query = activeMatch.query.toLowerCase();
    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query)
    );

    return filtered.slice(0, maxSuggestions);
  }, [activeMatch, items, maxSuggestions]);

  // Handle text change and detect mentions
  const handleTextChange = useCallback((text: string, cursorPosition: number) => {
    const mentions = parseMentions(text);
    
    // Find the mention that contains or is near the cursor
    const activeMention = mentions.find(mention => 
      cursorPosition >= mention.start && cursorPosition <= mention.end
    );

    if (activeMention) {
      setActiveMatch(activeMention);
      setSelectedIndex(0);
    } else {
      setActiveMatch(null);
    }
  }, [parseMentions]);

  // Handle mention selection
  const handleMentionSelect = useCallback((item: MentionableItem) => {
    if (!activeMatch) return;

    const mentionText = `${triggerChar}${item.label}`;
    onMentionSelect?.(item, activeMatch);

    setActiveMatch(null);
    setSelectedIndex(0);

    return {
      replacement: mentionText,
      start: activeMatch.start,
      end: activeMatch.end,
    };
  }, [activeMatch, triggerChar, onMentionSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!activeMatch || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        const selectedItem = suggestions[selectedIndex];
        if (selectedItem) {
          return handleMentionSelect(selectedItem);
        }
        break;
      case 'Escape':
        setActiveMatch(null);
        setSelectedIndex(0);
        break;
    }
  }, [activeMatch, suggestions, selectedIndex, handleMentionSelect]);

  return {
    activeMatch,
    suggestions,
    selectedIndex,
    handleTextChange,
    handleMentionSelect,
    handleKeyDown,
    isActive: !!activeMatch,
  };
}
