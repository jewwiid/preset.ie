'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileFormData } from '@/lib/profile-validation'
import { useAuth } from '@/lib/auth-context'

interface ReviewStepProps {
  data: ProfileFormData
  onSave: () => void
  onPrevious?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
  saving?: boolean
}

export default function ReviewStep({
  data,
  onSave,
  onPrevious,
  isFirstStep = false,
  isLastStep = true,
  saving = false
}: ReviewStepProps) {
  const { userRole } = useAuth()
  const isContributor = userRole?.isContributor
  const isTalent = userRole?.isTalent

  const formatArray = (arr: string[] | undefined) => {
    if (!arr || arr.length === 0) return 'None specified'
    return arr.join(', ')
  }

  const formatBoolean = (value: boolean | undefined) => {
    return value ? 'Yes' : 'No'
  }

  const formatRate = () => {
    if (data.hourly_rate_min && data.hourly_rate_max) {
      return `€${data.hourly_rate_min} - €${data.hourly_rate_max}/hr`
    } else if (data.hourly_rate_min) {
      return `From €${data.hourly_rate_min}/hr`
    } else if (data.hourly_rate_max) {
      return `Up to €${data.hourly_rate_max}/hr`
    }
    return 'Not specified'
  }

  const formatAvailability = (status: string | undefined) => {
    if (!status) return 'Not specified'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Profile</CardTitle>
          <CardDescription>
            Please review all the information below before saving your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Display Name:</span>
                <p className="font-medium">{data.display_name || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Handle:</span>
                <p className="font-medium">@{data.handle || 'Not specified'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-muted-foreground">Bio:</span>
                <p className="font-medium">{data.bio || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">City:</span>
                <p className="font-medium">{data.city || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Country:</span>
                <p className="font-medium">{data.country || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Years of Experience:</span>
                <p className="font-medium">{data.years_experience || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Experience Level:</span>
                <p className="font-medium">{(data.experience_level || 'beginner').charAt(0).toUpperCase() + (data.experience_level || 'beginner').slice(1)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Languages:</span>
                <p className="font-medium">{formatArray(data.languages)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Specializations:</span>
                <p className="font-medium">{formatArray(data.specializations)}</p>
              </div>
            </div>

            {/* Contributor-specific fields */}
            {isContributor && (
              <div className="mt-4 space-y-2">
                <div>
                  <span className="font-medium text-muted-foreground">Equipment:</span>
                  <p className="font-medium">{formatArray(data.equipment_list)}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Editing Software:</span>
                  <p className="font-medium">{formatArray(data.editing_software)}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Professional Skills:</span>
                  <p className="font-medium">{formatArray(data.professional_skills)}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Contributor Roles:</span>
                  <p className="font-medium">{formatArray(data.contributor_roles)}</p>
                </div>
              </div>
            )}

            {/* Talent-specific fields */}
            {isTalent && (
              <div className="mt-4">
                <div>
                  <span className="font-medium text-muted-foreground">Talent Categories:</span>
                  <p className="font-medium">{formatArray(data.talent_categories)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Instagram:</span>
                <p className="font-medium">{data.instagram_handle ? `@${data.instagram_handle}` : 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">TikTok:</span>
                <p className="font-medium">{data.tiktok_handle ? `@${data.tiktok_handle}` : 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Website:</span>
                <p className="font-medium">{data.website_url || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Portfolio:</span>
                <p className="font-medium">{data.portfolio_url || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Behance:</span>
                <p className="font-medium">{data.behance_url || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Dribbble:</span>
                <p className="font-medium">{data.dribbble_url || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Phone:</span>
                <p className="font-medium">{data.phone_number || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Availability & Rates */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Availability & Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Availability Status:</span>
                <p className="font-medium">{formatAvailability(data.availability_status)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Hourly Rates:</span>
                <p className="font-medium">{formatRate()}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Available for Travel:</span>
                <p className="font-medium">{formatBoolean(data.available_for_travel)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Travel Radius:</span>
                <p className="font-medium">{data.travel_radius_km ? `${data.travel_radius_km} km` : 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Has Studio:</span>
                <p className="font-medium">{formatBoolean(data.has_studio)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Studio Name:</span>
                <p className="font-medium">{data.studio_name || 'Not specified'}</p>
              </div>
            </div>

            {/* Work Preferences */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Work Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {data.accepts_tfp && <Badge variant="secondary">Accepts TFP</Badge>}
                {data.accepts_expenses_only && <Badge variant="secondary">Expenses Only</Badge>}
                {data.allow_direct_booking && <Badge variant="secondary">Direct Booking</Badge>}
                {data.available_weekdays && <Badge variant="secondary">Weekdays</Badge>}
                {data.available_weekends && <Badge variant="secondary">Weekends</Badge>}
                {data.available_evenings && <Badge variant="secondary">Evenings</Badge>}
                {data.available_overnight && <Badge variant="secondary">Overnight</Badge>}
              </div>
            </div>
          </div>

          {/* Privacy Settings Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Privacy Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Show Experience:</span>
                <p className="font-medium">{formatBoolean(data.show_experience)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Specializations:</span>
                <p className="font-medium">{formatBoolean(data.show_specializations)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Equipment:</span>
                <p className="font-medium">{formatBoolean(data.show_equipment)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Social Links:</span>
                <p className="font-medium">{formatBoolean(data.show_social_links)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Website:</span>
                <p className="font-medium">{formatBoolean(data.show_website)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Phone:</span>
                <p className="font-medium">{formatBoolean(data.show_phone)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Rates:</span>
                <p className="font-medium">{formatBoolean(data.show_rates)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Show Availability:</span>
                <p className="font-medium">{formatBoolean(data.show_availability)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {!isFirstStep && onPrevious && (
            <Button variant="outline" onClick={onPrevious} disabled={saving}>
              Previous
            </Button>
          )}
        </div>
        <div>
          <Button onClick={onSave} disabled={saving} className="ml-auto">
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
