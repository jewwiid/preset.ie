'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { supabase } from '../../../../lib/supabase'
import MoodboardBuilder from '../../../components/MoodboardBuilder'

type CompType = 'TFP' | 'PAID' | 'EXPENSES' | 'OTHER'
type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'
type StatusType = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'COMPLETED'

interface GigDetails {
  id: string
  title: string
  description: string
  purpose?: PurposeType
  comp_type: CompType
  usage_rights: string
  location_text: string
  start_time: string
  end_time: string
  application_deadline: string
  max_applicants: number
  status: StatusType
  owner_user_id: string
}

export default function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const resolvedParams = use(params)
  const gigId = resolvedParams.id
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [applicationCount, setApplicationCount] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState<PurposeType>('PORTFOLIO')
  const [compType, setCompType] = useState<CompType>('TFP')
  const [usageRights, setUsageRights] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [applicationDeadline, setApplicationDeadline] = useState('')
  const [maxApplicants, setMaxApplicants] = useState(10)
  const [status, setStatus] = useState<StatusType>('DRAFT')
  const [moodboardId, setMoodboardId] = useState<string | null>(null)
  
  // Warnings
  const [warnings, setWarnings] = useState<string[]>([])
  
  useEffect(() => {
    if (user) {
      fetchGigDetails()
    } else {
      router.push('/auth/signin')
    }
  }, [gigId, user])
  
  const fetchGigDetails = async () => {
    try {
      // Get gig details
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', gigId)
        .single()
      
      if (gigError) throw gigError
      
      // Check if user is the owner
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user!.id)
        .single()
      
      if (!profile || profile.id !== gig.owner_user_id) {
        setError('You are not authorized to edit this gig')
        setIsOwner(false)
        return
      }
      
      setIsOwner(true)
      
      // Get application count
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gigId)
      
      setApplicationCount(count || 0)
      
      // Fetch existing moodboard
      const { data: moodboard } = await supabase
        .from('moodboards')
        .select('id')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (moodboard) {
        setMoodboardId(moodboard.id)
      }
      
      // Populate form fields
      setTitle(gig.title)
      setDescription(gig.description || '')
      setPurpose(gig.purpose || 'PORTFOLIO')
      setCompType(gig.comp_type)
      setUsageRights(gig.usage_rights || '')
      setLocation(gig.location_text || '')
      setStatus(gig.status)
      setMaxApplicants(gig.max_applicants || 10)
      
      // Format dates for input fields
      if (gig.start_time) {
        setStartDate(new Date(gig.start_time).toISOString().slice(0, 16))
      }
      if (gig.end_time) {
        setEndDate(new Date(gig.end_time).toISOString().slice(0, 16))
      }
      if (gig.application_deadline) {
        setApplicationDeadline(new Date(gig.application_deadline).toISOString().slice(0, 16))
      }
      
      // Check for warnings
      const newWarnings = []
      const now = new Date()
      const deadline = new Date(gig.application_deadline)
      
      if (deadline < now && applicationCount > 0) {
        newWarnings.push(`Applications are closed (deadline was ${deadline.toLocaleDateString()}). ${applicationCount} applications received.`)
      }
      
      if (gig.status === 'PUBLISHED' && applicationCount > 0) {
        newWarnings.push(`This gig has ${applicationCount} active applications. Changes will affect all applicants.`)
      }
      
      setWarnings(newWarnings)
      
    } catch (err: any) {
      console.error('Error fetching gig:', err)
      setError(err.message || 'Failed to load gig')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOwner) {
      setError('You are not authorized to edit this gig')
      return
    }
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Validate dates
      const startDateTime = new Date(startDate)
      const endDateTime = new Date(endDate)
      const deadlineDateTime = new Date(applicationDeadline)
      
      if (endDateTime <= startDateTime) {
        setError('End time must be after start time')
        setSaving(false)
        return
      }
      
      if (deadlineDateTime >= startDateTime) {
        setError('Application deadline must be before the gig starts')
        setSaving(false)
        return
      }
      
      // Check if we're extending the deadline after it has passed
      const now = new Date()
      const originalDeadline = new Date(applicationDeadline)
      
      if (originalDeadline < now && deadlineDateTime > now && applicationCount > 0) {
        if (!confirm(`You're reopening applications after the deadline has passed. This will allow new applications. Continue?`)) {
          setSaving(false)
          return
        }
      }
      
      // Update the gig
      const { error: updateError } = await supabase
        .from('gigs')
        .update({
          title,
          description,
          purpose,
          comp_type: compType,
          usage_rights: usageRights,
          location_text: location,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          application_deadline: deadlineDateTime.toISOString(),
          max_applicants: maxApplicants,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', gigId)
      
      if (updateError) throw updateError
      
      setSuccess('Gig updated successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/gigs/${gigId}`)
      }, 1500)
      
    } catch (err: any) {
      console.error('Error updating gig:', err)
      setError(err.message || 'Failed to update gig')
      setSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
      return
    }
    
    if (applicationCount > 0) {
      if (!confirm(`This gig has ${applicationCount} applications. Deleting it will remove all applications. Continue?`)) {
        return
      }
    }
    
    try {
      setSaving(true)
      
      const { error: deleteError } = await supabase
        .from('gigs')
        .delete()
        .eq('id', gigId)
      
      if (deleteError) throw deleteError
      
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error deleting gig:', err)
      setError(err.message || 'Failed to delete gig')
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }
  
  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h2>
          <p className="text-gray-600 mb-4">{error || 'You cannot edit this gig.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Gig</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status}
              </span>
              {applicationCount > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {applicationCount} applications
                </span>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Important:</strong>
                    </p>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            
            {/* Purpose and Compensation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
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
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            {/* Usage Rights and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Schedule</h3>
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                  Application Deadline *
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  required
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be before the gig start time
                </p>
              </div>
            </div>
            
            {/* Status and Max Applicants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusType)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CLOSED">Closed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Only published gigs are visible to talent
                </p>
              </div>
              
              <div>
                <label htmlFor="max-applicants" className="block text-sm font-medium text-gray-700">
                  Max Applicants
                </label>
                <input
                  type="number"
                  id="max-applicants"
                  min="1"
                  max="100"
                  value={maxApplicants}
                  onChange={(e) => setMaxApplicants(parseInt(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Current applications: {applicationCount}
                </p>
              </div>
            </div>
            
            {/* Moodboard Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Moodboard</h3>
              <MoodboardBuilder 
                gigId={gigId}
                moodboardId={moodboardId || undefined}
                onSave={(newMoodboardId) => setMoodboardId(newMoodboardId)}
              />
            </div>
            
            {/* Submit Buttons */}
            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/gigs/${gigId}`)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Gig
                </button>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}