/**
 * Generate a unique session ID for tracking anonymous users
 * Uses browser fingerprinting (privacy-conscious) + random component
 */
export function generateSessionId(): string {
  // Check if we already have a session ID in sessionStorage
  const existingId = typeof window !== 'undefined' 
    ? sessionStorage.getItem('preset_session_id') 
    : null;
  
  if (existingId) {
    return existingId;
  }

  // Generate new session ID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  // Add some browser fingerprinting (privacy-conscious - no PII)
  const fingerprint = typeof window !== 'undefined' 
    ? btoa([
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset()
      ].join('|')).substring(0, 16)
    : '';

  const sessionId = `${timestamp}-${random}-${fingerprint}`;
  
  // Store in sessionStorage (cleared when browser closes)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('preset_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Clear session ID (for testing or privacy preferences)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('preset_session_id');
  }
}

