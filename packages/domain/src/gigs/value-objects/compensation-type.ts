export enum CompensationType {
  TFP = 'TFP',
  PAID = 'PAID',
  EXPENSES = 'EXPENSES'
}

export class Compensation {
  constructor(
    public readonly type: CompensationType,
    public readonly details?: string
  ) {}

  static tfp(): Compensation {
    return new Compensation(CompensationType.TFP);
  }

  static paid(details?: string): Compensation {
    return new Compensation(CompensationType.PAID, details);
  }

  static expenses(details?: string): Compensation {
    return new Compensation(CompensationType.EXPENSES, details);
  }
}