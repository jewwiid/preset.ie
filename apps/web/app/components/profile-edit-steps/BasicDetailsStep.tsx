'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { ProfileFormData } from '@/lib/profile-validation'
import { validateHandleFormat, validateHandleAvailability } from '@/lib/profile-validation'

// Countries list (inline for now)
const COUNTRIES = [
  { code: 'IE', name: 'Ireland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DK', name: 'Denmark' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' }
]

interface BasicDetailsStepProps {
  formData: ProfileFormData
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>
}

export default function BasicDetailsStep({
  formData,
  setFormData
}: BasicDetailsStepProps) {
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [checkingHandle, setCheckingHandle] = useState(false)
  const [handleError, setHandleError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Check handle availability when it changes
  useEffect(() => {
    // Guard clause: ensure formData exists and has a handle property
    if (!formData || !formData.handle || typeof formData.handle !== 'string') {
      setHandleAvailable(null)
      setHandleError(null)
      return
    }

    const handle = formData.handle // Capture for type safety

    const checkHandle = async () => {
      if (handle.length < 3) {
        setHandleAvailable(null)
        setHandleError(null)
        return
      }

      if (!validateHandleFormat(handle)) {
        setHandleAvailable(false)
        setHandleError('Handle must be 3-30 characters, lowercase letters, numbers, and underscores only')
        return
      }

      setCheckingHandle(true)
      setHandleError(null)

      try {
        const isAvailable = await validateHandleAvailability(handle, handle) // Current handle is same as new
        setHandleAvailable(isAvailable)
        if (!isAvailable) {
          setHandleError('This handle is already taken')
        }
      } catch (error) {
        console.error('Error checking handle availability:', error)
        setHandleAvailable(false)
        setHandleError('Error checking handle availability')
      } finally {
        setCheckingHandle(false)
      }
    }

    const timeoutId = setTimeout(checkHandle, 500)
    return () => clearTimeout(timeoutId)
  }, [formData?.handle])

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  // Validation is handled by parent component

  // Guard clause: don't render until formData is defined
  if (!formData) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Tell us about yourself and set up your profile identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Display Name and Handle - 2 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name || ''}
                onChange={(e) => handleFieldChange('display_name', e.target.value)}
                placeholder="Your display name"
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is how your name appears on your profile
              </p>
            </div>

            <div>
              <Label htmlFor="handle">Handle (Username) *</Label>
              <div className="relative mt-1">
                <Input
                  id="handle"
                  value={formData.handle || ''}
                  onChange={(e) => handleFieldChange('handle', e.target.value.toLowerCase())}
                  placeholder="your_handle"
                  pattern="[a-z0-9_]{3,30}"
                  required
                  className="pr-10"
                />
                <div className="absolute right-3 top-3">
                  {checkingHandle ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : handleAvailable === true ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : handleAvailable === false ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                3-30 characters, lowercase letters, numbers, and underscores only
              </p>
              {handleError && (
                <p className="text-xs text-red-500 mt-1">{handleError}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleFieldChange('bio', e.target.value)}
              placeholder="Tell us about yourself, your experience, and what makes you unique..."
              rows={4}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.bio?.length || 0}/1000 characters
            </p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                placeholder="Your city"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country || ''}
                onValueChange={(value) => handleFieldChange('country', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation handled by parent component */}
    </div>
  )
}
