/**
 * Value object for application note with validation
 */
export class ApplicationNote {
  private static readonly MAX_LENGTH = 500;
  private static readonly MIN_LENGTH = 0;

  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (this.value.length > ApplicationNote.MAX_LENGTH) {
      throw new Error(`Application note cannot exceed ${ApplicationNote.MAX_LENGTH} characters`);
    }

    // Check for inappropriate content (basic check)
    const inappropriatePatterns = [
      /\b(?:instagram|insta|ig|snapchat|snap|whatsapp|telegram|phone|mobile|call me)\b/gi,
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone numbers
      /@[a-zA-Z0-9._-]+/, // Social media handles
      /https?:\/\/[^\s]+/ // URLs
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(this.value)) {
        throw new Error('Application note cannot contain contact information or social media handles');
      }
    }
  }

  getValue(): string {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value.trim().length === 0;
  }

  getWordCount(): number {
    if (this.isEmpty()) return 0;
    return this.value.trim().split(/\s+/).length;
  }

  /**
   * Get a truncated version for previews
   */
  getPreview(maxLength: number = 100): string {
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength).trim() + '...';
  }

  toJSON(): string {
    return this.value;
  }

  equals(other: ApplicationNote): boolean {
    return this.value === other.value;
  }

  static empty(): ApplicationNote {
    return new ApplicationNote('');
  }
}