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
  CheckCircle,
  Star,
  ImageIcon
} from 'lucide-react'

// Import admin components
import { ReportsQueue } from '../components/admin/ReportsQueue'
import { UserManagement } from '../components/admin/UserManagement'
import { VerificationQueue } from '../components/admin/VerificationQueue'
import { ModerationQueue } from '../components/admin/ModerationQueue'
import { ModerationAnalytics } from '../components/admin/ModerationAnalytics'
import { FeaturedPresetsQueue } from '../components/admin/FeaturedPresetsQueue'
import { InviteSystemManager } from '../components/admin/InviteSystemManager'

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
  description?: string
  credits: number
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
        .order('credits', { ascending: true })

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
      const { data: refunds, error: refundsError } = await supabase
        .from('credit_refunds')
        .select('*')
        .order('created_at', { ascending: false })

      // If table doesn't exist, set empty metrics
      if (refundsError) {
        console.log('Credit refunds table not yet configured')
        setRefundMetrics({
          totalRefunds: 0,
          totalCreditsRefunded: 0,
          platformLoss: 0,
          refundRate: 0,
          refundsByReason: [],
          recentRefunds: []
        })
        return
      }

      if (!refunds) return

      // Calculate metrics
      const totalRefunds = refunds.length
      const totalCreditsRefunded = refunds.reduce((sum, r) => sum + r.credits_refunded, 0)
      const platformLoss = refunds.reduce((sum, r) => sum + (r.platform_credits_lost || 0), 0)

      // Get total enhancements for refund rate
      const { count: totalEnhancements } = await supabase
        .from('platform_credit_consumption')
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
      // Set empty metrics on error
      setRefundMetrics({
        totalRefunds: 0,
        totalCreditsRefunded: 0,
        platformLoss: 0,
        refundRate: 0,
        refundsByReason: [],
        recentRefunds: []
      })
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
    { id: 'invites', label: 'Invite System', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'verification', label: 'Verifications', icon: CheckCircle },
    { id: 'featured-presets', label: 'Featured Presets', icon: Star },
    { id: 'platform-images', label: 'Platform Images', icon: ImageIcon },
    { id: 'credits', label: 'Credits', icon: CreditCard },
  ]

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Access denied. Admin privileges required.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="px-3 sm:px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm sm:text-base"
              >
                User Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3 sm:px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex space-x-2 sm:space-x-8 min-w-max">
              {tabs.map((tab) => (
                tab.id === 'platform-images' ? (
                  <Link
                    key={tab.id}
                    href="/admin/platform-images"
                    className="flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50"
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </Link>
                ) : (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }
                    `}
                  >
                    <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                )
              ))}
            </div>
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
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <p className="text-sm font-medium text-muted-foreground">Total Gigs</p>
                <p className="text-3xl font-bold text-foreground">{stats?.totalGigs || 0}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-3xl font-bold text-foreground">{stats?.totalApplications || 0}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <p className="text-sm font-medium text-muted-foreground">Showcases</p>
                <p className="text-3xl font-bold text-foreground">{stats?.totalShowcases || 0}</p>
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Active Subscriptions</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{stats?.activeSubscriptions?.free || 0}</p>
                  <p className="text-sm text-muted-foreground">Free</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats?.activeSubscriptions?.plus || 0}</p>
                  <p className="text-sm text-muted-foreground">Plus</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats?.activeSubscriptions?.pro || 0}</p>
                  <p className="text-sm text-muted-foreground">Pro</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite System Tab */}
        {activeTab === 'invites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Invite System</h2>
                <p className="text-muted-foreground">Manage invite-only mode and referral system</p>
              </div>
            </div>
            <InviteSystemManager />
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Content Moderation</h2>
                <p className="text-muted-foreground">Review and moderate flagged content across the platform</p>
              </div>
            </div>

            {/* Moderation Analytics */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Analytics Overview</h3>
              <ModerationAnalytics />
            </div>

            {/* Moderation Queue */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Content Queue</h3>
              <ModerationQueue />
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && <ReportsQueue />}

        {/* Users Tab */}
        {activeTab === 'users' && <UserManagement />}

        {/* Verification Tab (unified for all verification types) */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">User Verifications</h2>
                <p className="text-muted-foreground">Review and approve identity, professional, and business verification requests</p>
              </div>
            </div>
            <VerificationQueue />
          </div>
        )}

        {/* Featured Presets Tab */}
        {activeTab === 'featured-presets' && (
          <div className="space-y-6">
            <FeaturedPresetsQueue />
          </div>
        )}


        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="space-y-6">
            {/* Platform Credits Overview */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Platform Credits</h2>
                <button
                  onClick={syncNanoBananaCredits}
                  disabled={syncingCredits}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {syncingCredits ? 'Syncing...' : 'Sync Credits'}
                </button>
              </div>

              {platformCredits.map((credit) => (
                <div key={credit.provider} className="mb-6 p-4 border border-border rounded-lg bg-card">
                  <h3 className="font-semibold text-foreground mb-2">{credit.provider}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-xl font-bold text-primary">{credit.current_balance}</p>
                      {credit.current_balance < credit.low_balance_threshold && (
                        <p className="text-xs text-destructive">⚠️ Low balance!</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Purchased</p>
                      <p className="text-xl font-bold text-foreground">{credit.total_purchased}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Consumed</p>
                      <p className="text-xl font-bold text-foreground">{credit.total_consumed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Credit Ratio</p>
                      <p className="text-xl font-bold text-foreground">1:{credit.credit_ratio}</p>
                      <p className="text-xs text-muted-foreground">User:Provider</p>
                    </div>
                  </div>
                  {credit.metadata?.last_api_balance !== undefined && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Last API Balance: {credit.metadata.last_api_balance} credits
                    </div>
                  )}
                </div>
              ))}

              {lastSync && (
                <p className="text-sm text-muted-foreground">Last synced: {lastSync}</p>
              )}
            </div>

            {/* Credit Packages */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Credit Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg) => (
                  <div key={pkg.id} className={`p-4 border rounded-lg bg-card ${pkg.is_active ? 'border-primary' : 'border-border opacity-50'}`}>
                    <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                    )}
                    <p className="text-2xl font-bold text-foreground">{pkg.credits} credits</p>
                    <p className="text-lg text-primary">${pkg.price_usd}</p>
                    <p className="text-xs text-muted-foreground">
                      ${pkg.credits > 0 ? (pkg.price_usd / pkg.credits).toFixed(2) : '0.00'} per credit
                    </p>
                    {!pkg.is_active && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-muted text-muted-foreground rounded">Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Metrics */}
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Refund Metrics</h2>

              {refundMetrics ? (
                <div>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Refunds</p>
                      <p className="text-2xl font-bold text-foreground">{refundMetrics.totalRefunds}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Credits Refunded</p>
                      <p className="text-2xl font-bold text-primary">{refundMetrics.totalCreditsRefunded}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Platform Loss</p>
                      <p className="text-2xl font-bold text-destructive">{refundMetrics.platformLoss} NB</p>
                      <p className="text-xs text-muted-foreground">NanoBanana credits lost</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Refund Rate</p>
                      <p className="text-2xl font-bold text-primary">{refundMetrics.refundRate.toFixed(2)}%</p>
                    </div>
                  </div>

                  {/* Recent Refunds */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Recent Refunds</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Task ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Credits</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Reason</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {refundMetrics.recentRefunds.map((refund) => (
                            <tr key={refund.id}>
                              <td className="px-4 py-2 text-sm text-foreground">
                                {refund.task_id?.substring(0, 8)}...
                              </td>
                              <td className="px-4 py-2 text-sm text-primary">
                                {refund.credits_refunded}
                              </td>
                              <td className="px-4 py-2 text-sm text-foreground">
                                {refund.refund_reason}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
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
                <p className="text-muted-foreground">Loading refund metrics...</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}