'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import LocationPicker from '../../../components/location-picker'
import type { ParsedLocation } from '../../../lib/location-service'
import { uploadProfilePhoto, compressImage, fileToDataUrl } from '../../../lib/storage'
import { RoleIndicator } from '../../../components/auth/RoleIndicator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

// Tag categories for better organization
const TAG_CATEGORIES = {
  photography: 'Photography',
  videography: 'Videography', 
  makeup: 'Makeup',
  styling: 'Styling',
  aesthetic: 'Aesthetic',
  mood: 'Mood',
  atmosphere: 'Atmosphere',
  energy: 'Energy'
} as const

// Comprehensive style and vibe tags (will be fetched from database)
const COMPREHENSIVE_STYLE_TAGS = [
  // Photography Styles
  'Portrait', 'Fashion', 'Editorial', 'Commercial', 'Lifestyle', 'Wedding', 'Event', 
  'Product', 'Architecture', 'Street', 'Conceptual', 'Fine Art', 'Documentary', 
  'Sports', 'Nature',
  // Videography Styles  
  'Cinematic', 'Music Video', 'Short Film', 'Corporate', 'Social Media', 'Live Streaming',
  // Makeup Styles
  'Natural', 'Glamour', 'Bridal', 'Special Effects', 'Character', 'Avant-garde',
  // Styling Styles
  'Costume', 'Contemporary',
  // General Aesthetic Styles
  'Moody', 'Bright', 'Minimalist', 'Vintage', 'Modern', 'Creative', 'Professional', 
  'Beauty', 'Travel', 'Landscape'
]

const COMPREHENSIVE_VIBE_TAGS = [
  // Mood Categories
  'Elegant', 'Edgy', 'Romantic', 'Playful', 'Mysterious', 'Confident', 'Vulnerable', 
  'Powerful', 'Gentle', 'Bold',
  // Atmosphere Categories
  'Urban', 'Natural', 'Industrial', 'Luxury', 'Minimalist', 'Vintage', 'Modern', 
  'Rustic', 'Futuristic', 'Bohemian',
  // Energy Categories
  'High Energy', 'Calm', 'Dynamic', 'Serene', 'Intense', 'Relaxed', 'Passionate', 'Peaceful'
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
    styleTags: [] as string[],
    vibeTags: [] as string[]
  })
  const [parsedLocation, setParsedLocation] = useState<ParsedLocation | null>(null)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [checkingHandle, setCheckingHandle] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Pre-fill form data for Google OAuth users
  useEffect(() => {
    if (user && user.user_metadata) {
      const metadata = user.user_metadata
      const isGoogleUser = user.app_metadata?.provider === 'google'
      
        if (isGoogleUser && metadata) {
          // Get stored role from Google OAuth flow
          const storedRole = sessionStorage.getItem('preset_signup_role') as 'CONTRIBUTOR' | 'TALENT' | 'BOTH' | null
          
          setFormData(prev => ({
            ...prev,
            firstName: metadata.given_name || metadata.first_name || '',
            lastName: metadata.family_name || metadata.last_name || '',
            displayName: metadata.full_name || metadata.name || '',
            handle: metadata.preferred_username || 
                    (metadata.given_name ? metadata.given_name.toLowerCase() : '') +
                    (metadata.family_name ? metadata.family_name.toLowerCase() : '') ||
                    metadata.email?.split('@')[0] || '',
            role: storedRole || prev.role // Use stored role or keep existing
          }))
          
          // Clear the stored role after using it
          if (storedRole) {
            sessionStorage.removeItem('preset_signup_role')
          }
        }
    }
  }, [user])

  // Auto-generate display name from first and last name
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim()
      setFormData(prev => ({ ...prev, displayName }))
    }
  }, [formData.firstName, formData.lastName])

  // Check handle availability with debouncing
  useEffect(() => {
    if (!formData.handle || formData.handle.length < 3) {
      setHandleAvailable(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      if (!supabase) return
      
      setCheckingHandle(true)
      try {
        const { data: existingProfile, error: checkError } = await (supabase as any)
          .from('users_profile')
          .select('handle')
          .eq('handle', formData.handle)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          setHandleAvailable(null)
          return
        }

        setHandleAvailable(!existingProfile)
      } catch (error) {
        setHandleAvailable(null)
      } finally {
        setCheckingHandle(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [formData.handle])

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

  const handleVibeTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      vibeTags: prev.vibeTags.includes(tag)
        ? prev.vibeTags.filter(t => t !== tag)
        : [...prev.vibeTags, tag]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate role selection
    if (!formData.role || formData.role === '') {
      setError('Please select a role (Contributor, Talent, or Both)')
      return
    }

    // Validate minimum tag requirements
    if (formData.styleTags.length < 3) {
      setError('Please select at least 3 style tags')
      return
    }
    
    if (formData.vibeTags.length < 2) {
      setError('Please select at least 2 vibe tags')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create user profile in database
      if (!supabase) {
        setError('Database service not available')
        return
      }

      // Check if handle is already taken
      const { data: existingProfile, error: checkError } = await (supabase as any)
        .from('users_profile')
        .select('handle')
        .eq('handle', formData.handle)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        setError('Failed to check handle availability')
        setLoading(false)
        return
      }

      if (existingProfile) {
        setError('This handle is already taken. Please choose a different one.')
        setLoading(false)
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

      const { error } = await (supabase as any)
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
          vibe_tags: formData.vibeTags,
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE',
          subscription_started_at: new Date().toISOString(),
          account_status: 'pending_verification'
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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">Create Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Tell us about yourself and your creative style</p>
          
          {/* Show selected role if available */}
          {formData.role && (
            <div className="mt-4 flex justify-center">
              <RoleIndicator role={formData.role as "CONTRIBUTOR" | "TALENT" | "BOTH"} variant="compact" />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-lg shadow border border-border">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">I am a...</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                }`}>
                  <h4 className="font-semibold text-foreground">Contributor</h4>
                  <p className="text-sm text-muted-foreground mt-1">
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
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                }`}>
                  <h4 className="font-semibold text-foreground">Talent</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apply to gigs and collaborate on shoots
                  </p>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  value="BOTH"
                  checked={formData.role === 'BOTH'}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="sr-only"
                  required
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.role === 'BOTH'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                }`}>
                  <h4 className="font-semibold text-foreground">Both</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Post gigs and apply to opportunities
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">
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
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={removeProfilePicture}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPicture ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
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
                      className="text-sm text-muted-foreground hover:text-foreground"
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
                
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG, or WebP. Max 5MB. Recommended: 400x400px or larger.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground"
                placeholder="Your first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground"
                placeholder="Your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
                Display Name *
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground"
                placeholder="Your full name"
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-generated from first and last name</p>
            </div>

            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-foreground">
                Handle *
              </label>
              <div className="relative">
                <input
                  id="handle"
                  type="text"
                  required
                  value={formData.handle}
                  onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  className={`mt-1 block w-full px-3 py-2 bg-background border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground ${
                    handleAvailable === true ? 'border-primary-500' : 
                    handleAvailable === false ? 'border-destructive-500' : 
                    'border-input'
                  }`}
                  placeholder="username"
                />
                {checkingHandle && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
                {!checkingHandle && handleAvailable === true && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {!checkingHandle && handleAvailable === false && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-4 w-4 text-destructive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
                {handleAvailable === true && (
                  <p className="text-xs text-primary-600">✓ Handle is available</p>
                )}
                {handleAvailable === false && (
                  <p className="text-xs text-destructive-600">✗ Handle is already taken</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground">
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
              <p className="text-xs text-muted-foreground mt-1">
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
            <label htmlFor="bio" className="block text-sm font-medium text-foreground">
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input text-foreground placeholder:text-muted-foreground"
              placeholder="Tell others about your creative style and experience..."
            />
          </div>

          {/* Style & Vibe Tags */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Your Style & Interests</h3>
            <p className="text-xs text-muted-foreground mb-4">Select tags that describe your creative style and vibe (min 3 style tags, min 2 vibe tags)</p>
            
            {/* Compact Two-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Style Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground">Creative Styles</h4>
                  <span className="text-xs text-muted-foreground">{formData.styleTags.length}/10</span>
                </div>
                
                {/* Selected Tags Display */}
                {formData.styleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.styleTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/30"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleStyleTagToggle(tag)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Dropdown for adding tags */}
                <Select
                  onValueChange={(value) => {
                    if (value && !formData.styleTags.includes(value)) {
                      handleStyleTagToggle(value)
                    }
                  }}
                  disabled={formData.styleTags.length >= 10}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add style tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPREHENSIVE_STYLE_TAGS
                      .filter(tag => !formData.styleTags.includes(tag))
                      .sort((a, b) => a.localeCompare(b))
                      .map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {formData.styleTags.length < 3 && (
                  <p className="text-xs text-destructive mt-1">
                    Select at least 3 style tags
                  </p>
                )}
              </div>

              {/* Vibe Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground">Vibe & Mood</h4>
                  <span className="text-xs text-muted-foreground">{formData.vibeTags.length}/5</span>
                </div>
                
                {/* Selected Tags Display */}
                {formData.vibeTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.vibeTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent-foreground text-xs rounded-full border border-accent/30"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleVibeTagToggle(tag)}
                          className="hover:bg-accent/20 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Dropdown for adding tags */}
                <Select
                  onValueChange={(value) => {
                    if (value && !formData.vibeTags.includes(value)) {
                      handleVibeTagToggle(value)
                    }
                  }}
                  disabled={formData.vibeTags.length >= 5}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add vibe tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPREHENSIVE_VIBE_TAGS
                      .filter(tag => !formData.vibeTags.includes(tag))
                      .sort((a, b) => a.localeCompare(b))
                      .map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {formData.vibeTags.length < 2 && (
                  <p className="text-xs text-destructive mt-1">
                    Select at least 2 vibe tags
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !formData.role || formData.styleTags.length < 3 || formData.vibeTags.length < 2}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </button>
            {(!formData.role || formData.styleTags.length < 3 || formData.vibeTags.length < 2) && (
              <p className="text-xs text-destructive mt-2 text-center">
                {!formData.role ? 'Select a role to continue' : 'Complete tag selection to continue'}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}