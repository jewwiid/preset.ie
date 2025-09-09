'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PlatformStats {
  totalUsers: number
  totalGigs: number
  totalApplications: number
  totalShowcases: number
  activeSubscriptions: {
    free: number
    plus: number
    pro: number
  }
}

interface PlatformCredits {
  provider: string
  current_balance: number
  total_purchased: number
  total_consumed: number
  credit_ratio: number
  low_balance_threshold: number
  metadata?: {
    last_api_balance?: number
    [key: string]: any
  }
}

interface CreditPackage {
  id: string
  name: string
  description: string
  user_credits: number
  price_usd: number
  is_active: boolean
}

interface RefundMetrics {
  totalRefunds: number
  totalCreditsRefunded: number
  platformLoss: number
  refundRate: number
  refundsByReason: Array<{
    reason: string
    count: number
    credits: number
  }>
  recentRefunds: Array<{
    id: string
    task_id: string
    user_id: string
    credits_refunded: number
    refund_reason: string
    created_at: string
  }>
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [platformCredits, setPlatformCredits] = useState<PlatformCredits[]>([])
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([])
  const [refundMetrics, setRefundMetrics] = useState<RefundMetrics | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [syncingCredits, setSyncingCredits] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess()
    }
  }, [user, authLoading])

  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    try {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role_flags')
        .eq('user_id', user.id)
        .single()

      if (!profile || !profile.role_flags.includes('ADMIN')) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await Promise.all([
        fetchPlatformStats(),
        fetchPlatformCredits(),
        fetchCreditPackages(),
        fetchRefundMetrics()
      ])
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatformStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from('users_profile')
        .select('*', { count: 'exact', head: true })

      // Fetch gig count
      const { count: gigCount } = await supabase
        .from('gigs')
        .select('*', { count: 'exact', head: true })

      // Fetch application count
      const { count: applicationCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })

      // Fetch showcase count
      const { count: showcaseCount } = await supabase
        .from('showcases')
        .select('*', { count: 'exact', head: true })

      // Fetch subscription distribution
      const { data: subscriptions } = await supabase
        .from('users_profile')
        .select('subscription_tier')

      const subscriptionCounts = subscriptions?.reduce((acc: { free: number; plus: number; pro: number }, sub) => {
        const tier = (sub.subscription_tier || 'free') as 'free' | 'plus' | 'pro'
        if (tier === 'free' || tier === 'plus' || tier === 'pro') {
          acc[tier] = (acc[tier] || 0) + 1
        }
        return acc
      }, { free: 0, plus: 0, pro: 0 }) || { free: 0, plus: 0, pro: 0 }

      setStats({
        totalUsers: userCount || 0,
        totalGigs: gigCount || 0,
        totalApplications: applicationCount || 0,
        totalShowcases: showcaseCount || 0,
        activeSubscriptions: subscriptionCounts
      })
    } catch (error) {
      console.error('Error fetching platform stats:', error)
    }
  }

  const fetchPlatformCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_credits')
        .select('*')
        .order('provider')

      if (!error && data) {
        setPlatformCredits(data)
        // Check for last sync time
        const nanoBanana = data.find(c => c.provider === 'nanobanana')
        if (nanoBanana?.metadata?.last_sync_at) {
          setLastSync(nanoBanana.metadata.last_sync_at)
        }
      }
    } catch (error) {
      console.error('Error fetching platform credits:', error)
    }
  }

  const syncRealCredits = async () => {
    setSyncingCredits(true)
    try {
      const token = await supabase.auth.getSession()
      const response = await fetch('/api/admin/sync-credits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: 'nanobanana', forceUpdate: true })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Credit sync result:', result)
        
        // Refresh the credits display
        await fetchPlatformCredits()
        
        // Show success message
        alert(`Synced NanoBanana credits: ${result.data.realCredits} credits available`)
      } else {
        throw new Error('Failed to sync credits')
      }
    } catch (error) {
      console.error('Error syncing credits:', error)
      alert('Failed to sync credits. Check console for details.')
    } finally {
      setSyncingCredits(false)
    }
  }

  const fetchCreditPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('user_credits')

      if (!error && data) {
        setCreditPackages(data)
      }
    } catch (error) {
      console.error('Error fetching credit packages:', error)
    }
  }

  const fetchRefundMetrics = async () => {
    try {
      // Fetch total refunds
      const { data: refunds, count } = await supabase
        .from('refund_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch refunds by reason
      const { data: refundsByReason } = await supabase
        .from('refund_audit_log')
        .select('refund_reason, credits_refunded')

      // Calculate metrics
      const totalRefunds = count || 0
      const totalCreditsRefunded = refunds?.reduce((sum, r) => sum + r.credits_refunded, 0) || 0
      const platformLoss = refunds?.reduce((sum, r) => sum + (r.platform_loss || 0), 0) || 0

      // Get total enhancements for refund rate
      const { count: totalEnhancements } = await supabase
        .from('enhancement_tasks')
        .select('*', { count: 'exact', head: true })

      const refundRate = totalEnhancements ? (totalRefunds / totalEnhancements) * 100 : 0

      // Group refunds by reason
      const reasonGroups = refundsByReason?.reduce((acc, r) => {
        if (!acc[r.refund_reason]) {
          acc[r.refund_reason] = { reason: r.refund_reason, count: 0, credits: 0 }
        }
        acc[r.refund_reason].count++
        acc[r.refund_reason].credits += r.credits_refunded
        return acc
      }, {} as Record<string, any>)

      setRefundMetrics({
        totalRefunds,
        totalCreditsRefunded,
        platformLoss,
        refundRate,
        refundsByReason: Object.values(reasonGroups || {}),
        recentRefunds: refunds || []
      })
    } catch (error) {
      console.error('Error fetching refund metrics:', error)
    }
  }

  const handleRefillCredits = async (provider: string, amount: number) => {
    if (!confirm(`Refill ${amount} credits for ${provider}?`)) return

    try {
      // First get current values
      const { data: current } = await supabase
        .from('platform_credits')
        .select('current_balance, total_purchased')
        .eq('provider', provider)
        .single()
      
      if (!current) {
        alert('Provider not found')
        return
      }

      const { error } = await supabase
        .from('platform_credits')
        .update({ 
          current_balance: current.current_balance + amount,
          total_purchased: current.total_purchased + amount,
          last_purchase_at: new Date().toISOString()
        })
        .eq('provider', provider)

      if (!error) {
        alert(`Successfully added ${amount} credits to ${provider}`)
        fetchPlatformCredits()
      } else {
        throw error
      }
    } catch (error) {
      console.error('Error refilling credits:', error)
      alert('Failed to refill credits')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-emerald-400">Admin Dashboard</h1>
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'overview' 
                      ? 'bg-gray-900 text-emerald-400' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('credits')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'credits' 
                      ? 'bg-gray-900 text-emerald-400' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Credits
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'users' 
                      ? 'bg-gray-900 text-emerald-400' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'content' 
                      ? 'bg-gray-900 text-emerald-400' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveTab('refunds')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'refunds' 
                      ? 'bg-gray-900 text-emerald-400' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Refunds
                </button>
              </nav>
            </div>
            <Link 
              href="/dashboard"
              className="text-gray-400 hover:text-white text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && stats && (
          <div className="px-4 py-6 sm:px-0">
            {/* Platform Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-sm font-medium text-gray-400">Total Users</div>
                <div className="mt-2 text-3xl font-bold text-white">{stats.totalUsers}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-sm font-medium text-gray-400">Total Gigs</div>
                <div className="mt-2 text-3xl font-bold text-white">{stats.totalGigs}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-sm font-medium text-gray-400">Applications</div>
                <div className="mt-2 text-3xl font-bold text-white">{stats.totalApplications}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-sm font-medium text-gray-400">Showcases</div>
                <div className="mt-2 text-3xl font-bold text-white">{stats.totalShowcases}</div>
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{stats.activeSubscriptions.free}</div>
                  <div className="text-sm text-gray-500">Free</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{stats.activeSubscriptions.plus}</div>
                  <div className="text-sm text-gray-500">Plus</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.activeSubscriptions.pro}</div>
                  <div className="text-sm text-gray-500">Pro</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/admin/users" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
                <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                <p className="text-sm text-gray-400">Manage user accounts, roles, and subscriptions</p>
              </Link>
              <Link href="/admin/moderation" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
                <h3 className="text-lg font-semibold text-white mb-2">Content Moderation</h3>
                <p className="text-sm text-gray-400">Review reported content and user complaints</p>
              </Link>
              <Link href="/admin/analytics" className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition">
                <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                <p className="text-sm text-gray-400">View detailed platform analytics and trends</p>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'credits' && (
          <div className="px-4 py-6 sm:px-0">
            {/* Platform Credits */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Platform Credit Balances</h2>
                <div className="flex items-center space-x-4">
                  {lastSync && (
                    <span className="text-sm text-gray-400">
                      Last sync: {new Date(lastSync).toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={syncRealCredits}
                    disabled={syncingCredits}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      syncingCredits
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {syncingCredits ? 'Syncing...' : '🔄 Sync Real Credits'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {platformCredits.map((credit) => (
                  <div key={credit.provider} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-md font-semibold text-white capitalize">{credit.provider}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm text-gray-400">
                            Current Balance: 
                            <span className={`ml-2 font-bold ${
                              credit.current_balance < credit.low_balance_threshold 
                                ? 'text-red-400' 
                                : 'text-green-400'
                            }`}>
                              {credit.current_balance.toLocaleString()} credits
                            </span>
                            {credit.metadata?.last_api_balance && (
                              <span className="ml-2 text-xs text-gray-500">
                                (API: {credit.metadata.last_api_balance})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Total Purchased: {credit.total_purchased.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            Total Consumed: {credit.total_consumed.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            Credit Ratio: 1 user credit = {credit.credit_ratio} provider credits
                          </div>
                          <div className="text-sm text-gray-400">
                            Low Balance Alert: {credit.low_balance_threshold} credits
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleRefillCredits(credit.provider, 1000)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          +1,000
                        </button>
                        <button 
                          onClick={() => handleRefillCredits(credit.provider, 5000)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          +5,000
                        </button>
                        <button 
                          onClick={() => handleRefillCredits(credit.provider, 10000)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          +10,000
                        </button>
                      </div>
                    </div>
                    {credit.current_balance < credit.low_balance_threshold && (
                      <div className="mt-3 p-2 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
                        ⚠️ Low balance warning! Consider refilling soon.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Packages */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Credit Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg) => (
                  <div key={pkg.id} className="border border-gray-700 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-white">{pkg.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{pkg.description}</p>
                    <div className="mt-3 space-y-1">
                      <div className="text-sm text-gray-400">
                        Credits: <span className="text-white font-bold">{pkg.user_credits}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Price: <span className="text-emerald-400 font-bold">€{pkg.price_usd}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Status: 
                        <span className={`ml-2 ${pkg.is_active ? 'text-green-400' : 'text-red-400'}`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">User Management</h2>
              <p className="text-gray-400">User management interface coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Content Moderation</h2>
              <p className="text-gray-400">Content moderation interface coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div className="px-4 py-6 sm:px-0">
            {/* Refund Metrics Overview */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Refund Metrics</h2>
              
              {refundMetrics ? (
                <div>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Total Refunds</p>
                      <p className="text-2xl font-bold text-white">{refundMetrics.totalRefunds}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Credits Refunded</p>
                      <p className="text-2xl font-bold text-emerald-400">{refundMetrics.totalCreditsRefunded}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Platform Loss</p>
                      <p className="text-2xl font-bold text-red-400">{refundMetrics.platformLoss} NB</p>
                      <p className="text-xs text-gray-500">NanoBanana credits lost</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Refund Rate</p>
                      <p className="text-2xl font-bold text-yellow-400">{refundMetrics.refundRate.toFixed(2)}%</p>
                      <p className="text-xs text-gray-500">
                        {refundMetrics.refundRate < 1 ? '✅ Excellent' : 
                         refundMetrics.refundRate < 3 ? '⚠️ Normal' :
                         refundMetrics.refundRate < 5 ? '⚠️ Concerning' : '🔴 Critical'}
                      </p>
                    </div>
                  </div>

                  {/* Refunds by Reason */}
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-white mb-3">Refunds by Error Type</h3>
                    <div className="space-y-2">
                      {refundMetrics.refundsByReason.map((reason) => (
                        <div key={reason.reason} className="flex justify-between items-center bg-gray-700 rounded p-3">
                          <span className="text-gray-300">{reason.reason || 'Unknown'}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400">{reason.count} refunds</span>
                            <span className="text-emerald-400 font-medium">{reason.credits} credits</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Refunds */}
                  <div>
                    <h3 className="text-md font-semibold text-white mb-3">Recent Refunds</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Task ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Credits</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Reason</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {refundMetrics.recentRefunds.map((refund) => (
                            <tr key={refund.id}>
                              <td className="px-4 py-2 text-sm text-gray-300">
                                {refund.task_id?.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-300">
                                {refund.user_id?.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-2 text-sm text-emerald-400">
                                {refund.credits_refunded}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-300">
                                {refund.refund_reason}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-400">
                                {new Date(refund.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Loading refund metrics...</p>
              )}
            </div>

            {/* Refund Policy Configuration */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Refund Policies</h2>
              <p className="text-gray-400 text-sm mb-4">
                Configure which error types trigger automatic refunds
              </p>
              <button
                onClick={() => fetchRefundMetrics()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                Refresh Metrics
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}