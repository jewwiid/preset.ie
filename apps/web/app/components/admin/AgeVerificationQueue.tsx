'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  User,
  Shield,
  AlertTriangle,
  RefreshCw,
  Filter
} from 'lucide-react'
import { VerificationBadge } from '../../../components/VerificationBadge'

interface UserVerification {
  user_id: string
  display_name: string
  handle: string
  email: string
  date_of_birth: string
  calculated_age: number
  age_verified: boolean
  age_verified_at: string | null
  account_status: string
  verification_method: string | null
  created_at: string
  verification_attempts: number
  active_badges: Array<{
    type: string
    issued_at: string
  }> | null
}

export function AgeVerificationQueue() {
  const [users, setUsers] = useState<UserVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'suspended'>('pending')
  const [selectedUser, setSelectedUser] = useState<UserVerification | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('admin_age_verification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      // Apply filters
      if (filter === 'pending') {
        query = query.eq('account_status', 'pending_verification')
      } else if (filter === 'verified') {
        query = query.eq('age_verified', true)
      } else if (filter === 'suspended') {
        query = query.eq('account_status', 'suspended')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyUser = async (userId: string, dateOfBirth: string) => {
    setProcessing(true)
    try {
      // Call the verification function
      const { data, error } = await supabase.rpc('verify_user_age', {
        p_user_id: userId,
        p_date_of_birth: dateOfBirth,
        p_method: 'admin_override',
        p_verified_by: (await supabase.auth.getUser()).data.user?.id
      })

      if (error) {
        console.error('Verification error:', error)
        alert('Failed to verify user: ' + error.message)
      } else {
        alert(data ? 'User verified successfully!' : 'User is under 18 and has been suspended')
        fetchUsers() // Refresh the list
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred during verification')
    } finally {
      setProcessing(false)
    }
  }

  const suspendUser = async (userId: string, reason: string) => {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ 
          account_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Suspension error:', error)
        alert('Failed to suspend user')
      } else {
        // Log the action
        await supabase.from('age_verification_logs').insert({
          user_id: userId,
          verification_type: 'age',
          verification_method: 'admin_suspension',
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          success: false,
          failure_reason: reason
        })

        alert('User suspended successfully')
        fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'text-yellow-600 bg-yellow-100'
      case 'age_verified': return 'text-green-600 bg-green-100'
      case 'fully_verified': return 'text-blue-600 bg-blue-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      case 'banned': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Age Verification Queue</h2>
          <p className="text-gray-600 mt-1">Review and verify user ages</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'verified', 'suspended'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === filterOption
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age Info</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.display_name}</div>
                      <div className="text-sm text-gray-500">@{user.handle}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(user.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`text-sm font-medium ${
                        user.calculated_age >= 18 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Age: {user.calculated_age} years
                      </div>
                      {user.verification_attempts > 0 && (
                        <div className="text-xs text-gray-500">
                          {user.verification_attempts} attempt(s)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(user.account_status)
                    }`}>
                      {user.account_status.replace('_', ' ')}
                    </span>
                    {user.age_verified && (
                      <div className="mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600 inline mr-1" />
                        <span className="text-xs text-gray-500">
                          Verified {user.age_verified_at ? new Date(user.age_verified_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {user.active_badges && user.active_badges.length > 0 ? (
                      <div className="flex gap-1">
                        {user.active_badges.map((badge, idx) => (
                          <VerificationBadge 
                            key={idx}
                            type={badge.type as any}
                            size="sm"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {!user.age_verified && user.calculated_age >= 18 && (
                        <button
                          onClick={() => verifyUser(user.user_id, user.date_of_birth)}
                          disabled={processing}
                          className="text-green-600 hover:text-green-700 font-medium text-sm disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                      {user.account_status !== 'suspended' && user.calculated_age < 18 && (
                        <button
                          onClick={() => suspendUser(user.user_id, 'Under 18 years old')}
                          disabled={processing}
                          className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">User Verification Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{selectedUser.display_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Handle</label>
                  <p className="text-gray-900">@{selectedUser.handle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">
                    {new Date(selectedUser.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Calculated Age</label>
                  <p className={`font-bold ${
                    selectedUser.calculated_age >= 18 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedUser.calculated_age} years old
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-gray-900">{selectedUser.account_status}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                {!selectedUser.age_verified && selectedUser.calculated_age >= 18 && (
                  <button
                    onClick={() => {
                      verifyUser(selectedUser.user_id, selectedUser.date_of_birth)
                    }}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve Age Verification
                  </button>
                )}
                {selectedUser.account_status !== 'suspended' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for suspension:')
                      if (reason) {
                        suspendUser(selectedUser.user_id, reason)
                      }
                    }}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Suspend Account
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}