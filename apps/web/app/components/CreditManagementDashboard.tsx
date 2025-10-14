'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Users, RefreshCw } from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface CreditStats {
  // New pay-per-generation metrics
  activeUsersToday: number;
  generationsToday: number;
  costTodayUsd: number;
  generationsThisMonth: number;
  costThisMonthUsd: number;
  successRate7DaysPct: number;
  refundsLast7Days: number;
  usersWithCredits: number;
  totalCreditsInCirculation: number;
  providerUsage: Array<{
    name: string;
    generations: number;
    costUsd: number;
    avgCostPerGeneration: number;
  }>;
  
  // Legacy fields for backward compatibility
  platformCreditsRemaining: number;
  dailyUsage: number;
  activeUsers: number;
  monthlyCost: string;
  providers: Array<{
    name: string;
    isHealthy: boolean;
    costPerRequest: number;
    successRate: number;
    creditsRemaining: number;
  }>;
}

interface Alert {
  type: string;
  level: string;
  message: string;
  created_at: string;
}

const CreditManagementDashboard = () => {
  const [creditStats, setCreditStats] = useState<CreditStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/credit-stats'),
        fetch('/api/admin/alerts')
      ]);

      setCreditStats(await statsRes.json());
      setAlerts(await alertsRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };


  if (!creditStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-muted-foreground-900">Credit Management</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary-600 text-primary-foreground rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-destructive/80">
                <span className="font-medium">{alert.type}:</span> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background rounded-lg border border-border-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-muted-foreground-900">Generations Today</h3>
          </div>
          <p className="text-3xl font-bold text-muted-foreground-900">{creditStats.generationsToday}</p>
          <p className="text-sm text-muted-foreground-600">AI generations completed</p>
        </div>

        <div className="bg-background rounded-lg border border-border-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-destructive-600" />
            <h3 className="font-semibold text-muted-foreground-900">Cost Today</h3>
          </div>
          <p className="text-3xl font-bold text-muted-foreground-900">${creditStats.costTodayUsd}</p>
          <p className="text-sm text-muted-foreground-600">WaveSpeed API costs</p>
        </div>

        <div className="bg-background rounded-lg border border-border-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-muted-foreground-900">Users with Credits</h3>
          </div>
          <p className="text-3xl font-bold text-muted-foreground-900">{creditStats.usersWithCredits}</p>
          <p className="text-sm text-muted-foreground-600">Total credits: {creditStats.totalCreditsInCirculation}</p>
        </div>

        <div className="bg-background rounded-lg border border-border-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <h3 className="font-semibold text-muted-foreground-900">Success Rate</h3>
          </div>
          <p className="text-3xl font-bold text-muted-foreground-900">{creditStats.successRate7DaysPct}%</p>
          <p className="text-sm text-muted-foreground-600">Last 7 days</p>
        </div>
      </div>

      {/* Provider Usage */}
      <div className="bg-background rounded-lg border border-border-200 p-6">
        <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Provider Usage (Last 30 Days)</h3>
        {creditStats.providerUsage.length > 0 ? (
          <div className="space-y-4">
            {creditStats.providerUsage.map((provider, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-muted-foreground-900">{provider.name}</p>
                    <p className="text-sm text-muted-foreground-600">
                      ${provider.avgCostPerGeneration} avg cost per generation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground-600">
                  <span>{provider.generations} generations</span>
                  <span>${provider.costUsd} total cost</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground-600">
            <p>No provider usage data yet</p>
            <p className="text-sm">Usage will appear here once users start generating content</p>
          </div>
        )}
      </div>

      {/* Refund Summary */}
      {creditStats.refundsLast7Days > 0 && (
        <div className="bg-background rounded-lg border border-border-200 p-6">
          <h3 className="text-lg font-semibold text-muted-foreground-900 mb-4">Recent Refunds</h3>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-muted-foreground-900">{creditStats.refundsLast7Days} credits refunded</p>
              <p className="text-sm text-muted-foreground-600">Last 7 days - failed generations automatically refunded</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagementDashboard;
