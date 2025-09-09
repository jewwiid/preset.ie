/**
 * Compensation types for gigs
 */
export enum CompensationType {
  TFP = 'tfp',        // Time for Print/Portfolio
  PAID = 'paid',      // Paid opportunity
  EXPENSES = 'expenses' // Expenses covered
}

/**
 * Value object for compensation details
 */
export class Compensation {
  constructor(
    private readonly type: CompensationType,
    private readonly amount?: number,
    private readonly currency: string = 'EUR',
    private readonly details?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(CompensationType).includes(this.type)) {
      throw new Error('Invalid compensation type');
    }

    if (this.type === CompensationType.PAID && !this.amount) {
      throw new Error('Paid compensation requires an amount');
    }

    if (this.amount !== undefined && this.amount < 0) {
      throw new Error('Compensation amount cannot be negative');
    }

    if (this.amount !== undefined && this.amount > 100000) {
      throw new Error('Compensation amount seems unrealistic');
    }

    if (this.details && this.details.length > 500) {
      throw new Error('Compensation details cannot exceed 500 characters');
    }

    // Validate currency code (basic ISO 4217 check)
    const validCurrencies = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'];
    if (!validCurrencies.includes(this.currency)) {
      throw new Error('Invalid currency code');
    }
  }

  getType(): CompensationType {
    return this.type;
  }

  getAmount(): number | undefined {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  getDetails(): string | undefined {
    return this.details;
  }

  /**
   * Check if this is a paid opportunity
   */
  isPaid(): boolean {
    return this.type === CompensationType.PAID;
  }

  /**
   * Check if expenses are covered
   */
  hasExpenses(): boolean {
    return this.type === CompensationType.EXPENSES || this.type === CompensationType.PAID;
  }

  /**
   * Get a formatted display string
   */
  format(): string {
    switch (this.type) {
      case CompensationType.TFP:
        return 'TFP (Time for Portfolio)';
      case CompensationType.PAID:
        if (this.amount) {
          return `€${this.amount.toFixed(2)} ${this.currency}`;
        }
        return 'Paid';
      case CompensationType.EXPENSES:
        return 'Expenses Covered';
      default:
        return 'TBD';
    }
  }

  /**
   * Get a short label for UI display
   */
  getLabel(): string {
    switch (this.type) {
      case CompensationType.TFP:
        return 'TFP';
      case CompensationType.PAID:
        return 'Paid';
      case CompensationType.EXPENSES:
        return 'Expenses';
      default:
        return '';
    }
  }

  toJSON() {
    return {
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      details: this.details
    };
  }

  equals(other: Compensation): boolean {
    return this.type === other.type &&
           this.amount === other.amount &&
           this.currency === other.currency &&
           this.details === other.details;
  }
}