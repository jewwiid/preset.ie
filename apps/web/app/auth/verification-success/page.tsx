'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-primary mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Email Verified Successfully
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Your email has been verified. You can now access all features of Preset.
        </p>
        
        <p className="text-muted-foreground mb-8">
          Check your inbox for a welcome email with next steps!
        </p>
        
        <Link
          href="/auth/complete-profile"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Complete Your Profile
        </Link>
        
        <p className="mt-4 text-sm text-muted-foreground">
          You will be able to access the platform after completing your profile
        </p>
      </div>
    </div>
  );
}

