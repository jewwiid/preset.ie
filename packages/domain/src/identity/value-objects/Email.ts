/**
 * Value object for validated email addresses
 */
export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!Email.isValid(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    this.value = email.toLowerCase().trim();
  }

  /**
   * Validate email format
   */
  static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create Email from string, returns null if invalid
   */
  static create(email: string): Email | null {
    try {
      return new Email(email);
    } catch {
      return null;
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1]!;
  }

  getLocalPart(): string {
    return this.value.split('@')[0]!;
  }
}