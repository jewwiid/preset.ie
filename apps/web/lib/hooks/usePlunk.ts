/**
 * React hook for Plunk email marketing integration
 * Provides client-side methods to interact with Plunk API
 */

import { useState } from 'react';

interface TrackEventOptions {
  event: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, any>;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  name?: string;
  from?: string;
  replyTo?: string;
}

interface ContactOptions {
  email: string;
  subscribed?: boolean;
  data?: Record<string, any>;
}

interface SubscribeOptions {
  email: string;
  data?: Record<string, any>;
}

export function usePlunk() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackEvent = async (options: TrackEventOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plunk/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track event');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (options: SendEmailOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plunk/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upsertContact = async (options: ContactOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plunk/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to manage contact');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const subscribeContact = async (options: SubscribeOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plunk/contacts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to subscribe contact');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeContact = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/plunk/contacts/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unsubscribe contact');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    trackEvent,
    sendEmail,
    upsertContact,
    subscribeContact,
    unsubscribeContact,
  };
}

