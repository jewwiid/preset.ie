'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { InlinePrivacyToggle } from '@/components/ui/InlinePrivacyToggle'
import { ProfileFormData } from '@/lib/profile-validation'

interface ContactStepProps {
  data: ProfileFormData
  onChange: (data: Partial<ProfileFormData>) => void
  onNext: () => void
  onPrevious?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
}

export default function ContactStep({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirstStep = false,
  isLastStep = false
}: ContactStepProps) {

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    onChange({ [field]: value })
  }

  const handleNext = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Connect your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instagram */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="instagram_handle">Instagram Handle</Label>
              <div className="flex items-center mt-1">
                <span className="text-sm text-muted-foreground mr-2">@</span>
                <Input
                  id="instagram_handle"
                  value={data.instagram_handle || ''}
                  onChange={(e) => handleFieldChange('instagram_handle', e.target.value.replace('@', ''))}
                  placeholder="your_handle"
                  className="flex-1"
                />
              </div>
            </div>
            <InlinePrivacyToggle
              checked={data.show_social_links ?? true}
              onChange={(checked) => handleFieldChange('show_social_links', checked)}
              label="Show social links"
              className="ml-4"
            />
          </div>

          {/* TikTok */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="tiktok_handle">TikTok Handle</Label>
              <div className="flex items-center mt-1">
                <span className="text-sm text-muted-foreground mr-2">@</span>
                <Input
                  id="tiktok_handle"
                  value={data.tiktok_handle || ''}
                  onChange={(e) => handleFieldChange('tiktok_handle', e.target.value.replace('@', ''))}
                  placeholder="your_handle"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Links */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Links</CardTitle>
          <CardDescription>
            Share your professional portfolio and websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Website */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={data.website_url || ''}
                onChange={(e) => handleFieldChange('website_url', e.target.value)}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>
            <InlinePrivacyToggle
              checked={data.show_website ?? true}
              onChange={(checked) => handleFieldChange('show_website', checked)}
              label="Show website"
              className="ml-4"
            />
          </div>

          {/* Portfolio */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input
                id="portfolio_url"
                type="url"
                value={data.portfolio_url || ''}
                onChange={(e) => handleFieldChange('portfolio_url', e.target.value)}
                placeholder="https://yourportfolio.com"
                className="mt-1"
              />
            </div>
          </div>

          {/* Behance */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="behance_url">Behance URL</Label>
              <Input
                id="behance_url"
                type="url"
                value={data.behance_url || ''}
                onChange={(e) => handleFieldChange('behance_url', e.target.value)}
                placeholder="https://behance.net/yourprofile"
                className="mt-1"
              />
            </div>
          </div>

          {/* Dribbble */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="dribbble_url">Dribbble URL</Label>
              <Input
                id="dribbble_url"
                type="url"
                value={data.dribbble_url || ''}
                onChange={(e) => handleFieldChange('dribbble_url', e.target.value)}
                placeholder="https://dribbble.com/yourprofile"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Optional contact details for direct inquiries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone Number */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={data.phone_number || ''}
                onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <InlinePrivacyToggle
                checked={data.show_phone ?? false}
                onChange={(checked) => handleFieldChange('show_phone', checked)}
                label="Show phone"
                tooltip="Allow others to see your phone number on your profile"
              />
              <InlinePrivacyToggle
                checked={data.phone_public ?? false}
                onChange={(checked) => handleFieldChange('phone_public', checked)}
                label="Public contact"
                tooltip="Allow direct contact through phone"
              />
            </div>
          </div>

          {/* Email (read-only, shows current user email) */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={data.email || ''}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email is managed through your account settings
              </p>
            </div>
            <InlinePrivacyToggle
              checked={data.email_public ?? false}
              onChange={(checked) => handleFieldChange('email_public', checked)}
              label="Show email"
              tooltip="Allow others to see your email on your profile"
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {!isFirstStep && onPrevious && (
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          )}
        </div>
        <div>
          <Button onClick={handleNext}>
            {isLastStep ? 'Save Changes' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
