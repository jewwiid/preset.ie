'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Trash2, Loader2, Download } from 'lucide-react'
import MoodboardViewer from '../../components/MoodboardViewer'

interface Moodboard {
  id: string
  title: string
  summary?: string
  items: any[]
  palette?: string[]
  created_at: string
  updated_at: string
  owner_user_id: string
  is_template: boolean
  is_public: boolean
  template_name?: string
  gig_id?: string
}

export default function ViewMoodboardPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [moodboard, setMoodboard] = useState<Moodboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [accessDenied, setAccessDenied] = useState<'not_found' | 'private' | null>(null)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user])

  useEffect(() => {
    console.log('Moodboard page debug:', { params_id: params.id, user: !!user, profile: !!profile, profile_id: profile?.id })
    if (params.id && user && profile) {
      fetchMoodboard()
    } else if (params.id && user && !profile) {
      console.warn('User authenticated but profile not loaded')
    }
  }, [params.id, user, profile])

  const fetchMoodboard = async () => {
    try {
      setLoading(true)
      console.log('Fetching moodboard:', params.id)

      // Try to fetch with RLS
      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()

      console.log('Moodboard fetch result:', { data, error })

      if (error) throw error

      // If data returned, show it
      if (data) {
        setMoodboard(data)
        setAccessDenied(null)
        setLoading(false)
        return
      }

      // No data returned - could be private or not found
      // Check via public moodboard fetch (only public ones are visible to all)
      const { data: publicCheck } = await supabase
        .from('moodboards')
        .select('id, is_public')
        .eq('id', params.id)
        .eq('is_public', true)
        .maybeSingle()

      // If it exists as public, shouldn't happen (RLS should have returned it)
      // Otherwise, assume it's private or doesn't exist
      setAccessDenied('private')
      setLoading(false)
    } catch (error) {
      console.error('Error fetching moodboard:', error)
      setAccessDenied('not_found')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this moodboard? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      const { error } = await supabase
        .from('moodboards')
        .delete()
        .eq('id', params.id)

      if (error) throw error
      router.push('/moodboards')
    } catch (error) {
      console.error('Error deleting moodboard:', error)
      alert('Failed to delete moodboard')
      setDeleting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view moodboards</h2>
          <Button onClick={() => router.push('/auth/login')}>Log In</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (accessDenied === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Moodboard Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This moodboard doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/moodboards')}>Back to Moodboards</Button>
        </div>
      </div>
    )
  }

  if (accessDenied === 'private') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Private Moodboard</h2>
          <p className="text-muted-foreground mb-6">
            This moodboard is private. Only the owner can view it.
          </p>
          <Button onClick={() => router.push('/moodboards')}>Back to Moodboards</Button>
        </div>
      </div>
    )
  }

  if (!moodboard) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/moodboards')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="border-l border-border h-8"></div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {moodboard.title || 'Untitled Moodboard'}
                </h1>
                {moodboard.summary && (
                  <p className="text-sm text-muted-foreground">{moodboard.summary}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Only show edit/delete if user owns this moodboard */}
              {profile && moodboard.owner_user_id === profile.id && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/moodboards/${params.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </>
              )}
              {!moodboard.is_public && profile && moodboard.owner_user_id === profile.id && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Private</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MoodboardViewer gigId={moodboard.gig_id || moodboard.id} />
      </div>
    </div>
  )
}
