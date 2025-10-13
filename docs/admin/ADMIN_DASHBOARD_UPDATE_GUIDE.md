# Admin Dashboard Update Guide

## 🎯 Goal
Update the Credits tab in admin page from "Platform Credit Pools" to "Usage & Cost Monitoring"

---

## 📊 What to Show (New Design)

### Section 1: Overview Cards (Top Row)
```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│  Active Users  │  Generations   │   Success Rate │  Cost Today    │
│      Today     │     Today      │    (7 days)    │                │
├────────────────┼────────────────┼────────────────┼────────────────┤
│      12        │      45        │     94.2%      │   $4.50        │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### Section 2: This Month Summary
```
┌─────────────────────────────────────────────────────────────────┐
│ This Month (October 2025)                                       │
├─────────────────────────────────────────────────────────────────┤
│ • Total Generations: 342                                        │
│ • WaveSpeed Cost: $34.20                                        │
│ • Refunds Issued: 12                                            │
│ • Average Cost per Generation: $0.10                            │
└─────────────────────────────────────────────────────────────────┘
```

### Section 3: Provider Breakdown
```
┌─────────────────────────────────────────────────────────────────┐
│ AI Provider Usage (Last 30 Days)                                │
├──────────────┬──────────┬───────────┬───────────┬──────────────┤
│ Provider     │ Calls    │ Success % │ Failed    │ Total Cost   │
├──────────────┼──────────┼───────────┼───────────┼──────────────┤
│ NanoBanana   │ 280      │ 95.7%     │ 12        │ $28.00       │
│ Seedream     │ 62       │ 91.9%     │ 5         │ $6.20        │
└──────────────┴──────────┴───────────┴───────────┴──────────────┘
```

### Section 4: User Credit Distribution
```
┌─────────────────────────────────────────────────────────────────┐
│ User Credits by Tier                                            │
├──────────────┬──────────┬────────────────┬─────────────────────┤
│ Tier         │ Users    │ Total Credits  │ Consumed This Month │
├──────────────┼──────────┼────────────────┼─────────────────────┤
│ Pro          │ 2        │ 350            │ 50                  │
│ Plus         │ 15       │ 680            │ 120                 │
│ Free         │ 45       │ 180            │ 35                  │
└──────────────┴──────────┴────────────────┴─────────────────────┘
```

### Section 5: Recent Failures (Debug)
```
┌─────────────────────────────────────────────────────────────────┐
│ Recent Failures (Last 7 Days)                                   │
├────────────┬──────────────┬─────────────────────────────────────┤
│ Provider   │ Time         │ Error                               │
├────────────┼──────────────┼─────────────────────────────────────┤
│ NanoBanana │ 2 hours ago  │ Network timeout                     │
│ Seedream   │ 5 hours ago  │ Invalid image format                │
└────────────┴──────────────┴─────────────────────────────────────┘
```

---

## 🗑️ What to Remove

### OLD (Remove These):
- ❌ Platform Credits Remaining
- ❌ fal.ai Balance
- ❌ Total Purchased/Consumed from pools
- ❌ Auto-refill threshold
- ❌ Manual Refill Section
- ❌ Credit pool status cards

---

## 💻 Component Update Example

### File: `apps/web/app/components/admin/CreditManagementDashboard.tsx`

**Replace entire component with:**

```typescript
'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  todayStats: {
    activeUsers: number;
    generations: number;
    successful: number;
    failed: number;
    cost: number;
  };
  monthStats: {
    generations: number;
    successful: number;
    failed: number;
    cost: number;
  };
  successRate: string;
  refundsLast7Days: number;
  userStats: {
    usersWithCredits: number;
    totalCreditsInCirculation: number;
    creditsByTier: Record<string, {
      count: number;
      totalCredits: number;
      totalConsumed: number;
    }>;
  };
  providers: Array<{
    name: string;
    totalCalls: number;
    successful: number;
    failed: number;
    successRate: string;
    totalCost: string;
  }>;
  recentFailures: Array<{
    id: string;
    provider: string;
    error: string;
    time: string;
  }>;
  systemHealth: {
    status: string;
    tasksLast24h: number;
    failureLast24h: number;
  };
}

const CreditManagementDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/credit-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Banner */}
      <div className={`p-4 rounded-lg ${
        stats.systemHealth.status.includes('⚠️') 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-green-50 border-green-200'
      } border`}>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {stats.systemHealth.status}
          </span>
          <span className="text-sm text-muted-foreground">
            {stats.systemHealth.tasksLast24h} tasks in last 24h
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Users Today"
          value={stats.todayStats.activeUsers}
          subtitle={`${stats.userStats.usersWithCredits} with credits`}
        />
        <StatCard
          title="Generations Today"
          value={stats.todayStats.generations}
          subtitle={`${stats.todayStats.failed} failed`}
        />
        <StatCard
          title="Success Rate (7d)"
          value={`${stats.successRate}%`}
          subtitle={`${stats.refundsLast7Days} refunds issued`}
        />
        <StatCard
          title="Cost Today"
          value={`$${stats.todayStats.cost.toFixed(2)}`}
          subtitle="WaveSpeed charges"
        />
      </div>

      {/* This Month Summary */}
      <div className="bg-background rounded-lg border border-border-200 p-6">
        <h3 className="text-lg font-semibold mb-4">This Month</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Generations</p>
            <p className="text-2xl font-bold">{stats.monthStats.generations}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">WaveSpeed Cost</p>
            <p className="text-2xl font-bold">${stats.monthStats.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">
              {stats.monthStats.generations > 0 
                ? ((stats.monthStats.successful / stats.monthStats.generations) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Cost/Gen</p>
            <p className="text-2xl font-bold">
              ${stats.monthStats.generations > 0 
                ? (stats.monthStats.cost / stats.monthStats.generations).toFixed(2)
                : '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="bg-background rounded-lg border border-border-200 p-6">
        <h3 className="text-lg font-semibold mb-4">AI Provider Usage (Last 30 Days)</h3>
        {stats.providers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Provider</th>
                  <th className="text-right py-2">Calls</th>
                  <th className="text-right py-2">Success Rate</th>
                  <th className="text-right py-2">Failed</th>
                  <th className="text-right py-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.providers.map((provider) => (
                  <tr key={provider.name} className="border-b last:border-0">
                    <td className="py-2 font-medium">{provider.name}</td>
                    <td className="text-right">{provider.totalCalls}</td>
                    <td className="text-right">{provider.successRate}%</td>
                    <td className="text-right text-red-600">{provider.failed}</td>
                    <td className="text-right font-semibold">${provider.totalCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No usage data yet
          </p>
        )}
      </div>

      {/* User Credit Distribution */}
      <div className="bg-background rounded-lg border border-border-200 p-6">
        <h3 className="text-lg font-semibold mb-4">User Credits by Tier</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tier</th>
                <th className="text-right py-2">Users</th>
                <th className="text-right py-2">Total Credits</th>
                <th className="text-right py-2">Consumed This Month</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.userStats.creditsByTier).map(([tier, data]) => (
                <tr key={tier} className="border-b last:border-0">
                  <td className="py-2 font-medium capitalize">{tier}</td>
                  <td className="text-right">{data.count}</td>
                  <td className="text-right">{data.totalCredits}</td>
                  <td className="text-right">{data.totalConsumed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Failures */}
      {stats.recentFailures.length > 0 && (
        <div className="bg-background rounded-lg border border-border-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Failures (Debug)</h3>
          <div className="space-y-2">
            {stats.recentFailures.map((failure) => (
              <div key={failure.id} className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-200">
                <span className="font-medium text-sm">{failure.provider}</span>
                <span className="text-sm text-muted-foreground flex-1">{failure.error}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{failure.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
  <div className="bg-background rounded-lg border border-border-200 p-6">
    <p className="text-sm text-muted-foreground mb-1">{title}</p>
    <p className="text-3xl font-bold mb-1">{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
  </div>
);

export default CreditManagementDashboard;
```

---

## 🎨 Design Mockup (Text Version)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Credits & Usage Monitoring                                              │
└─────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ ✅ Healthy                          45 tasks in last 24h              │
  └───────────────────────────────────────────────────────────────────────┘

  ┌──────────────┬──────────────┬──────────────┬──────────────┐
  │ Active Users │ Generations  │ Success Rate │ Cost Today   │
  │    Today     │    Today     │   (7 days)   │              │
  ├──────────────┼──────────────┼──────────────┼──────────────┤
  │     12       │      45      │    94.2%     │   $4.50      │
  │ 62 w/credits │   3 failed   │ 12 refunds   │ WaveSpeed    │
  └──────────────┴──────────────┴──────────────┴──────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ This Month                                                            │
  ├──────────────┬──────────────┬──────────────┬──────────────┐
  │ Total Gen    │ WaveSpeed    │ Success Rate │ Avg Cost/Gen │
  │    342       │   $34.20     │    95.3%     │    $0.10     │
  └──────────────┴──────────────┴──────────────┴──────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ AI Provider Usage (Last 30 Days)                                      │
  ├────────────┬─────────┬─────────────┬─────────┬──────────────────────┤
  │ Provider   │ Calls   │ Success %   │ Failed  │ Total Cost           │
  ├────────────┼─────────┼─────────────┼─────────┼──────────────────────┤
  │ NanoBanana │ 280     │ 95.7%       │ 12      │ $28.00               │
  │ Seedream   │ 62      │ 91.9%       │ 5       │ $6.20                │
  └────────────┴─────────┴─────────────┴─────────┴──────────────────────┘

  ... (more sections)
```

---

## ✅ Testing Checklist

After updating:

- [ ] Dashboard loads without errors
- [ ] All stat cards show correct data (or 0 if no usage)
- [ ] Provider breakdown shows correctly
- [ ] No references to credit_pools
- [ ] No manual refill button
- [ ] Recent failures section appears when there are failures
- [ ] Auto-refreshes every 30 seconds
- [ ] Mobile responsive

---

## 📄 Files to Update

1. **API Route:**
   - File: `apps/web/app/api/admin/credit-stats/route.ts`
   - Action: Replace with `NEW_ADMIN_CREDIT_STATS_API.ts`

2. **Dashboard Component:**
   - File: `apps/web/app/components/admin/CreditManagementDashboard.tsx`
   - Action: Replace with new component code above

3. **Delete Refill Route:**
   - File: `apps/web/app/api/admin/refill-credits/route.ts`
   - Action: Delete (no longer needed)

---

## 🚀 Ready to implement?

Let me know if you need:
1. The actual React component file written
2. Additional stat cards
3. Export functionality (CSV download of stats)
4. Custom date range filters

