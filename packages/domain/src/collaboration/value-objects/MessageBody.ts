/**
 * Value object for message body with validation
 */
export class MessageBody {
  private static readonly MAX_LENGTH = 2000;
  private static readonly MIN_LENGTH = 1;

  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    const trimmed = this.value.trim();
    
    if (trimmed.length < MessageBody.MIN_LENGTH) {
      throw new Error('Message cannot be empty');
    }

    if (trimmed.length > MessageBody.MAX_LENGTH) {
      throw new Error(`Message cannot exceed ${MessageBody.MAX_LENGTH} characters`);
    }

    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{20,}/, // Same character repeated 20+ times
      /(.)(\1\s*){15,}/, // Same character with spaces repeated
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(this.value)) {
        throw new Error('Message appears to be spam');
      }
    }
  }

  getValue(): string {
    return this.value;
  }

  getTrimmed(): string {
    return this.value.trim();
  }

  getLength(): number {
    return this.value.length;
  }

  /**
   * Get a preview of the message for notifications
   */
  getPreview(maxLength: number = 100): string {
    const trimmed = this.getTrimmed();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return trimmed.substring(0, maxLength).trim() + '...';
  }

  /**
   * Check if message contains attachments reference
   */
  hasAttachmentReference(): boolean {
    return this.value.includes('[attachment]') || this.value.includes('[image]');
  }

  toJSON(): string {
    return this.value;
  }

  equals(other: MessageBody): boolean {
    return this.value === other.value;
  }
}