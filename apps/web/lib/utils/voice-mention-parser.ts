import { MentionableItem } from '../../hooks/useMentionSystem';

/**
 * Smart voice-to-text mention parser that converts spoken words into proper mentions
 * when they match mentionable items in the system.
 */

export interface VoiceMentionResult {
  processedText: string;
  detectedMentions: Array<{
    originalWord: string;
    mentionText: string;
    item: MentionableItem;
  }>;
}

/**
 * Processes voice-transcribed text and converts matching words to mentions
 * @param transcribedText - The text from voice transcription
 * @param mentionableItems - Available items that can be mentioned
 * @param options - Configuration options
 */
export function processVoiceMentions(
  transcribedText: string,
  mentionableItems: MentionableItem[],
  options: {
    caseSensitive?: boolean;
    partialMatch?: boolean;
    confidenceThreshold?: number;
  } = {}
): VoiceMentionResult {
  const {
    caseSensitive = false,
    partialMatch = false,
    confidenceThreshold = 0.8
  } = options;

  const words = transcribedText.split(/\s+/);
  const detectedMentions: VoiceMentionResult['detectedMentions'] = [];
  const processedWords: string[] = [];

  for (const word of words) {
    // Clean the word (remove punctuation, normalize case)
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    
    // Find matching mentionable item
    const matchingItem = findMatchingMentionableItem(
      cleanWord,
      mentionableItems,
      { caseSensitive, partialMatch }
    );

    if (matchingItem) {
      // Convert to mention format
      const mentionText = `@${matchingItem.label}`;
      processedWords.push(mentionText);
      
      detectedMentions.push({
        originalWord: word,
        mentionText,
        item: matchingItem
      });
    } else {
      // Keep original word
      processedWords.push(word);
    }
  }

  return {
    processedText: processedWords.join(' '),
    detectedMentions
  };
}

/**
 * Finds a matching mentionable item for a given word
 */
function findMatchingMentionableItem(
  word: string,
  mentionableItems: MentionableItem[],
  options: { caseSensitive: boolean; partialMatch: boolean }
): MentionableItem | null {
  const { caseSensitive, partialMatch } = options;
  
  for (const item of mentionableItems) {
    const itemLabel = caseSensitive ? item.label : item.label.toLowerCase();
    const itemType = item.type ? (caseSensitive ? item.type : item.type.toLowerCase()) : '';
    const searchWord = caseSensitive ? word : word.toLowerCase();

    // Exact match
    if (itemLabel === searchWord || itemType === searchWord) {
      return item;
    }

    // Partial match if enabled
    if (partialMatch) {
      if (itemLabel.includes(searchWord) || searchWord.includes(itemLabel)) {
        return item;
      }
      if (itemType && (itemType.includes(searchWord) || searchWord.includes(itemType))) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Enhanced mention detection that handles common voice transcription variations
 */
export function detectVoiceMentions(
  transcribedText: string,
  mentionableItems: MentionableItem[]
): VoiceMentionResult {
  // Common voice transcription variations
  const variations = [
    // Direct word replacement
    (text: string) => text,
    
    // Handle "at" prefix (e.g., "at character" -> "@character")
    (text: string) => text.replace(/\bat\s+(\w+)/gi, '@$1'),
    
    // Handle "mention" prefix (e.g., "mention character" -> "@character")
    (text: string) => text.replace(/\bmention\s+(\w+)/gi, '@$1'),
    
    // Handle "reference" prefix (e.g., "reference character" -> "@character")
    (text: string) => text.replace(/\breference\s+(\w+)/gi, '@$1'),
    
    // Handle "use" prefix (e.g., "use character" -> "@character")
    (text: string) => text.replace(/\buse\s+(\w+)/gi, '@$1'),
  ];

  let bestResult: VoiceMentionResult = {
    processedText: transcribedText,
    detectedMentions: []
  };

  let maxMentions = 0;

  // Try each variation and pick the one with the most detected mentions
  for (const variation of variations) {
    const processedText = variation(transcribedText);
    const result = processVoiceMentions(processedText, mentionableItems, {
      caseSensitive: false,
      partialMatch: true
    });

    if (result.detectedMentions.length > maxMentions) {
      maxMentions = result.detectedMentions.length;
      bestResult = result;
    }
  }

  return bestResult;
}

/**
 * Typewriter effect with smart mention processing
 */
export async function typewriterWithMentions(
  text: string,
  mentionableItems: MentionableItem[],
  onUpdate: (text: string) => void,
  options: {
    delay?: number;
    processMentions?: boolean;
  } = {}
): Promise<void> {
  const { delay = 8, processMentions = true } = options;
  
  let currentText = '';
  
  if (processMentions) {
    // Process the entire text for mentions first
    const result = detectVoiceMentions(text, mentionableItems);
    text = result.processedText;
  }
  
  // Typewriter effect
  for (let i = 0; i < text.length; i++) {
    currentText += text[i];
    onUpdate(currentText);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Common subject/type keywords that should be converted to mentions
 */
export const COMMON_SUBJECT_KEYWORDS = [
  'character', 'model', 'person', 'portrait', 'face',
  'location', 'place', 'background', 'scene', 'setting',
  'style', 'fashion', 'outfit', 'clothing', 'garment',
  'object', 'product', 'item', 'thing',
  'reference', 'image', 'photo', 'picture'
];

/**
 * Enhanced processing for playground subject mentions
 */
export function processPlaygroundSubject(
  transcribedText: string,
  availableTypes: string[] = COMMON_SUBJECT_KEYWORDS
): string {
  const words = transcribedText.split(/\s+/);
  const processedWords: string[] = [];

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    
    // Check if this word matches any available type
    const matchingType = availableTypes.find(type => 
      type.toLowerCase() === cleanWord ||
      cleanWord.includes(type.toLowerCase()) ||
      type.toLowerCase().includes(cleanWord)
    );

    if (matchingType) {
      // Convert to mention format
      processedWords.push(`@${matchingType}`);
    } else {
      processedWords.push(word);
    }
  }

  return processedWords.join(' ');
}
