'use client';

import { useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
export default function VerificationPendingPage() {
  const [email, setEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    async function getUserEmail() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    }
    getUserEmail();
  }, []);

  const handleResend = async () => {
    setResending(true);
    try {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const metadata = user.user_metadata;
      const verificationToken = `${user.id}:${Math.floor(Date.now() / 1000)}:${Math.random().toString(36).substring(2, 18)}`;

      await fetch('/api/emails/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUserId: user.id,
          email: user.email,
          name: metadata.full_name || `${metadata.first_name} ${metadata.last_name}`,
          verificationToken,
        }),
      });

      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error) {
      console.error('Error resending verification:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        <div className="mb-6">
          <Mail className="w-16 h-16 text-primary mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Verify Your Email
        </h1>
        
        <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6">
          <p className="text-sm text-primary font-medium mb-2">
            You cannot access the platform until you verify your email
          </p>
          <p className="text-sm text-primary">
            This helps us prevent spam and keep the community safe.
          </p>
        </div>
        
        <p className="text-muted-foreground mb-4">
          A verification email has been sent to:
        </p>
        
        <p className="font-medium text-foreground mb-8 bg-muted px-4 py-2 rounded border border-border">
          {email}
        </p>
        
        <p className="text-muted-foreground mb-6">
          Please check your inbox and click the verification link to:
        </p>

        <ul className="text-left text-foreground mb-6 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span>Activate your account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span>Access the full platform</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">✓</span>
            <span>Start collaborating</span>
          </li>
        </ul>

        <div className="bg-primary/5 border border-primary/30 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-foreground font-medium mb-2">
            Did not receive the email?
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure {email} is correct</li>
            <li>• Wait a few minutes for delivery</li>
          </ul>
        </div>

        <button
          onClick={handleResend}
          disabled={resending || resent}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {resending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : resent ? (
            <>Email Sent!</>
          ) : (
            <>Resend Verification Email</>
          )}
        </button>

        <div className="mt-6">
          <button
            onClick={async () => {
              if (supabase) {
                await supabase.auth.signOut();
              }
              window.location.href = '/auth/signin';
            }}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

