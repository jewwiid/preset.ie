'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Shield, CheckCircle, AlertTriangle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '../../../lib/auth-context'

interface AgeVerificationStatus {
  age_verified: boolean
  age_verified_at: string | null
  account_status: string
  verification_method: string | null
  date_of_birth: string | null
  calculated_age: number | null
  nsfw_consent_given: boolean
  nsfw_consent_given_at: string | null
  show_nsfw_content: boolean
  blur_nsfw_content: boolean
  can_view_nsfw: boolean
}

export default function AgeVerificationPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<AgeVerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.access_token) {
      fetchAgeVerificationStatus()
    }
  }, [session?.access_token])

  const fetchAgeVerificationStatus = async () => {
    try {
      const response = await fetch('/api/user/age-verification', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        if (data.date_of_birth) {
          setDateOfBirth(data.date_of_birth)
        }
      }
    } catch (error) {
      console.error('Failed to fetch age verification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgeVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateOfBirth) {
      setError('Please enter your date of birth')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/user/age-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
          verification_method: 'self_attestation'
        })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchAgeVerificationStatus()
      } else {
        setError(data.error || 'Failed to verify age')
      }
    } catch (error) {
      console.error('Age verification error:', error)
      setError('An error occurred during verification')
    } finally {
      setVerifying(false)
    }
  }

  const handleNSFWConsent = async () => {
    try {
      const response = await fetch('/api/user/nsfw-consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'give_consent' })
      })

      if (response.ok) {
        await fetchAgeVerificationStatus()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to give NSFW consent')
      }
    } catch (error) {
      console.error('NSFW consent error:', error)
      setError('An error occurred')
    }
  }

  const handleNSFWToggle = async (show: boolean) => {
    try {
      const response = await fetch('/api/user/nsfw-consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'toggle_nsfw',
          show_nsfw_content: show
        })
      })

      if (response.ok) {
        await fetchAgeVerificationStatus()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update NSFW preferences')
      }
    } catch (error) {
      console.error('NSFW toggle error:', error)
      setError('An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading age verification status...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Age Verification & NSFW Content</h1>
          <p className="text-muted-foreground mt-2">
            Manage your age verification and NSFW content preferences
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Age Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Age Verification
            </CardTitle>
            <CardDescription>
              Verify your age to access age-restricted content and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.age_verified ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Age Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p>{status.date_of_birth ? new Date(status.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age</Label>
                    <p>{status.calculated_age ? `${status.calculated_age} years old` : 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Verified On</Label>
                    <p>{status.age_verified_at ? new Date(status.age_verified_at).toLocaleDateString() : 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Method</Label>
                    <p className="capitalize">{status.verification_method?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAgeVerification} className="space-y-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You must be 18 or older to verify your age
                  </p>
                </div>
                <Button type="submit" disabled={verifying} className="w-full">
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Verify Age
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* NSFW Content Preferences */}
        {status?.age_verified && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                NSFW Content Preferences
              </CardTitle>
              <CardDescription>
                Control how NSFW (Not Safe For Work) content is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!status.nsfw_consent_given ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">NSFW Consent Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    To view NSFW content, you must first give your consent. This confirms you are 18 or older 
                    and understand that such content may be inappropriate for some audiences.
                  </p>
                  <Button onClick={handleNSFWConsent} variant="destructive" className="w-full">
                    <Shield className="w-4 h-4 mr-2" />
                    I'm 18+ - Give NSFW Consent
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">NSFW Consent Given</span>
                    <Badge variant="secondary" className="ml-auto">
                      {new Date(status.nsfw_consent_given_at!).toLocaleDateString()}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Show NSFW Content</Label>
                        <p className="text-sm text-muted-foreground">
                          Display NSFW content without blurring
                        </p>
                      </div>
                      <Button
                        variant={status.show_nsfw_content ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleNSFWToggle(!status.show_nsfw_content)}
                      >
                        {status.show_nsfw_content ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Blur NSFW Content</Label>
                        <p className="text-sm text-muted-foreground">
                          Blur NSFW content by default (recommended)
                        </p>
                      </div>
                      <Button
                        variant={status.blur_nsfw_content ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleNSFWToggle(!status.blur_nsfw_content)}
                      >
                        {status.blur_nsfw_content ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Current Status:</strong> NSFW content is{' '}
                      {status.show_nsfw_content ? 'visible' : 'hidden'} and{' '}
                      {status.blur_nsfw_content ? 'blurred by default' : 'not blurred'}.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge 
                variant={status?.account_status === 'age_verified' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {status?.account_status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              {status?.can_view_nsfw && (
                <Badge variant="destructive">NSFW Access</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={() => router.push('/settings')}>
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
