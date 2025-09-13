'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'

// Style/vibe tags available for users
const STYLE_TAGS = [
  'Portrait', 'Fashion', 'Beauty', 'Editorial', 'Commercial', 'Lifestyle',
  'Wedding', 'Event', 'Street', 'Conceptual', 'Fine Art', 'Documentary',
  'Product', 'Architecture', 'Landscape', 'Travel', 'Cinematic', 'Moody',
  'Bright', 'Minimalist', 'Vintage', 'Modern', 'Creative', 'Professional'
]

export default function CreateProfilePage() {
  const [formData, setFormData] = useState({
    displayName: '',
    handle: '',
    bio: '',
    city: '',
    role: '',
    styleTags: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  const handleStyleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      styleTags: prev.styleTags.includes(tag)
        ? prev.styleTags.filter(t => t !== tag)
        : [...prev.styleTags, tag]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Create user profile in database
      if (!supabase) {
        setError('Database service not available')
        return
      }
      const { error } = await supabase
        .from('users_profile')
        .insert({
          user_id: user.id,
          display_name: formData.displayName,
          handle: formData.handle,
          bio: formData.bio || null,
          city: formData.city || null,
          role_flags: [formData.role],
          style_tags: formData.styleTags,
          subscription_tier: 'FREE'
        })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Create Your Profile</h1>
          <p className="mt-2 text-gray-600">Tell us about yourself and your creative style</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">I am a...</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="relative">
                <input
                  type="radio"
                  value="CONTRIBUTOR"
                  checked={formData.role === 'CONTRIBUTOR'}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="sr-only"
                  required
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.role === 'CONTRIBUTOR'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <h4 className="font-semibold text-gray-900">Contributor</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Post gigs and hire talent for shoots
                  </p>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  value="TALENT"
                  checked={formData.role === 'TALENT'}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="sr-only"
                  required
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.role === 'TALENT'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <h4 className="font-semibold text-gray-900">Talent</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Apply to gigs and collaborate on shoots
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name *
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
                Handle *
              </label>
              <input
                id="handle"
                type="text"
                required
                value={formData.handle}
                onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="username"
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Where you're based"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Tell others about your creative style and experience..."
            />
          </div>

          {/* Style Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Your Style & Interests</h3>
            <p className="text-xs text-gray-500 mb-4">Select tags that describe your creative style (max 8)</p>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleStyleTagToggle(tag)}
                  disabled={!formData.styleTags.includes(tag) && formData.styleTags.length >= 8}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.styleTags.includes(tag)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}