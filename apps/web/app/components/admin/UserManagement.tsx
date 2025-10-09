'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Shield, AlertTriangle, Ban, Users, Search, MoreVertical, Trash2 } from 'lucide-react'

interface User {
  id: string
  user_id: string
  display_name: string
  handle: string
  role_flags: string[]
  subscription_tier: string
  created_at: string
  city?: string
  bio?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'contributor' | 'talent'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [filterRole, searchTerm])

  const fetchUsers = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      let query = supabase
        .from('users_profile')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply search filter
      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%`)
      }

      // Apply role filter
      if (filterRole !== 'all') {
        const roleFlag = filterRole.toUpperCase()
        query = query.contains('role_flags', [roleFlag])
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching users:', error)
        setUsers([])
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, action: 'makeAdmin' | 'removeAdmin' | 'ban' | 'unban') => {
    try {
      const user = users.find(u => u.user_id === userId)
      if (!user) return

      let updatedRoleFlags = [...user.role_flags]

      switch (action) {
        case 'makeAdmin':
          if (!updatedRoleFlags.includes('ADMIN')) {
            updatedRoleFlags.push('ADMIN')
          }
          break
        case 'removeAdmin':
          updatedRoleFlags = updatedRoleFlags.filter(flag => flag !== 'ADMIN')
          break
        case 'ban':
          if (!updatedRoleFlags.includes('BANNED')) {
            updatedRoleFlags.push('BANNED')
          }
          break
        case 'unban':
          updatedRoleFlags = updatedRoleFlags.filter(flag => flag !== 'BANNED')
          break
      }

      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { error } = await supabase
        .from('users_profile')
        .update({ role_flags: updatedRoleFlags })
        .eq('user_id', userId)

      if (error) throw error

      await fetchUsers()
      setShowActionMenu(null)
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const deleteUser = async (userId: string) => {
    const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.')
    if (!confirmed) return

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // Call the admin_delete_user function
      const { data, error } = await supabase.rpc('admin_delete_user', {
        user_id_to_delete: userId
      })

      if (error) throw error

      if (data?.success) {
        alert('User deleted successfully')
        await fetchUsers()
        setShowActionMenu(null)
      } else {
        throw new Error(data?.error || 'Failed to delete user')
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user: ${error.message}`)
    }
  }

  const getRoleBadges = (roleFlags: string[]) => {
    return roleFlags.map(flag => {
      const colors = {
        ADMIN: 'bg-primary-100 text-primary-800',
        CONTRIBUTOR: 'bg-primary-100 text-primary-800',
        TALENT: 'bg-primary-100 text-primary-800',
        BANNED: 'bg-destructive-100 text-destructive-800',
        VERIFIED_ID: 'bg-primary-100 text-primary-800'
      }
      return (
        <span key={flag} className={`px-2 py-1 text-xs rounded-full ${colors[flag as keyof typeof colors] || 'bg-muted-100 text-muted-foreground-800'}`}>
          {flag}
        </span>
      )
    })
  }

  const getSubscriptionBadge = (tier: string) => {
    const colors = {
      FREE: 'bg-muted-100 text-muted-foreground-800',
      PLUS: 'bg-primary-100 text-primary-800',
      PRO: 'bg-primary-100 text-primary-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[tier as keyof typeof colors] || 'bg-muted-100 text-muted-foreground-800'}`}>
        {tier}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-background rounded-lg shadow p-8">
        <div className="text-center text-muted-foreground-500">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-background rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or handle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-border-300 rounded-lg focus:ring-2 focus:ring-primary-primary focus:border-primary-500"
              />
            </div>
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2 border border-border-300 rounded-lg focus:ring-2 focus:ring-primary-primary focus:border-primary-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="contributor">Contributors</option>
            <option value="talent">Talent</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-muted-primary/30">
          <thead className="bg-muted-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Subscription
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-muted-primary/30">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-muted-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground-900">
                        {user.display_name}
                      </div>
                      <div className="text-sm text-muted-foreground-500">
                        @{user.handle}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {getRoleBadges(user.role_flags)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSubscriptionBadge(user.subscription_tier)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground-500">
                    {user.city || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === user.user_id ? null : user.user_id)}
                        className="text-muted-foreground-400 hover:text-muted-foreground-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {showActionMenu === user.user_id && (
                        <div className="absolute right-0 mt-2 w-48 bg-background rounded-lg shadow-lg border z-10">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="block w-full text-left px-4 py-2 text-sm text-muted-foreground-700 hover:bg-muted-50"
                          >
                            View Details
                          </button>
                          
                          {!user.role_flags.includes('ADMIN') && (
                            <button
                              onClick={() => updateUserRole(user.user_id, 'makeAdmin')}
                              className="block w-full text-left px-4 py-2 text-sm text-muted-foreground-700 hover:bg-muted-50"
                            >
                              Make Admin
                            </button>
                          )}
                          
                          {user.role_flags.includes('ADMIN') && (
                            <button
                              onClick={() => updateUserRole(user.user_id, 'removeAdmin')}
                              className="block w-full text-left px-4 py-2 text-sm text-muted-foreground-700 hover:bg-muted-50"
                            >
                              Remove Admin
                            </button>
                          )}
                          
                          {!user.role_flags.includes('BANNED') ? (
                            <button
                              onClick={() => updateUserRole(user.user_id, 'ban')}
                              className="block w-full text-left px-4 py-2 text-sm text-destructive-600 hover:bg-destructive-50"
                            >
                              Ban User
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(user.user_id, 'unban')}
                              className="block w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary/10"
                            >
                              Unban User
                            </button>
                          )}

                          <div className="border-t border-border my-1"></div>

                          <button
                            onClick={() => deleteUser(user.user_id)}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-destructive-600 hover:bg-destructive-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </button>
                        </div>
                      )}
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
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">User Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground-500">Display Name</p>
                  <p className="font-medium">{selectedUser.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Handle</p>
                  <p className="font-medium">@{selectedUser.handle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">User ID</p>
                  <p className="font-mono text-xs">{selectedUser.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Subscription</p>
                  {getSubscriptionBadge(selectedUser.subscription_tier)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Location</p>
                  <p className="font-medium">{selectedUser.city || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Joined</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground-500">Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getRoleBadges(selectedUser.role_flags)}
                </div>
              </div>
              
              {selectedUser.bio && (
                <div>
                  <p className="text-sm text-muted-foreground-500">Bio</p>
                  <p className="mt-1 text-muted-foreground-900">{selectedUser.bio}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-muted-200 text-muted-foreground-800 rounded-lg hover:bg-muted-300"
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