import { useEffect, useRef } from 'react';
import { generateSessionId } from '../utils/session';

/**
 * SIMPLIFIED TREATMENT TRACKING
 * - Single API call on mount
 * - No periodic updates
 * - No section tracking
 * - Lightweight and performant
 */

interface TrackingOptions {
  treatmentId: string;
  enabled?: boolean;
}

export function useTreatmentTracking({ 
  treatmentId, 
  enabled = true
}: TrackingOptions) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per session
    if (!enabled || !treatmentId || hasTracked.current) return;

    const sessionId = generateSessionId();
    hasTracked.current = true;

    // Single API call - fire and forget
    fetch(`/api/treatments/${treatmentId}/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    }).catch(error => {
      // Silently fail - don't disrupt user experience
      console.error('Failed to track view:', error);
    });
  }, [treatmentId, enabled]);

  // No return value needed - just tracks
  return null;
}

