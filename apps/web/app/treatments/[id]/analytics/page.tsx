'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../lib/auth-context';
import TreatmentAnalyticsDashboard from '../../../../components/treatments/TreatmentAnalyticsDashboard';

export default function TreatmentAnalyticsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const { user, session } = useAuth();
  const resolvedParams = use(params);
  const treatmentId = resolvedParams.id;

  if (!user || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to view treatment analytics.
          </p>
          <Button onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/treatments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Treatments
          </Button>
          
          <h1 className="text-4xl font-bold">Treatment Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track views, engagement, and performance of your treatment
          </p>
        </div>

        {/* Analytics Dashboard */}
        <TreatmentAnalyticsDashboard 
          treatmentId={treatmentId}
          authToken={session.access_token}
        />
      </div>
    </div>
  );
}

