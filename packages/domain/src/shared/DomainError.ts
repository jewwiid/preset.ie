/**
 * Base class for domain errors
 * Domain errors represent business rule violations or invalid operations
 */
export abstract class DomainError extends Error {
  public readonly name: string;
  
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Generic domain error for business rule violations
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'BUSINESS_RULE_VIOLATION', details);
  }
}

/**
 * Error for invalid entity state
 */
export class InvalidEntityStateError extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'INVALID_ENTITY_STATE', details);
  }
}

/**
 * Error for unauthorized operations
 */
export class UnauthorizedOperationError extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'UNAUTHORIZED_OPERATION', details);
  }
}
