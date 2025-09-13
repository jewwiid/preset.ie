'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, CheckCircle, AlertTriangle, Save, Eye, MapPin, Calendar, FileText, Users, DollarSign, Image, Palette } from 'lucide-react'
import { StatusType, CompType, PurposeType } from '../../../lib/gig-form-persistence'
import { supabase } from '../../../lib/supabase'

interface MoodboardItem {
  id: string
  url: string
  thumbnail_url?: string
}

interface MoodboardData {
  id: string
  title: string
  description: string
  items: MoodboardItem[]
  color_palette: string[]
}

interface ReviewPublishStepProps {
  // Form data for review
  title: string
  description: string
  purpose: PurposeType
  compType: CompType
  compDetails?: string
  location: string
  startDate: string
  endDate: string
  applicationDeadline: string
  usageRights: string
  maxApplicants: number
  safetyNotes?: string
  status: StatusType
  moodboardId?: string
  
  // State and handlers
  onStatusChange: (value: StatusType) => void
  onBack: () => void
  onSave: () => void
  saving: boolean
  applicationCount?: number
  warnings?: string[]
}

export default function ReviewPublishStep({
  title,
  description,
  purpose,
  compType,
  compDetails,
  location,
  startDate,
  endDate,
  applicationDeadline,
  usageRights,
  maxApplicants,
  safetyNotes,
  status,
  moodboardId,
  onStatusChange,
  onBack,
  onSave,
  saving,
  applicationCount = 0,
  warnings = []
}: ReviewPublishStepProps) {
  const [moodboardData, setMoodboardData] = useState<MoodboardData | null>(null)
  const [loadingMoodboard, setLoadingMoodboard] = useState(false)

  // Fetch moodboard data
  useEffect(() => {
    if (moodboardId) {
      fetchMoodboardData()
    }
  }, [moodboardId])

  const fetchMoodboardData = async () => {
    if (!moodboardId) return
    
    setLoadingMoodboard(true)
    try {
      // Get moodboard details including items stored as JSON
      const { data: moodboard, error: moodboardError } = await supabase
        .from('moodboards')
        .select('id, title, summary, items, palette')
        .eq('id', moodboardId)
        .single()

      if (moodboardError) throw moodboardError

      setMoodboardData({
        id: moodboard.id,
        title: moodboard.title || 'Untitled Moodboard',
        description: moodboard.summary || '',
        items: moodboard.items || [],
        color_palette: moodboard.palette || []
      })
    } catch (err) {
      console.error('Error fetching moodboard:', err)
    } finally {
      setLoadingMoodboard(false)
    }
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatPurpose = (purpose: PurposeType) => {
    const purposeMap: Record<PurposeType, string> = {
      PORTFOLIO: 'Portfolio Building',
      COMMERCIAL: 'Commercial',
      EDITORIAL: 'Editorial',
      FASHION: 'Fashion',
      BEAUTY: 'Beauty',
      LIFESTYLE: 'Lifestyle',
      WEDDING: 'Wedding',
      EVENT: 'Event',
      PRODUCT: 'Product',
      ARCHITECTURE: 'Architecture',
      STREET: 'Street',
      CONCEPTUAL: 'Conceptual',
      OTHER: 'Other'
    }
    return purposeMap[purpose]
  }

  const formatCompType = (compType: CompType) => {
    const compMap: Record<CompType, string> = {
      TFP: 'TFP (Time for Prints/Portfolio)',
      PAID: 'Paid',
      EXPENSES: 'Expenses Covered',
      OTHER: 'Other'
    }
    return compMap[compType]
  }

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-2">Important Notes:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Review & Publish</h2>
              <p className="text-gray-600 text-sm">Review your gig details before saving</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Visual Moodboard (Featured) */}
            <div className="lg:col-span-2 order-1">
              {loadingMoodboard ? (
                <div className="bg-gray-100 rounded-xl p-8 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : moodboardData && moodboardData.items?.length > 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Image className="w-5 h-5 text-emerald-600" />
                        Visual Moodboard
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {moodboardData.title} • {moodboardData.items.length} images
                      </p>
                    </div>
                  </div>
                  
                  {/* Large Moodboard Grid */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {moodboardData.items.map((item, index) => (
                        <div key={item.id} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <img
                              src={item.thumbnail_url || item.url}
                              alt={`Moodboard item ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/proxy-image?url=' + encodeURIComponent(item.url);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Palette */}
                  {moodboardData.color_palette.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-gray-600" />
                        <h4 className="text-sm font-medium text-gray-900">Color Palette</h4>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {moodboardData.color_palette.map((color, index) => (
                          <div key={index} className="group relative">
                            <div
                              className="w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {color}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Visual Moodboard</h3>
                  <p className="text-gray-600 text-sm">
                    {moodboardId ? "This gig doesn't have any moodboard images yet." : "No moodboard has been created for this gig."}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Gig Details */}
            <div className="space-y-4 order-2">
              
              {/* Gig Title Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight">
                  {title}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      purpose === 'COMMERCIAL' ? 'bg-purple-100 text-purple-800' :
                      purpose === 'PORTFOLIO' ? 'bg-blue-100 text-blue-800' :
                      purpose === 'FASHION' ? 'bg-pink-100 text-pink-800' :
                      purpose === 'BEAUTY' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatPurpose(purpose)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      compType === 'PAID' ? 'bg-green-100 text-green-800' :
                      compType === 'TFP' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatCompType(compType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                  <Calendar className="w-4 h-4" />
                  Schedule & Location
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 mt-0.5 text-gray-400" />
                    <span>{location}</span>
                  </div>
                  <div className="text-xs space-y-1 pl-5">
                    <div><span className="font-medium">Shoot:</span> {formatDate(startDate)} - {formatDate(endDate)}</div>
                    <div><span className="font-medium">Apply by:</span> {formatDate(applicationDeadline)}</div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                  <Users className="w-4 h-4" />
                  Requirements
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div><span className="font-medium text-gray-900">Usage:</span> {usageRights}</div>
                  <div><span className="font-medium text-gray-900">Max Applicants:</span> {maxApplicants}</div>
                  {compDetails && (
                    <div><span className="font-medium text-gray-900">Compensation:</span> {compDetails}</div>
                  )}
                  {safetyNotes && (
                    <div><span className="font-medium text-gray-900">Safety Notes:</span> {safetyNotes}</div>
                  )}
                  {applicationCount > 0 && (
                    <div className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded">
                      <span className="font-medium">Current: {applicationCount} applications</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                  <FileText className="w-4 h-4" />
                  Description
                </h4>
                <div className="text-sm text-gray-600 leading-relaxed max-h-32 overflow-y-auto">
                  {description}
                </div>
              </div>

              {/* Publication Status */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                  <Eye className="w-4 h-4" />
                  Publication Status
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value="DRAFT"
                      checked={status === 'DRAFT'}
                      onChange={(e) => onStatusChange(e.target.value as StatusType)}
                      className="mr-2"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Draft</div>
                      <div className="text-xs text-gray-500">Private, not visible to talent</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value="PUBLISHED"
                      checked={status === 'PUBLISHED'}
                      onChange={(e) => onStatusChange(e.target.value as StatusType)}
                      className="mr-2"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Published</div>
                      <div className="text-xs text-gray-500">Live and accepting applications</div>
                    </div>
                  </label>
                  
                  {applicationCount > 0 && (
                    <>
                      <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="status"
                          value="CLOSED"
                          checked={status === 'CLOSED'}
                          onChange={(e) => onStatusChange(e.target.value as StatusType)}
                          className="mr-2"
                        />
                        <div className="text-sm">
                          <div className="font-medium">Closed</div>
                          <div className="text-xs text-gray-500">No longer accepting</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="status"
                          value="COMPLETED"
                          checked={status === 'COMPLETED'}
                          onChange={(e) => onStatusChange(e.target.value as StatusType)}
                          className="mr-2"
                        />
                        <div className="text-sm">
                          <div className="font-medium">Completed</div>
                          <div className="text-xs text-gray-500">Shoot finished</div>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Moodboard
          </button>
          
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}