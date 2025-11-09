/**
 * Error Handling Utilities for Integration Services
 * 
 * This module provides custom error classes and utilities for handling
 * errors across all integration services (Resend, Slack, Confluence).
 * 
 * @module lib/integrations/errors
 */

/**
 * Base integration error class
 * All integration-specific errors extend from this class
 */
export class IntegrationError extends Error {
  /** Error code for programmatic handling */
  public readonly code: string;
  /** Original error that caused this error (if any) */
  public readonly cause?: Error;
  /** HTTP status code (if applicable) */
  public readonly statusCode?: number;
  /** Additional context or metadata */
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      cause?: Error;
      statusCode?: number;
      context?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = options?.code || 'INTEGRATION_ERROR';
    this.cause = options?.cause;
    this.statusCode = options?.statusCode;
    this.context = options?.context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Configuration error - thrown when required configuration is missing or invalid
 */
export class ConfigurationError extends IntegrationError {
  constructor(
    message: string,
    options?: {
      missingKeys?: string[];
      context?: Record<string, unknown>;
    }
  ) {
    super(message, {
      code: 'CONFIGURATION_ERROR',
      context: {
        missingKeys: options?.missingKeys,
        ...options?.context,
      },
    });
    this.name = 'ConfigurationError';
  }
}

/**
 * Email service error - thrown by Resend integration
 */
export class EmailServiceError extends IntegrationError {
  constructor(
    message: string,
    options?: {
      code?: string;
      cause?: Error;
      statusCode?: number;
      recipient?: string | string[];
    }
  ) {
    super(message, {
      code: options?.code || 'EMAIL_SERVICE_ERROR',
      cause: options?.cause,
      statusCode: options?.statusCode,
      context: {
        recipient: options?.recipient,
      },
    });
    this.name = 'EmailServiceError';
  }
}

/**
 * Slack service error - thrown by Slack integration
 */
export class SlackServiceError extends IntegrationError {
  constructor(
    message: string,
    options?: {
      code?: string;
      cause?: Error;
      statusCode?: number;
      channel?: string;
    }
  ) {
    super(message, {
      code: options?.code || 'SLACK_SERVICE_ERROR',
      cause: options?.cause,
      statusCode: options?.statusCode,
      context: {
        channel: options?.channel,
      },
    });
    this.name = 'SlackServiceError';
  }
}

/**
 * Confluence service error - thrown by Confluence integration
 */
export class ConfluenceServiceError extends IntegrationError {
  constructor(
    message: string,
    options?: {
      code?: string;
      cause?: Error;
      statusCode?: number;
      spaceKey?: string;
      pageId?: string;
    }
  ) {
    super(message, {
      code: options?.code || 'CONFLUENCE_SERVICE_ERROR',
      cause: options?.cause,
      statusCode: options?.statusCode,
      context: {
        spaceKey: options?.spaceKey,
        pageId: options?.pageId,
      },
    });
    this.name = 'ConfluenceServiceError';
  }
}

/**
 * Validation error - thrown when input validation fails
 */
export class ValidationError extends IntegrationError {
  constructor(
    message: string,
    options?: {
      field?: string;
      value?: unknown;
      context?: Record<string, unknown>;
    }
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      context: {
        field: options?.field,
        value: options?.value,
        ...options?.context,
      },
    });
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error - thrown when API rate limits are exceeded
 */
export class RateLimitError extends IntegrationError {
  /** Time when rate limit resets (Unix timestamp) */
  public readonly resetAt?: number;
  /** Retry after seconds */
  public readonly retryAfter?: number;

  constructor(
    message: string,
    options?: {
      resetAt?: number;
      retryAfter?: number;
      service?: string;
    }
  ) {
    super(message, {
      code: 'RATE_LIMIT_ERROR',
      statusCode: 429,
      context: {
        service: options?.service,
      },
    });
    this.name = 'RateLimitError';
    this.resetAt = options?.resetAt;
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * Network error - thrown when network requests fail
 */
export class NetworkError extends IntegrationError {
  constructor(
    message: string,
    options?: {
      cause?: Error;
      url?: string;
      method?: string;
    }
  ) {
    super(message, {
      code: 'NETWORK_ERROR',
      cause: options?.cause,
      context: {
        url: options?.url,
        method: options?.method,
      },
    });
    this.name = 'NetworkError';
  }
}

/**
 * Type guard to check if an error is an IntegrationError
 */
export function isIntegrationError(error: unknown): error is IntegrationError {
  return error instanceof IntegrationError;
}

/**
 * Safely extract error message from any error type
 * @param error - The error to extract message from
 * @returns A safe error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Safely extract error code from any error type
 * @param error - The error to extract code from
 * @returns Error code or undefined
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isIntegrationError(error)) {
    return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

/**
 * Handle and transform unknown errors into IntegrationErrors
 * @param error - The error to handle
 * @param service - The service where the error occurred
 * @returns A properly typed IntegrationError
 */
export function handleServiceError(
  error: unknown,
  service: 'resend' | 'slack' | 'confluence'
): IntegrationError {
  // If already an IntegrationError, return as-is
  if (isIntegrationError(error)) {
    return error;
  }

  const message = getErrorMessage(error);
  const cause = error instanceof Error ? error : undefined;

  // Map to service-specific error
  switch (service) {
    case 'resend':
      return new EmailServiceError(message, { cause });
    case 'slack':
      return new SlackServiceError(message, { cause });
    case 'confluence':
      return new ConfluenceServiceError(message, { cause });
  }
}

/**
 * Create a safe error response object for API responses
 * @param error - The error to convert
 * @returns A JSON-safe error object
 */
export function createErrorResponse(error: unknown) {
  if (isIntegrationError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.context,
      },
    };
  }

  return {
    success: false,
    error: {
      message: getErrorMessage(error),
      code: getErrorCode(error) || 'UNKNOWN_ERROR',
      details: {},
    },
  };
}

/**
 * Retry helper with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        isIntegrationError(error) &&
        (error instanceof ValidationError || error instanceof ConfigurationError)
      ) {
        throw error;
      }

      if (attempt === maxAttempts) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with max delay cap
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Log error with structured information (for production monitoring)
 * @param error - The error to log
 * @param context - Additional context
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: getErrorMessage(error),
    code: getErrorCode(error),
    context,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // In production, send to your logging service (e.g., Sentry, LogRocket)
  // For now, use console.error
  console.error('[Integration Error]', JSON.stringify(errorInfo, null, 2));
}
