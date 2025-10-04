'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface ProfileData {
  handle: string
  display_name: string
  bio?: string
  city?: string
}

export default function EditProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData>({
    handle: '',
    display_name: '',
    bio: '',
    city: ''
  })
  const [newHandle, setNewHandle] = useState('')
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [checkingHandle, setCheckingHandle] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.handle) {
      setProfile({
        handle: user.user_metadata.handle,
        display_name: user.user_metadata.display_name || '',
        bio: user.user_metadata.bio || '',
        city: user.user_metadata.city || ''
      })
      setNewHandle(user.user_metadata.handle)
      setLoading(false)
    }
  }, [user])

  const checkHandleAvailability = async (handle: string) => {
    if (!handle || handle === profile.handle) {
      setHandleAvailable(null)
      return
    }

    setCheckingHandle(true)
    try {
      const response = await fetch(`/api/users/${handle}/redirect`, {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        setHandleAvailable(!data.redirect && data.current_handle === handle)
      } else {
        setHandleAvailable(false)
      }
    } catch (error) {
      console.error('Error checking handle availability:', error)
      setHandleAvailable(false)
    } finally {
      setCheckingHandle(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newHandle) {
        checkHandleAvailability(newHandle)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [newHandle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const response = await fetch(`/api/users/${profile.handle}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_handle: newHandle !== profile.handle ? newHandle : undefined,
          display_name: profile.display_name,
          bio: profile.bio,
          city: profile.city
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        
        // If handle changed, redirect to new profile URL
        if (data.redirect_needed && data.profile?.handle) {
          setTimeout(() => {
            router.push(`/users/${data.profile.handle}`)
          }, 2000)
        }
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Profile update error:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your profile information and handle
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  placeholder="Your display name"
                  required
                />
              </div>

              {/* Handle */}
              <div>
                <Label htmlFor="handle">Handle (Username)</Label>
                <div className="relative">
                  <Input
                    id="handle"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value.toLowerCase())}
                    placeholder="your_handle"
                    pattern="[a-z0-9_]{3,30}"
                    required
                  />
                  {checkingHandle && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {newHandle && !checkingHandle && handleAvailable !== null && (
                    <div className="absolute right-3 top-3">
                      {handleAvailable ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  3-30 characters, lowercase letters, numbers, and underscores only
                </p>
                {newHandle && !checkingHandle && handleAvailable === false && (
                  <p className="text-sm text-red-500 mt-1">
                    This handle is already taken
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Your city"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving || checkingHandle || handleAvailable === false}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Handle Change Notice */}
        {newHandle !== profile.handle && (
          <Card className="mt-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">Handle Change Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 text-sm">
                Changing your handle from <code className="bg-amber-100 px-1 rounded">@{profile.handle}</code> to <code className="bg-amber-100 px-1 rounded">@{newHandle}</code> will:
              </p>
              <ul className="text-amber-700 text-sm mt-2 list-disc list-inside space-y-1">
                <li>Create a permanent redirect from your old handle to the new one</li>
                <li>Update your profile URL to the new handle</li>
                <li>Preserve all existing links and bookmarks (they will redirect automatically)</li>
                <li>Maintain your SEO rankings and search engine visibility</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
