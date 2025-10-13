'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Clock } from 'lucide-react';

/**
 * SIMPLIFIED ANALYTICS DASHBOARD
 * - Just shows total views
 * - Last viewed timestamp
 * - Clean, minimal UI
 */

interface SimplifiedAnalyticsData {
  treatment: {
    id: string;
    title: string;
  };
  totalViews: number;
  lastViewedAt: string | null;
}

interface TreatmentAnalyticsDashboardProps {
  treatmentId: string;
  authToken: string;
}

export default function TreatmentAnalyticsDashboard({ 
  treatmentId, 
  authToken 
}: TreatmentAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SimplifiedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [treatmentId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/treatments/${treatmentId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">{error || 'No analytics data available'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Treatment Views</h2>
        <p className="text-muted-foreground">
          {analytics.treatment.title}
        </p>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-4xl font-bold mt-2">{analytics.totalViews}</p>
              </div>
              <Eye className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Viewed</p>
                <p className="text-lg font-semibold mt-2">
                  {analytics.lastViewedAt 
                    ? new Date(analytics.lastViewedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                </p>
              </div>
              <Clock className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info message */}
      {analytics.totalViews === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No views yet. Share your treatment to start getting views!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

