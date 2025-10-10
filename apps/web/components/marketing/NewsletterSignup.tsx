/**
 * Newsletter Signup Component
 * Example usage of Plunk integration for email marketing
 */

'use client';

import { useState } from 'react';
import { usePlunk } from '@/lib/hooks/usePlunk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { subscribeContact, loading, error } = usePlunk();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await subscribeContact({
        email,
        data: {
          source: 'website-footer',
          subscribedAt: new Date().toISOString(),
          interests: ['preset-updates', 'tutorials', 'community']
        }
      });
      
      setSubscribed(true);
      setEmail('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      console.error('Newsletter subscription failed:', err);
    }
  };

  if (subscribed) {
    return (
      <div className="rounded-lg bg-primary/10 p-4 text-center">
        <p className="text-primary font-medium">
          🎉 Thanks for subscribing! Check your email for confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !email}>
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
      
      <p className="text-xs text-muted-foreground mt-2">
        Get updates on new presets, tutorials, and community highlights.
      </p>
    </div>
  );
}

