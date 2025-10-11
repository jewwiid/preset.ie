/**
 * API Failure Alert System
 * Sends immediate email alerts to admins when WaveSpeed API failures occur
 */

export interface APIFailureAlert {
  type: 'credits_exhausted' | 'api_error' | 'timeout' | 'rate_limit' | 'provider_down' | 'unknown';
  provider: string; // 'nanobanana', 'seedream', 'seedance', etc.
  errorMessage: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  userEmail?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Send an immediate API failure alert to admins
 */
export async function sendAPIFailureAlert(alert: APIFailureAlert): Promise<void> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${siteUrl}/api/admin/alert-api-failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send API failure alert:', error);
    } else {
      console.log('API failure alert sent successfully:', alert.type, alert.provider);
    }
  } catch (error) {
    console.error('Exception sending API failure alert:', error);
  }
}

/**
 * Helper function to create and send credit exhaustion alert
 */
export async function alertCreditsExhausted(
  provider: string,
  errorMessage: string,
  userId?: string,
  userEmail?: string,
  requestId?: string
): Promise<void> {
  await sendAPIFailureAlert({
    type: 'credits_exhausted',
    provider,
    errorMessage,
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    userEmail,
    severity: 'critical'
  });
}

/**
 * Helper function to create and send API error alert
 */
export async function alertAPIError(
  provider: string,
  errorMessage: string,
  userId?: string,
  userEmail?: string,
  requestId?: string,
  severity: 'critical' | 'high' | 'medium' | 'low' = 'high'
): Promise<void> {
  await sendAPIFailureAlert({
    type: 'api_error',
    provider,
    errorMessage,
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    userEmail,
    severity
  });
}

/**
 * Helper function to create and send timeout alert
 */
export async function alertTimeout(
  provider: string,
  errorMessage: string,
  userId?: string,
  userEmail?: string,
  requestId?: string
): Promise<void> {
  await sendAPIFailureAlert({
    type: 'timeout',
    provider,
    errorMessage,
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    userEmail,
    severity: 'high'
  });
}

/**
 * Helper function to create and send rate limit alert
 */
export async function alertRateLimit(
  provider: string,
  errorMessage: string,
  userId?: string,
  userEmail?: string,
  requestId?: string
): Promise<void> {
  await sendAPIFailureAlert({
    type: 'rate_limit',
    provider,
    errorMessage,
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    userEmail,
    severity: 'high'
  });
}

/**
 * Helper function to create and send provider down alert
 */
export async function alertProviderDown(
  provider: string,
  errorMessage: string,
  userId?: string,
  userEmail?: string,
  requestId?: string
): Promise<void> {
  await sendAPIFailureAlert({
    type: 'provider_down',
    provider,
    errorMessage,
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    userEmail,
    severity: 'critical'
  });
}

/**
 * Helper function to analyze error messages and determine alert type
 */
export function analyzeAPIError(errorMessage: string): {
  type: APIFailureAlert['type'];
  severity: APIFailureAlert['severity'];
} {
  const message = errorMessage.toLowerCase();
  
  // Credit-related errors
  if (message.includes('credit') || message.includes('insufficient') || message.includes('balance')) {
    return { type: 'credits_exhausted', severity: 'critical' };
  }
  
  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
    return { type: 'rate_limit', severity: 'high' };
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || message.includes('408')) {
    return { type: 'timeout', severity: 'high' };
  }
  
  // Server errors
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return { type: 'provider_down', severity: 'critical' };
  }
  
  // Authentication errors
  if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('forbidden')) {
    return { type: 'api_error', severity: 'high' };
  }
  
  // Default to generic API error
  return { type: 'api_error', severity: 'medium' };
}
