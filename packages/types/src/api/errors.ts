export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Business Logic
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  APPLICATION_CLOSED = 'APPLICATION_CLOSED',
  GIG_FULL = 'GIG_FULL',
  ALREADY_APPLIED = 'ALREADY_APPLIED',
  CANNOT_APPLY_OWN_GIG = 'CANNOT_APPLY_OWN_GIG',
  REVIEW_ALREADY_EXISTS = 'REVIEW_ALREADY_EXISTS',
  CANNOT_REVIEW_SELF = 'CANNOT_REVIEW_SELF',
  
  // Media
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  MEDIA_PROCESSING_FAILED = 'MEDIA_PROCESSING_FAILED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Safety & Moderation
  CONTENT_VIOLATION = 'CONTENT_VIOLATION',
  USER_BLOCKED = 'USER_BLOCKED',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SPAM_DETECTED = 'SPAM_DETECTED',
}

export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiException';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationException extends ApiException {
  constructor(
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, { fields });
    this.name = 'ValidationException';
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends ApiException {
  constructor(message: string = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends ApiException {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends ApiException {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, 409);
    this.name = 'ConflictException';
  }
}

export class RateLimitException extends ApiException {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, { retryAfter });
    this.name = 'RateLimitException';
  }
}

export class SubscriptionRequiredException extends ApiException {
  constructor(
    requiredTier: string,
    feature: string
  ) {
    super(
      ErrorCode.SUBSCRIPTION_REQUIRED,
      `${requiredTier} subscription required for ${feature}`,
      402,
      { requiredTier, feature }
    );
    this.name = 'SubscriptionRequiredException';
  }
}

export class LimitExceededException extends ApiException {
  constructor(
    limitType: string,
    limit: number,
    current: number
  ) {
    super(
      ErrorCode.LIMIT_EXCEEDED,
      `${limitType} limit exceeded (${current}/${limit})`,
      403,
      { limitType, limit, current }
    );
    this.name = 'LimitExceededException';
  }
}