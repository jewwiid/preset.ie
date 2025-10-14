'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function BoostSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'canceled'>('loading');
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');

    if (canceled === 'true') {
      setStatus('canceled');
    } else if (success === 'true' && sessionId) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  }, [searchParams, sessionId]);

  const getStatusContent = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-primary-600" />,
          title: 'Boost Applied Successfully!',
          message: 'Your listing boost has been applied and is now active.',
          buttonText: 'View Your Listings',
          buttonHref: '/gear/my-listings'
        };
      case 'canceled':
        return {
          icon: <XCircle className="h-16 w-16 text-primary-600" />,
          title: 'Payment Canceled',
          message: 'Your payment was canceled. You can try again anytime.',
          buttonText: 'Try Again',
          buttonHref: '/gear/boost'
        };
      case 'error':
        return {
          icon: <XCircle className="h-16 w-16 text-destructive-600" />,
          title: 'Payment Failed',
          message: 'There was an error processing your payment. Please try again.',
          buttonText: 'Try Again',
          buttonHref: '/gear/boost'
        };
      default:
        return {
          icon: <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />,
          title: 'Processing...',
          message: 'Please wait while we process your payment.',
          buttonText: '',
          buttonHref: ''
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          <CardTitle className="text-2xl">{content.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{content.message}</p>
          
          {status === 'success' && sessionId && (
            <p className="text-sm text-muted-foreground">
              Session ID: {sessionId}
            </p>
          )}

          {content.buttonText && (
            <Button asChild className="w-full">
              <Link href={content.buttonHref}>
                {content.buttonText}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BoostSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Please wait while we process your request...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <BoostSuccessContent />
    </Suspense>
  );
}
