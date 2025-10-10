'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerificationErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';

  const errorMessages: Record<string, { title: string; description: string }> = {
    'missing-token': {
      title: 'Missing Verification Token',
      description: 'The verification link is incomplete. Please check your email and click the full link.',
    },
    'invalid-token': {
      title: 'Invalid Verification Token',
      description: 'The verification link is invalid or has been tampered with.',
    },
    'expired': {
      title: 'Verification Link Expired',
      description: 'This verification link has expired. Please request a new one.',
    },
    'user-not-found': {
      title: 'User Not Found',
      description: 'We could not find your account. Please try signing up again.',
    },
    'server-error': {
      title: 'Server Error',
      description: 'An error occurred while verifying your email. Please try again later.',
    },
    'unknown': {
      title: 'Verification Failed',
      description: 'An unknown error occurred. Please try again or contact support.',
    },
  };

  const error = errorMessages[reason] || errorMessages.unknown;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {error.title}
        </h1>
        
        <p className="text-muted-foreground mb-8">
          {error.description}
        </p>
        
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign Up Again
          </Link>
          
          <Link
            href="/auth/signin"
            className="block text-primary px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificationErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerificationErrorContent />
    </Suspense>
  );
}

