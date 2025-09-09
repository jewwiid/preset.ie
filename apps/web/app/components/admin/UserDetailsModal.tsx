'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Shield, 
  CreditCard, 
  FileText, 
  Activity, 
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle,
  Calendar,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UserDetailsModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

interface UserDetails {
  user_id: string
  display_name: string
  handle: string
  email?: string
  phone?: string
  bio?: string
  city?: string
  role_flags: string[]
  subscription_tier: string
  subscription_status?: string
  subscription_expires_at?: string
  created_at: string
  last_seen_at?: string
  violation_count: number
  risk_score: number
  is_suspended: boolean
  is_banned: boolean
  suspension_expires_at?: string
  gigs_created?: number
  applications_submitted?: number
  showcases_published?: number
  reviews_received?: number
  average_rating?: number
  credits_balance?: number
  verification_badges?: Array<{
    type: string
    verified_at: string
    expires_at?: string
  }>
  recent_violations?: Array<{
    id: string
    type: string
    severity: string
    created_at: string
    description: string
  }>
  recent_activity?: Array<{
    type: string
    description: string
    created_at: string
  }>
}

export function UserDetailsModal({ userId, isOpen, onClose }: UserDetailsModalProps) {
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetails()
    }
  }, [userId, isOpen])

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        toast.error('Failed to load user details')
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (score: number) => {
    if (score >= 75) return <Badge className="bg-red-500 text-white">High Risk</Badge>
    if (score >= 50) return <Badge className="bg-orange-500 text-white">Medium Risk</Badge>
    if (score >= 25) return <Badge className="bg-yellow-500 text-white">Low Risk</Badge>
    return <Badge className="bg-green-500 text-white">Clean</Badge>
  }

  const getStatusBadges = () => {
    if (!user) return null
    const badges = []
    
    if (user.is_banned) {
      badges.push(
        <Badge key="banned" className="bg-red-600 text-white">
          <Ban className="h-3 w-3 mr-1" />
          Banned
        </Badge>
      )
    } else if (user.is_suspended) {
      badges.push(
        <Badge key="suspended" className="bg-orange-600 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Suspended
        </Badge>
      )
    } else {
      badges.push(
        <Badge key="active" className="bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }

    if (user.role_flags?.includes('VERIFIED_ID')) {
      badges.push(
        <Badge key="verified" className="bg-blue-600 text-white">
          <Shield className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )
    }

    if (user.role_flags?.includes('ADMIN')) {
      badges.push(
        <Badge key="admin" className="bg-purple-600 text-white">
          Admin
        </Badge>
      )
    }

    return badges
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            Loading user details...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete profile and activity information for {user.display_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div>
                <h3 className="text-xl font-semibold">{user.display_name || 'Unnamed'}</h3>
                <p className="text-sm text-gray-500">@{user.handle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getStatusBadges()}
                {getRiskBadge(user.risk_score)}
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Member since {new Date(user.created_at).toLocaleDateString()}</div>
              {user.last_seen_at && (
                <div>Last seen {new Date(user.last_seen_at).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Contact Information</h4>
                  {user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{user.city}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  <h4 className="font-medium">Platform Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Gigs Created:</span>
                      <span className="ml-2 font-medium">{user.gigs_created || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Applications:</span>
                      <span className="ml-2 font-medium">{user.applications_submitted || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Showcases:</span>
                      <span className="ml-2 font-medium">{user.showcases_published || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reviews:</span>
                      <span className="ml-2 font-medium">{user.reviews_received || 0}</span>
                    </div>
                  </div>
                  {user.average_rating && (
                    <div className="text-sm">
                      <span className="text-gray-500">Average Rating:</span>
                      <span className="ml-2 font-medium">{user.average_rating.toFixed(1)}/5.0</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="space-y-2">
                  <h4 className="font-medium">Bio</h4>
                  <p className="text-sm text-gray-600">{user.bio}</p>
                </div>
              )}

              {/* Verification Badges */}
              {user.verification_badges && user.verification_badges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Verification Badges</h4>
                  <div className="space-y-2">
                    {user.verification_badges.map((badge, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium capitalize">{badge.type}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Verified {new Date(badge.verified_at).toLocaleDateString()}
                          {badge.expires_at && ` • Expires ${new Date(badge.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <h4 className="font-medium">Recent Activity</h4>
              {user.recent_activity && user.recent_activity.length > 0 ? (
                <div className="space-y-2">
                  {user.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm">{activity.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </TabsContent>

            <TabsContent value="violations" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Violation History</h4>
                <Badge variant={user.violation_count > 0 ? "destructive" : "default"}>
                  {user.violation_count} Total Violations
                </Badge>
              </div>
              
              {user.recent_violations && user.recent_violations.length > 0 ? (
                <div className="space-y-2">
                  {user.recent_violations.map((violation) => (
                    <div key={violation.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="font-medium capitalize">{violation.type.replace('_', ' ')}</span>
                            <Badge variant="outline" className={
                              violation.severity === 'critical' ? 'bg-red-50' :
                              violation.severity === 'high' ? 'bg-orange-50' :
                              violation.severity === 'medium' ? 'bg-yellow-50' :
                              'bg-gray-50'
                            }>
                              {violation.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{violation.description}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(violation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No violations on record</p>
              )}

              {user.is_suspended && user.suspension_expires_at && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Suspended until {new Date(user.suspension_expires_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <h4 className="font-medium">Subscription Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Current Tier</span>
                    <div className="mt-1">
                      <Badge className="capitalize">{user.subscription_tier || 'free'}</Badge>
                    </div>
                  </div>
                  {user.subscription_status && (
                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <div className="mt-1">
                        <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {user.subscription_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {user.subscription_expires_at && (
                    <div>
                      <span className="text-sm text-gray-500">Expires</span>
                      <div className="mt-1 text-sm font-medium">
                        {new Date(user.subscription_expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {user.credits_balance !== undefined && (
                    <div>
                      <span className="text-sm text-gray-500">Credit Balance</span>
                      <div className="mt-1 text-sm font-medium">
                        {user.credits_balance} credits
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}