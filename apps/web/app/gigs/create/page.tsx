'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import MoodboardBuilder from '../../components/MoodboardBuilder'

type CompType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER'
type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'

export default function CreateGigPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Basic gig details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState<PurposeType>('PORTFOLIO')
  const [compType, setCompType] = useState<CompType>('TFP')
  const [usageRights, setUsageRights] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showMoodboard, setShowMoodboard] = useState(false)
  const [moodboardId, setMoodboardId] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a gig')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // First, get the user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (profileError || !profile) {
        throw new Error('Profile not found. Please complete your profile first.')
      }
      
      // Convert dates to ISO strings
      const startDateTime = startDate ? new Date(startDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const endDateTime = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString()
      
      // Calculate application deadline - must be BEFORE the start time (constraint: valid_deadline)
      // Default to 2 days before the shoot starts
      const startTime = new Date(startDateTime)
      const applicationDeadline = new Date(startTime.getTime() - (2 * 24 * 60 * 60 * 1000)).toISOString()
      
      // Validate dates
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setError('End time must be after start time')
        setLoading(false)
        return
      }
      
      // Build the gig object with purpose field
      const gigData: any = {
          owner_user_id: profile.id,  // Use profile ID, not auth user ID
          title,
          description,
          purpose, // Now include the purpose field
          comp_type: compType,
          usage_rights: usageRights || 'Portfolio use only',
          start_time: startDateTime,
          end_time: endDateTime,
          status: 'DRAFT',
          location_text: location || 'Location TBD',
          application_deadline: applicationDeadline, // 2 days before start
          max_applicants: 10
      };
      
      const { data, error: insertError } = await supabase
        .from('gigs')
        .insert(gigData)
        .select()
        .single()
      
      if (insertError) {
        console.error('Insert error details:', insertError)
        throw insertError
      }
      
      // Redirect to the gig detail page
      router.push(`/gigs/${data.id}`)
    } catch (err: any) {
      console.error('Error creating gig:', err)
      const errorMessage = err?.message || err?.details || 'Failed to create gig'
      setError(errorMessage)
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Gig</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Gig Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., Fashion Editorial Shoot in Dublin"
              />
              <p className="mt-1 text-sm text-gray-500">
                Make it clear and appealing - this is what talent will see first
              </p>
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Describe the shoot concept, what you're looking for, and what makes this opportunity special..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Be specific about the creative vision and what you hope to achieve
              </p>
            </div>
            
            {/* Purpose */}
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                Purpose of Shoot *
              </label>
              <select
                id="purpose"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as PurposeType)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="PORTFOLIO">Portfolio Building</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="EDITORIAL">Editorial</option>
                <option value="FASHION">Fashion</option>
                <option value="BEAUTY">Beauty</option>
                <option value="LIFESTYLE">Lifestyle</option>
                <option value="WEDDING">Wedding</option>
                <option value="EVENT">Event</option>
                <option value="PRODUCT">Product</option>
                <option value="ARCHITECTURE">Architecture</option>
                <option value="STREET">Street</option>
                <option value="CONCEPTUAL">Conceptual</option>
                <option value="OTHER">Other</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Let talent know what type of shoot this is
              </p>
            </div>
            
            {/* Compensation Type */}
            <div>
              <label htmlFor="comp-type" className="block text-sm font-medium text-gray-700">
                Compensation Type *
              </label>
              <select
                id="comp-type"
                value={compType}
                onChange={(e) => setCompType(e.target.value as CompType)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="TFP">TFP (Time for Prints/Portfolio)</option>
                <option value="PAID">Paid</option>
                <option value="EXPENSES">Expenses Covered</option>
                <option value="OTHER">Other (specify in description)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Be transparent about compensation to attract the right talent
              </p>
            </div>
            
            {/* Usage Rights */}
            <div>
              <label htmlFor="usage-rights" className="block text-sm font-medium text-gray-700">
                Usage Rights *
              </label>
              <input
                type="text"
                id="usage-rights"
                required
                value={usageRights}
                onChange={(e) => setUsageRights(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., Portfolio use only, Commercial use, Social media"
              />
              <p className="mt-1 text-sm text-gray-500">
                Specify how the content can be used by both parties
              </p>
            </div>
            
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Shoot Location *
              </label>
              <input
                type="text"
                id="location"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., Dublin City Center, Phoenix Park, Studio in Temple Bar"
              />
              <p className="mt-1 text-sm text-gray-500">
                Where will the shoot take place?
              </p>
            </div>
            
            {/* Date Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Shoot Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Start Date/Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="start-date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    When the shoot begins
                  </p>
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                    End Date/Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="end-date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().slice(0, 16)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Must be after start time
                  </p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">📅 Application deadline:</span> Applications will automatically close 2 days before the shoot starts to give you time to review and prepare.
                </p>
              </div>
            </div>
            
            {/* Moodboard Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Inspiration</h3>
              {!showMoodboard && !moodboardId ? (
                <button
                  type="button"
                  onClick={() => setShowMoodboard(true)}
                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  + Add Moodboard (Optional)
                </button>
              ) : showMoodboard ? (
                <MoodboardBuilder
                  onSave={(id) => {
                    setMoodboardId(id)
                    setShowMoodboard(false)
                  }}
                  onCancel={() => setShowMoodboard(false)}
                />
              ) : (
                <div className="p-4 bg-emerald-50 rounded-md">
                  <p className="text-emerald-800">
                    ✅ Moodboard added
                    <button
                      type="button"
                      onClick={() => setShowMoodboard(true)}
                      className="ml-2 text-emerald-600 underline"
                    >
                      Edit
                    </button>
                  </p>
                </div>
              )}
            </div>
            
            {/* Submit Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Gig'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}