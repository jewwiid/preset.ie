/**
 * Tags for reviews
 */
export enum ReviewTag {
  // Positive tags
  PROFESSIONAL = 'professional',
  PUNCTUAL = 'punctual',
  CREATIVE = 'creative',
  COMMUNICATIVE = 'communicative',
  PREPARED = 'prepared',
  FRIENDLY = 'friendly',
  RELIABLE = 'reliable',
  TALENTED = 'talented',
  COLLABORATIVE = 'collaborative',
  EXPERIENCED = 'experienced',
  
  // Neutral/Constructive tags
  NEEDS_IMPROVEMENT = 'needs_improvement',
  LEARNING = 'learning',
  BEGINNER = 'beginner'
}

/**
 * Rating value object with validation
 */
export class Rating {
  private static readonly MIN = 1;
  private static readonly MAX = 5;

  constructor(private readonly value: number) {
    this.validate();
  }

  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new Error('Rating must be an integer');
    }

    if (this.value < Rating.MIN || this.value > Rating.MAX) {
      throw new Error(`Rating must be between ${Rating.MIN} and ${Rating.MAX}`);
    }
  }

  getValue(): number {
    return this.value;
  }

  getStars(): string {
    return '⭐'.repeat(this.value);
  }

  isPositive(): boolean {
    return this.value >= 4;
  }

  isNeutral(): boolean {
    return this.value === 3;
  }

  isNegative(): boolean {
    return this.value <= 2;
  }

  equals(other: Rating): boolean {
    return this.value === other.value;
  }

  toJSON(): number {
    return this.value;
  }
}

/**
 * Get suggested tags based on rating
 */
export function getSuggestedTags(rating: Rating): ReviewTag[] {
  if (rating.isPositive()) {
    return [
      ReviewTag.PROFESSIONAL,
      ReviewTag.PUNCTUAL,
      ReviewTag.CREATIVE,
      ReviewTag.COMMUNICATIVE,
      ReviewTag.FRIENDLY,
      ReviewTag.RELIABLE,
      ReviewTag.TALENTED,
      ReviewTag.COLLABORATIVE
    ];
  } else if (rating.isNeutral()) {
    return [
      ReviewTag.PROFESSIONAL,
      ReviewTag.COMMUNICATIVE,
      ReviewTag.LEARNING,
      ReviewTag.BEGINNER
    ];
  } else {
    return [
      ReviewTag.NEEDS_IMPROVEMENT,
      ReviewTag.LEARNING,
      ReviewTag.BEGINNER
    ];
  }
}