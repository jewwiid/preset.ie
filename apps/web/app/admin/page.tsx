'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  BarChart3, 
  FileText, 
  CheckCircle 
} from 'lucide-react'

// Import admin components
import { ReportsQueue } from '../components/admin/ReportsQueue'
import { UserManagement } from '../components/admin/UserManagement'
import { VerificationQueue } from '../components/admin/VerificationQueue'
import { AgeVerificationQueue } from '../components/admin/AgeVerificationQueue'
import { ModerationQueue } from '../components/admin/ModerationQueue'
import { ModerationAnalytics } from '../components/admin/ModerationAnalytics'

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
  const { user, loading: authLoading, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
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
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }

      const { data: profile } = await supabase
        .from('users_profile')
        .select('role_flags')
        .eq('user_id', user.id)
        .single()

      if (!profile?.role_flags?.includes('ADMIN')) {
        router.push('/')
        return
      }

      setIsAdmin(true)
      await Promise.all([
        fetchStats(),
        fetchPlatformCredits(),
        fetchCreditPackages(),
        fetchRefundMetrics()
      ])
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users_profile')
        .select('*', { count: 'exact', head: true })

      // Fetch gigs count
      const { count: gigsCount } = await supabase
        .from('gigs')
        .select('*', { count: 'exact', head: true })

      // Fetch applications count
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })

      // Fetch showcases count
      const { count: showcasesCount } = await supabase
        .from('showcases')
        .select('*', { count: 'exact', head: true })

      // Fetch subscription counts
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
        totalUsers: usersCount || 0,
        totalGigs: gigsCount || 0,
        totalApplications: applicationsCount || 0,
        totalShowcases: showcasesCount || 0,
        activeSubscriptions: subscriptionCounts
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchPlatformCredits = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }

      const { data } = await supabase
        .from('platform_credits')
        .select('*')

      if (data) {
        setPlatformCredits(data)
      }
    } catch (error) {
      console.error('Error fetching platform credits:', error)
    }
  }

  const fetchCreditPackages = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }

      const { data } = await supabase
        .from('credit_packages')
        .select('*')
        .order('user_credits', { ascending: true })

      if (data) {
        setCreditPackages(data)
      }
    } catch (error) {
      console.error('Error fetching credit packages:', error)
    }
  }

  const fetchRefundMetrics = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }

      // Fetch all refunds
      const { data: refunds } = await supabase
        .from('credit_refunds')
        .select('*')
        .order('created_at', { ascending: false })

      if (!refunds) return

      // Calculate metrics
      const totalRefunds = refunds.length
      const totalCreditsRefunded = refunds.reduce((sum, r) => sum + r.credits_refunded, 0)
      const platformLoss = refunds.reduce((sum, r) => sum + (r.platform_credits_lost || 0), 0)

      // Get total enhancements for refund rate
      const { count: totalEnhancements } = await supabase
        .from('credit_consumption')
        .select('*', { count: 'exact', head: true })

      const refundRate = totalEnhancements ? (totalRefunds / totalEnhancements) * 100 : 0

      // Group by reason
      const reasonGroups = refunds.reduce((acc: any, refund) => {
        const reason = refund.refund_reason || 'Unknown'
        if (!acc[reason]) {
          acc[reason] = { reason, count: 0, credits: 0 }
        }
        acc[reason].count++
        acc[reason].credits += refund.credits_refunded
        return acc
      }, {})

      setRefundMetrics({
        totalRefunds,
        totalCreditsRefunded,
        platformLoss,
        refundRate,
        refundsByReason: Object.values(reasonGroups),
        recentRefunds: refunds.slice(0, 10)
      })
    } catch (error) {
      console.error('Error fetching refund metrics:', error)
    }
  }

  const syncNanoBananaCredits = async () => {
    setSyncingCredits(true)
    try {
      const response = await fetch('/api/credits/sync-nanobanana', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        await fetchPlatformCredits()
        setLastSync(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error('Error syncing credits:', error)
    } finally {
      setSyncingCredits(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'age-verification', label: 'Age Verification', icon: Shield },
    { id: 'verification', label: 'ID Verification', icon: CheckCircle },
    { id: 'credits', label: 'Credits', icon: CreditCard },
  ]

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Access denied. Admin privileges required.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/dashboard"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                User Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Total Gigs</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalGigs || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm font-medium text-gray-600">Showcases</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalShowcases || 0}</p>
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Subscriptions</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeSubscriptions?.free || 0}</p>
                  <p className="text-sm text-gray-600">Free</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats?.activeSubscriptions?.plus || 0}</p>
                  <p className="text-sm text-gray-600">Plus</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats?.activeSubscriptions?.pro || 0}</p>
                  <p className="text-sm text-gray-600">Pro</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
                <p className="text-gray-600">Review and moderate flagged content across the platform</p>
              </div>
            </div>
            
            {/* Moderation Analytics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Analytics Overview</h3>
              <ModerationAnalytics />
            </div>
            
            {/* Moderation Queue */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Content Queue</h3>
              <ModerationQueue />
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && <ReportsQueue />}

        {/* Users Tab */}
        {activeTab === 'users' && <UserManagement />}

        {/* Age Verification Tab */}
        {activeTab === 'age-verification' && <AgeVerificationQueue />}

        {/* ID Verification Tab */}
        {activeTab === 'verification' && <VerificationQueue />}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Platform Credits Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Platform Credits</h2>
                <button
                  onClick={syncNanoBananaCredits}
                  disabled={syncingCredits}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {syncingCredits ? 'Syncing...' : 'Sync Credits'}
                </button>
              </div>
              
              {platformCredits.map((credit) => (
                <div key={credit.provider} className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{credit.provider}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Current Balance</p>
                      <p className="text-xl font-bold text-green-600">{credit.current_balance}</p>
                      {credit.current_balance < credit.low_balance_threshold && (
                        <p className="text-xs text-red-600">⚠️ Low balance!</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Purchased</p>
                      <p className="text-xl font-bold">{credit.total_purchased}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Consumed</p>
                      <p className="text-xl font-bold">{credit.total_consumed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Credit Ratio</p>
                      <p className="text-xl font-bold">1:{credit.credit_ratio}</p>
                      <p className="text-xs text-gray-500">User:Provider</p>
                    </div>
                  </div>
                  {credit.metadata?.last_api_balance !== undefined && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last API Balance: {credit.metadata.last_api_balance} credits
                    </div>
                  )}
                </div>
              ))}
              
              {lastSync && (
                <p className="text-sm text-gray-500">Last synced: {lastSync}</p>
              )}
            </div>

            {/* Credit Packages */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg) => (
                  <div key={pkg.id} className={`p-4 border rounded-lg ${pkg.is_active ? 'border-green-500' : 'border-gray-300 opacity-50'}`}>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                    <p className="text-2xl font-bold text-gray-900">{pkg.user_credits} credits</p>
                    <p className="text-lg text-green-600">${pkg.price_usd}</p>
                    <p className="text-xs text-gray-500">${(pkg.price_usd / pkg.user_credits).toFixed(2)} per credit</p>
                    {!pkg.is_active && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Refund Metrics</h2>
              
              {refundMetrics ? (
                <div>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Refunds</p>
                      <p className="text-2xl font-bold text-gray-900">{refundMetrics.totalRefunds}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Credits Refunded</p>
                      <p className="text-2xl font-bold text-green-600">{refundMetrics.totalCreditsRefunded}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Platform Loss</p>
                      <p className="text-2xl font-bold text-red-600">{refundMetrics.platformLoss} NB</p>
                      <p className="text-xs text-gray-500">NanoBanana credits lost</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Refund Rate</p>
                      <p className="text-2xl font-bold text-yellow-600">{refundMetrics.refundRate.toFixed(2)}%</p>
                    </div>
                  </div>

                  {/* Recent Refunds */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Recent Refunds</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {refundMetrics.recentRefunds.map((refund) => (
                            <tr key={refund.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {refund.task_id?.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-2 text-sm text-green-600">
                                {refund.credits_refunded}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {refund.refund_reason}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
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
                <p className="text-gray-500">Loading refund metrics...</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}