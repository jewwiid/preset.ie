'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import LocationPicker from '../../../components/location-picker'
import type { ParsedLocation } from '../../../lib/location-service'
import { uploadProfilePhoto, compressImage, fileToDataUrl } from '../../../lib/storage'

// Style/vibe tags available for users
const STYLE_TAGS = [
  'Portrait', 'Fashion', 'Beauty', 'Editorial', 'Commercial', 'Lifestyle',
  'Wedding', 'Event', 'Street', 'Conceptual', 'Fine Art', 'Documentary',
  'Product', 'Architecture', 'Landscape', 'Travel', 'Cinematic', 'Moody',
  'Bright', 'Minimalist', 'Vintage', 'Modern', 'Creative', 'Professional'
]

export default function CreateProfilePage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    handle: '',
    bio: '',
    city: '',
    role: '',
    styleTags: [] as string[]
  })
  const [parsedLocation, setParsedLocation] = useState<ParsedLocation | null>(null)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Auto-generate display name from first and last name
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim()
      setFormData(prev => ({ ...prev, displayName }))
    }
  }, [formData.firstName, formData.lastName])

  // Handle location selection
  const handleLocationChange = (location: string, parsed?: ParsedLocation) => {
    setFormData(prev => ({ ...prev, city: location }))
    setParsedLocation(parsed || null)
  }

  // Handle profile picture upload
  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      setError('Image must be less than 5MB')
      return
    }

    setUploadingPicture(true)
    setError(null)

    try {
      // Compress image if needed
      const compressedFile = await compressImage(file, 800, 0.85)
      
      // Create preview
      const preview = await fileToDataUrl(compressedFile)
      setProfilePicturePreview(preview)
      setProfilePicture(compressedFile)
    } catch (error) {
      console.error('Error processing image:', error)
      setError('Failed to process image')
    } finally {
      setUploadingPicture(false)
    }
  }

  // Remove profile picture
  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePicturePreview(null)
  }

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
      // Upload profile picture if provided
      let avatarUrl = null
      if (profilePicture && user) {
        avatarUrl = await uploadProfilePhoto(profilePicture, user.id)
        if (!avatarUrl) {
          setError('Failed to upload profile picture')
          setLoading(false)
          return
        }
      }

      const { error } = await supabase
        .from('users_profile')
        .insert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          display_name: formData.displayName,
          handle: formData.handle,
          bio: formData.bio || null,
          city: formData.city || null,
          country: parsedLocation?.country || null,
          avatar_url: avatarUrl,
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
                    ? 'border-primary-500 bg-primary-50'
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
                    ? 'border-primary-500 bg-primary-50'
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

          {/* Profile Picture */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Picture
            </label>
            <div className="flex items-start space-x-4">
              {/* Preview */}
              <div className="flex-shrink-0">
                {profilePicturePreview ? (
                  <div className="relative">
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="profilePicture"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPicture ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {profilePicture ? 'Change Photo' : 'Upload Photo'}
                      </>
                    )}
                  </label>
                  
                  {profilePicture && (
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  disabled={uploadingPicture}
                />
                
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG, or WebP. Max 5MB. Recommended: 400x400px or larger.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Your first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Your last name"
              />
            </div>
          </div>

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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Your full name"
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from first and last name</p>
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="username"
              />
              <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <LocationPicker
              value={formData.city}
              onChange={handleLocationChange}
              placeholder="Where you're based"
              className="mt-1"
              showCurrentLocation={true}
            />
            {parsedLocation && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {parsedLocation.city}, {parsedLocation.country}
                {parsedLocation.lat && parsedLocation.lng && (
                  <span className="ml-2">
                    ({parsedLocation.lat.toFixed(4)}, {parsedLocation.lng.toFixed(4)})
                  </span>
                )}
              </p>
            )}
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
                      ? 'bg-primary-100 text-primary-800 border border-primary/30'
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}