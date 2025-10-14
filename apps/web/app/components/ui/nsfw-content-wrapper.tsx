'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Shield, AlertTriangle, User, Calendar } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { useAuth } from '../../../lib/auth-context'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface NSFWContentWrapperProps {
  children: React.ReactNode
  contentId: string
  contentType: 'playground_gallery' | 'media' | 'enhancement_tasks' | 'user_type' | 'suggested_type'
  isNsfw: boolean
  className?: string
  onContentAccess?: (action: 'view' | 'unblur' | 'blur' | 'blocked') => void
}

interface NSFWAccessStatus {
  can_view_nsfw: boolean
  should_blur: boolean
  age_verified: boolean
  nsfw_consent_given: boolean
  show_nsfw_content: boolean
  user_age: number | null
  needs_age_verification: boolean
  needs_nsfw_consent: boolean
  needs_nsfw_toggle: boolean
}

export function NSFWContentWrapper({
  children,
  contentId,
  contentType,
  isNsfw,
  className = '',
  onContentAccess
}: NSFWContentWrapperProps) {
  const { session } = useAuth()
  const [accessStatus, setAccessStatus] = useState<NSFWAccessStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [isUnblurring, setIsUnblurring] = useState(false)

  useEffect(() => {
    if (isNsfw && session?.access_token) {
      checkNSFWAccess()
    } else {
      setLoading(false)
    }
  }, [isNsfw, session?.access_token, contentId])

  const checkNSFWAccess = async () => {
    try {
      const response = await fetch('/api/user/nsfw-consent', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const status = await response.json()
        setAccessStatus(status)
        setShowContent(status.can_view_nsfw)
      }
    } catch (error) {
      console.error('Failed to check NSFW access:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblur = async () => {
    if (!session?.access_token) return

    setIsUnblurring(true)
    try {
      if (accessStatus?.needs_age_verification) {
        // Redirect to age verification
        window.location.href = '/settings/age-verification'
        return
      }

      if (accessStatus?.needs_nsfw_consent) {
        // Give NSFW consent
        const response = await fetch('/api/user/nsfw-consent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'give_consent' })
        })

        if (response.ok) {
          await checkNSFWAccess()
          onContentAccess?.('unblur')
        } else {
          const error = await response.json()
          if (error.needs_age_verification) {
            window.location.href = '/settings/age-verification'
          }
        }
      } else if (accessStatus?.needs_nsfw_toggle) {
        // Toggle NSFW content visibility
        const response = await fetch('/api/user/nsfw-consent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'toggle_nsfw',
            show_nsfw_content: true
          })
        })

        if (response.ok) {
          await checkNSFWAccess()
          onContentAccess?.('unblur')
        }
      }
    } catch (error) {
      console.error('Failed to unblur content:', error)
    } finally {
      setIsUnblurring(false)
    }
  }

  const handleBlur = () => {
    setShowContent(false)
    onContentAccess?.('blur')
  }

  // If not NSFW content, show normally
  if (!isNsfw) {
    return <div className={className}>{children}</div>
  }

  // If loading, show placeholder
  if (loading) {
    return (
      <div className={`${className} relative`}>
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Checking content access...</p>
          </div>
        </div>
        <div className="opacity-30">
          {children}
        </div>
      </div>
    )
  }

  // If user can view NSFW content and it's unblurred, show normally
  if (accessStatus?.can_view_nsfw && showContent) {
    return (
      <div className={className}>
        {children}
        {accessStatus?.can_view_nsfw && (
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              NSFW Content
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBlur}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Hide
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Show blurred content with unblur options
  return (
    <div className={`${className} relative`}>
      {/* Blurred content */}
      <div className="relative">
        <div className="filter blur-md pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-black/20 rounded-lg" />
      </div>

      {/* Unblur overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="max-w-sm mx-4 bg-background/95 backdrop-blur-sm border-2 border-destructive/20">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">NSFW Content</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This content may contain adult material. You must be 18 or older to view.
              </p>
            </div>

            <div className="space-y-3">
              {accessStatus?.needs_age_verification && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Age verification required</span>
                </div>
              )}

              {accessStatus?.needs_nsfw_consent && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>NSFW consent required</span>
                </div>
              )}

              {accessStatus?.user_age && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Age: {accessStatus.user_age} years</span>
                </div>
              )}

              <Button
                onClick={handleUnblur}
                disabled={isUnblurring}
                className="w-full"
                variant={accessStatus?.needs_age_verification ? "default" : "destructive"}
              >
                {isUnblurring ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : accessStatus?.needs_age_verification ? (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Verify Age
                  </>
                ) : accessStatus?.needs_nsfw_consent ? (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    I'm 18+ - Show Content
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show NSFW Content
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                By clicking above, you confirm you are 18 or older and consent to viewing adult content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
