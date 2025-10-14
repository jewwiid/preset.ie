/**
 * Utilities for cleaning and processing AI generation prompts
 */

/**
 * Clean up duplicate prompts and replace {subject} with actual subject used
 * Returns both cleaned text and the subject for highlighting
 */
export function cleanPromptWithSubject(
  text: string,
  userSubject?: string
): { cleanedText: string; subject: string | null } {
  if (!text) return { cleanedText: text, subject: null };

  const actualSubject = userSubject || null;

  // Check if text has duplicate pattern
  const parts = text.split(',').map((p) => p.trim());
  if (parts.length >= 6) {
    const midpoint = Math.floor(parts.length / 2);
    const firstHalf = parts.slice(0, midpoint);
    const secondHalf = parts.slice(midpoint);

    let duplicateCount = 0;
    firstHalf.forEach((part, index) => {
      if (secondHalf[index] && part.toLowerCase() === secondHalf[index].toLowerCase()) {
        duplicateCount++;
      }
    });

    // If more than 70% are duplicates, take only first half
    if (duplicateCount / firstHalf.length > 0.7) {
      const cleanedText = firstHalf.join(', ');
      return { cleanedText, subject: actualSubject };
    }
  }

  return { cleanedText: text, subject: actualSubject };
}

/**
 * Get subject from metadata or extract from prompt
 */
export function getSubject(
  userSubject?: string,
  prompt?: string
): string | null {
  // First try stored userSubject
  if (userSubject) {
    if (userSubject === 'image') return 'image';
    return userSubject;
  }

  // Fallback: extract from prompt
  if (prompt) {
    return extractSubjectFromPrompt(prompt);
  }

  return null;
}

/**
 * Extract subject from prompt text using common patterns
 */
export function extractSubjectFromPrompt(promptText: string): string | null {
  const patterns = [
    /of ([^,]+?)(?:\s+with|\s+in|\s+and|,|$)/i,
    /with ([^,]+?)(?:\s+and|\s+in|,|$)/i,
    /featuring ([^,]+?)(?:\s+and|\s+in|,|$)/i,
  ];

  for (const pattern of patterns) {
    const match = promptText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Highlight prompt with different colors for subject and cinematic terms
 */
export function highlightPrompt(
  promptText: string,
  subject?: string | null,
  hasCinematicParams?: boolean
): string {
  if (!promptText) return promptText;

  let highlightedText = promptText;

  // Highlight subject if found
  if (subject) {
    const subjectRegex = new RegExp(`\\b${subject}\\b`, 'gi');
    highlightedText = highlightedText.replace(
      subjectRegex,
      `<span class="text-primary font-semibold bg-primary/10 px-1 rounded">${subject}</span>`
    );
  }

  // Highlight cinematic parameters if they exist
  if (hasCinematicParams) {
    const cinematicTerms = [
      'wide-angle',
      'telephoto',
      'medium-shot',
      'close-up',
      'over-the-shoulder',
      'handheld',
      'tripod',
      'gimbal',
      'natural-light',
      'golden-hour',
      'blue-hour',
      'dramatic',
      'soft',
      'harsh',
      'rim-light',
      'backlight',
      'side-light',
      'shallow-focus',
      'deep-focus',
      'bokeh',
      'sharp',
      'blurred',
      'cinematic',
      'film',
      'movie',
      'cinema',
      'motion-picture',
    ];

    cinematicTerms.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<span class="text-primary-400 font-medium bg-primary-400/10 px-1 rounded">${term}</span>`
      );
    });
  }

  return highlightedText;
}

/**
 * Format style name with emoji
 */
export function getStyleBadge(style: string): string {
  switch (style.toLowerCase()) {
    case 'photorealistic':
    case 'realistic':
      return '📸 Photorealistic';
    case 'artistic':
      return '🎨 Artistic';
    case 'cinematic':
      return '🎬 Cinematic';
    case 'anime':
      return '🌸 Anime';
    case 'fantasy':
      return '✨ Fantasy';
    case 'baroque':
      return '👑 Baroque';
    case 'renaissance':
      return '🏛️ Renaissance';
    case 'impressionist':
      return '🖼️ Impressionist';
    case 'watercolor':
      return '💧 Watercolor';
    case 'sketch':
      return '✏️ Sketch';
    case 'oil_painting':
      return '🖼️ Oil Painting';
    default:
      return `🎨 ${style.charAt(0).toUpperCase() + style.slice(1)}`;
  }
}

/**
 * Format parameter label (e.g., "camera_angle" -> "Camera Angle")
 */
export function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
