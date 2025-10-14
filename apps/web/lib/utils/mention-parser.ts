import { MentionableItem } from '../../hooks/useMentionSystem';

export interface ParsedMention {
  text: string;
  item: MentionableItem;
  startIndex: number;
  endIndex: number;
}

/**
 * Parse mentions from a text string and return the referenced items
 */
export function parseMentionsFromText(
  text: string,
  mentionableItems: MentionableItem[]
): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  
  // Create a map for quick lookup
  const itemMap = new Map<string, MentionableItem>();
  mentionableItems.forEach(item => {
    itemMap.set(item.label.toLowerCase(), item);
  });

  // Find all @mentions in the text
  const mentionRegex = /@(\w+)/g;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[0]; // e.g., "@Character"
    const label = match[1]; // e.g., "Character"
    const item = itemMap.get(label.toLowerCase());

    if (item) {
      mentions.push({
        text: mentionText,
        item,
        startIndex: match.index,
        endIndex: match.index + mentionText.length,
      });
    }
  }

  return mentions;
}

/**
 * Get unique referenced items from a text
 */
export function getReferencedItems(
  text: string,
  mentionableItems: MentionableItem[]
): MentionableItem[] {
  const parsedMentions = parseMentionsFromText(text, mentionableItems);
  const uniqueItems = new Map<string, MentionableItem>();

  parsedMentions.forEach(mention => {
    uniqueItems.set(mention.item.id, mention.item);
  });

  return Array.from(uniqueItems.values());
}

/**
 * Replace mentions in text with a custom format
 */
export function replaceMentions(
  text: string,
  mentionableItems: MentionableItem[],
  replacer: (item: MentionableItem, mentionText: string) => string
): string {
  const parsedMentions = parseMentionsFromText(text, mentionableItems);
  let result = text;

  // Process mentions in reverse order to maintain indices
  parsedMentions
    .sort((a, b) => b.startIndex - a.startIndex)
    .forEach(mention => {
      const replacement = replacer(mention.item, mention.text);
      result = 
        result.slice(0, mention.startIndex) + 
        replacement + 
        result.slice(mention.endIndex);
    });

  return result;
}
