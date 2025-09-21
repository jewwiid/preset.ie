'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, CheckCircle, AlertTriangle, Save, Eye, MapPin, Calendar, FileText, Users, DollarSign, Image, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  applicantPreferences?: any
  
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
  applicantPreferences,
  onStatusChange,
  onBack,
  onSave,
  saving,
  applicationCount = 0,
  warnings = []
}: ReviewPublishStepProps) {
  const [moodboardData, setMoodboardData] = useState<MoodboardData | null>(null)
  const [loadingMoodboard, setLoadingMoodboard] = useState(false)

  // Helper function to summarize preferences
  const getPreferencesSummary = () => {
    if (!applicantPreferences) return null
    
    const summary = []
    
    // Physical preferences
    if (applicantPreferences.physical?.height_range?.min || applicantPreferences.physical?.height_range?.max) {
      const min = applicantPreferences.physical.height_range.min
      const max = applicantPreferences.physical.height_range.max
      if (min && max) {
        summary.push(`Height: ${min}-${max}cm`)
      } else if (min) {
        summary.push(`Height: ${min}cm+`)
      } else if (max) {
        summary.push(`Height: up to ${max}cm`)
      }
    }
    
    if (applicantPreferences.physical?.eye_color?.preferred?.length > 0) {
      summary.push(`Eye colors: ${applicantPreferences.physical.eye_color.preferred.join(', ')}`)
    }
    
    if (applicantPreferences.physical?.hair_color?.preferred?.length > 0) {
      summary.push(`Hair colors: ${applicantPreferences.physical.hair_color.preferred.join(', ')}`)
    }
    
    // Professional preferences
    if (applicantPreferences.professional?.experience_years?.min) {
      summary.push(`Experience: ${applicantPreferences.professional.experience_years.min}+ years`)
    }
    
    if (applicantPreferences.professional?.specializations?.required?.length > 0) {
      const specs = applicantPreferences.professional.specializations.required
      summary.push(`Required skills: ${specs.slice(0, 3).join(', ')}${specs.length > 3 ? ` (+${specs.length - 3} more)` : ''}`)
    }
    
    if (applicantPreferences.professional?.equipment?.required?.length > 0) {
      const equipment = applicantPreferences.professional.equipment.required
      summary.push(`Required equipment: ${equipment.slice(0, 2).join(', ')}${equipment.length > 2 ? ` (+${equipment.length - 2} more)` : ''}`)
    }
    
    if (applicantPreferences.professional?.languages?.required?.length > 0) {
      summary.push(`Languages: ${applicantPreferences.professional.languages.required.join(', ')}`)
    }
    
    // Availability preferences
    if (applicantPreferences.availability?.travel_required) {
      summary.push('Travel required')
    }
    
    if (applicantPreferences.availability?.hourly_rate_range?.min || applicantPreferences.availability?.hourly_rate_range?.max) {
      const min = applicantPreferences.availability.hourly_rate_range.min
      const max = applicantPreferences.availability.hourly_rate_range.max
      if (min && max) {
        summary.push(`Budget: €${min}-${max}/hr`)
      } else if (min) {
        summary.push(`Budget: €${min}+/hr`)
      } else if (max) {
        summary.push(`Budget: up to €${max}/hr`)
      }
    }
    
    // Age range
    if (applicantPreferences.other?.age_range?.min || applicantPreferences.other?.age_range?.max) {
      const min = applicantPreferences.other.age_range.min
      const max = applicantPreferences.other.age_range.max
      if (min && max) {
        summary.push(`Age: ${min}-${max}`)
      } else if (min) {
        summary.push(`Age: ${min}+`)
      } else if (max) {
        summary.push(`Age: up to ${max}`)
      }
    }
    
    return summary.length > 0 ? summary : null
  }

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
      if (!supabase) {
        console.error('Supabase client not available')
        setLoadingMoodboard(false)
        return
      }

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
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">Important Notes:</h3>
              <ul className="text-sm text-yellow-600/80 dark:text-yellow-400/80 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Review & Publish</h2>
              <p className="text-muted-foreground text-sm">Review your gig details before saving</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Visual Moodboard (Featured) */}
            <div className="lg:col-span-2 order-1">
              {loadingMoodboard ? (
                <div className="bg-muted rounded-xl p-8 animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square bg-muted rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ) : moodboardData && moodboardData.items?.length > 0 ? (
                <div className="bg-gradient-to-br from-muted/50 to-card rounded-xl border border-border shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Image className="w-5 h-5 text-primary" />
                        Visual Moodboard
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {moodboardData.title} • {moodboardData.items.length} images
                      </p>
                    </div>
                  </div>
                  
                  {/* Large Moodboard Grid */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {moodboardData.items.map((item, index) => (
                        <div key={item.id} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg bg-muted border border-border shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="bg-card rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium text-foreground">Color Palette</h4>
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
                              <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap border border-border shadow-md">
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
                <div className="bg-muted rounded-xl border-2 border-dashed border-border p-12 text-center">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Visual Moodboard</h3>
                  <p className="text-muted-foreground text-sm">
                    {moodboardId ? "This gig doesn't have any moodboard images yet." : "No moodboard has been created for this gig."}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Gig Details */}
            <div className="space-y-4 order-2">
              
              {/* Gig Title Card */}
              <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                <h3 className="font-semibold text-foreground text-lg mb-2 leading-tight">
                  {title}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      purpose === 'COMMERCIAL' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                      purpose === 'PORTFOLIO' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      purpose === 'FASHION' ? 'bg-primary/10 text-primary' :
                      purpose === 'BEAUTY' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {formatPurpose(purpose)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      compType === 'PAID' ? 'bg-primary/10 text-primary' :
                      compType === 'TFP' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {formatCompType(compType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Calendar className="w-4 h-4" />
                  Schedule & Location
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                  <div className="text-xs space-y-1 pl-5">
                    <div><span className="font-medium">Shoot:</span> {formatDate(startDate)} - {formatDate(endDate)}</div>
                    <div><span className="font-medium">Apply by:</span> {formatDate(applicationDeadline)}</div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Users className="w-4 h-4" />
                  Requirements
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div><span className="font-medium text-foreground">Usage:</span> {usageRights}</div>
                  <div><span className="font-medium text-foreground">Max Applicants:</span> {maxApplicants}</div>
                  {compDetails && (
                    <div><span className="font-medium text-foreground">Compensation:</span> {compDetails}</div>
                  )}
                  {safetyNotes && (
                    <div><span className="font-medium text-foreground">Safety Notes:</span> {safetyNotes}</div>
                  )}
                  {applicationCount > 0 && (
                      <div className="text-blue-600 dark:text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded">
                      <span className="font-medium">Current: {applicationCount} applications</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Applicant Preferences */}
              {getPreferencesSummary() && (
                <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                    <Users className="w-4 h-4" />
                    Applicant Preferences
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {getPreferencesSummary()?.map((preference, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span>{preference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <FileText className="w-4 h-4" />
                  Description
                </h4>
                <div className="text-sm text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
                  {description}
                </div>
              </div>

              {/* Publication Status */}
              <div className="bg-card rounded-lg border border-border shadow-sm p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Eye className="w-4 h-4" />
                  Publication Status
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center p-2 border border-border rounded cursor-pointer hover:bg-muted">
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
                      <div className="text-xs text-muted-foreground">Private, not visible to talent</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-2 border border-border rounded cursor-pointer hover:bg-muted">
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
                      <div className="text-xs text-muted-foreground">Live and accepting applications</div>
                    </div>
                  </label>
                  
                  {applicationCount > 0 && (
                    <>
                      <label className="flex items-center p-2 border border-border rounded cursor-pointer hover:bg-muted">
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
                          <div className="text-xs text-muted-foreground">No longer accepting</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-2 border border-border rounded cursor-pointer hover:bg-muted">
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
                          <div className="text-xs text-muted-foreground">Shoot finished</div>
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
        <div className="flex justify-between p-6 border-t border-border bg-muted rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={saving}
            size="lg"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Moodboard
          </Button>
          
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            size="lg"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}