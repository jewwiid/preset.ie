/**
 * Value object for unique username/handle
 */
export class Handle {
  private readonly value: string;

  constructor(handle: string) {
    if (!Handle.isValid(handle)) {
      throw new Error(`Invalid handle: ${handle}. Must be 3-30 characters, alphanumeric with underscores.`);
    }
    this.value = handle.toLowerCase();
  }

  /**
   * Validate handle format
   * - 3-30 characters
   * - Alphanumeric and underscores only
   * - Must start with a letter
   */
  static isValid(handle: string): boolean {
    const handleRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;
    return handleRegex.test(handle);
  }

  /**
   * Create Handle from string, returns null if invalid
   */
  static create(handle: string): Handle | null {
    try {
      return new Handle(handle);
    } catch {
      return null;
    }
  }

  /**
   * Generate a handle from an email or name
   */
  static generateFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    // Remove non-alphanumeric characters and ensure it starts with a letter
    let handle = localPart?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';
    
    // Ensure it starts with a letter
    if (!/^[a-zA-Z]/.test(handle)) {
      handle = 'user' + handle;
    }
    
    // Ensure minimum length
    if (handle.length < 3) {
      handle = handle + Math.random().toString(36).substr(2, 5);
    }
    
    // Ensure maximum length
    if (handle.length > 30) {
      handle = handle.substr(0, 30);
    }
    
    return handle;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Handle): boolean {
    return this.value === other.value;
  }

  getDisplayHandle(): string {
    return `@${this.value}`;
  }
}