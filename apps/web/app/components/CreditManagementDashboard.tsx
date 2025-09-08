'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Users, RefreshCw } from 'lucide-react';

interface CreditStats {
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
  const [isRefilling, setIsRefilling] = useState(false);
  const [refillProvider, setRefillProvider] = useState('');
  const [refillAmount, setRefillAmount] = useState(500);

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

  const handleManualRefill = async (provider: string, amount: number) => {
    setIsRefilling(true);
    try {
      const response = await fetch('/api/admin/refill-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, amount })
      });

      if (response.ok) {
        await fetchDashboardData();
        alert(`Successfully refilled ${amount} credits for ${provider}`);
      } else {
        const error = await response.json();
        alert(`Refill failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Refill failed:', error);
      alert('Refill failed. Please try again.');
    } finally {
      setIsRefilling(false);
    }
  };

  if (!creditStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-800">
                <span className="font-medium">{alert.type}:</span> {alert.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Platform Credits</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{creditStats.platformCreditsRemaining}</p>
          <p className="text-sm text-gray-600">Available credits</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Daily Usage</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{creditStats.dailyUsage}</p>
          <p className="text-sm text-gray-600">Credits consumed today</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Active Users</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{creditStats.activeUsers}</p>
          <p className="text-sm text-gray-600">Users with remaining credits</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Monthly Cost</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">${creditStats.monthlyCost}</p>
          <p className="text-sm text-gray-600">AI provider costs</p>
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Status</h3>
        <div className="space-y-4">
          {creditStats.providers?.map((provider) => (
            <div key={provider.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${provider.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <p className="text-sm text-gray-600">
                    ${provider.costPerRequest} per request • {provider.successRate}% success rate
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {provider.creditsRemaining} credits
                </span>
                <button
                  onClick={() => handleManualRefill(provider.name, 500)}
                  disabled={isRefilling}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Refill
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Refill Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Credit Refill</h3>
        <div className="flex items-center gap-4">
          <select
            value={refillProvider}
            onChange={(e) => setRefillProvider(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Provider</option>
            {creditStats.providers?.map((provider) => (
              <option key={provider.name} value={provider.name}>
                {provider.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={refillAmount}
            onChange={(e) => setRefillAmount(Number(e.target.value))}
            placeholder="Amount"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleManualRefill(refillProvider, refillAmount)}
            disabled={!refillProvider || isRefilling}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isRefilling ? 'Refilling...' : 'Refill Credits'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditManagementDashboard;
