'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  display_name: string
  handle: string
  bio?: string
  city?: string
  role_flags: string[]
  style_tags: string[]
  subscription_tier: string
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no profile exists, redirect to create profile
        if (error.code === 'PGRST116') {
          router.push('/auth/create-profile')
          return
        }
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const isContributor = profile.role_flags.includes('CONTRIBUTOR')
  const isTalent = profile.role_flags.includes('TALENT')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {profile.display_name}!
              </h1>
              <p className="text-gray-600">@{profile.handle}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Summary */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile Summary</h2>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Role:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {isContributor && 'Contributor'}
                      {isTalent && 'Talent'}
                      {isContributor && isTalent && ' & Talent'}
                    </span>
                  </div>
                  {profile.city && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <span className="ml-2 text-sm text-gray-900">{profile.city}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Subscription:</span>
                    <span className="ml-2 text-sm text-gray-900">{profile.subscription_tier}</span>
                  </div>
                </div>
                {profile.bio && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500">Bio:</span>
                    <p className="text-sm text-gray-900 mt-1">{profile.bio}</p>
                  </div>
                )}
                {profile.style_tags.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500">Style Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.style_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isContributor && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">As a Contributor</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/gigs/create')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Create New Gig
                  </button>
                  <button 
                    onClick={() => router.push('/gigs/my-gigs')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                    View My Gigs
                  </button>
                  <button 
                    onClick={() => router.push('/applications')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                    Review Applications
                  </button>
                </div>
              </div>
            )}

            {isTalent && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">As Talent</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/gigs')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Browse Gigs
                  </button>
                  <button 
                    onClick={() => router.push('/applications/my-applications')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                    My Applications
                  </button>
                  <button 
                    onClick={() => router.push('/showcases')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                    My Showcases
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
              <div className="space-y-3">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                  Edit Profile
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                  Subscription Settings
                </button>
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                  Messages
                </button>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Development in Progress
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Gig creation, browsing, and application features are currently being developed. 
                    Your authentication system is working perfectly!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}