'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { CheckCircle, XCircle, Clock, Eye, Shield, AlertTriangle, ExternalLink, X } from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Types
interface VerificationRequest {
  id: string
  user_id: string
  verification_type: string
  status: string
  document_urls: string[]
  document_types?: string[]
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
  metadata?: VerificationMetadata
  user_profile?: UserProfile
}

interface VerificationMetadata {
  document_url?: string
  documents?: Array<{
    path: string
    type: string
    bucket: string
  }>
  social_links?: {
    instagram?: string
    linkedin?: string
    tiktok?: string
    portfolio?: string
  }
  professional_info?: {
    years_experience?: number
    license_number?: string
    specializations?: string[]
    references_contact?: string
  }
  business_info?: {
    business_name?: string
    website?: string
    registration_number?: string
    business_address?: string
    business_type?: string
    tax_id?: string
  }
  contact_info?: {
    phone?: string
    alternative_email?: string
  }
}

interface UserProfile {
  display_name: string
  handle: string
  avatar_url?: string
}

type FilterType = 'pending' | 'approved' | 'rejected' | 'all'
type StatusType = 'pending' | 'approved' | 'rejected'

// Sub-components
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { icon: Clock, text: 'Pending', className: 'bg-accent/10 text-accent-foreground' },
    approved: { icon: CheckCircle, text: 'Approved', className: 'bg-primary/10 text-primary' },
    rejected: { icon: XCircle, text: 'Rejected', className: 'bg-destructive/10 text-destructive' }}

  const { icon: Icon, text, className } = config[status as StatusType] || config.pending

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  )
}

const TypeBadge = ({ type }: { type: string }) => {
  const types: Record<string, { label: string; className: string }> = {
    identity: { label: 'Identity & Age', className: 'bg-primary/10 text-primary' },
    professional: { label: 'Professional', className: 'bg-primary/10 text-primary' },
    business: { label: 'Business', className: 'bg-accent/10 text-accent-foreground' },
    age: { label: 'Age (Legacy)', className: 'bg-muted text-muted-foreground' }}

  const info = types[type] || { label: type.toUpperCase(), className: 'bg-muted text-muted-foreground' }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  )
}

const UserAvatar = ({ user, size = 'md' }: { user?: UserProfile; size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' }
  const sizeClass = sizes[size]
  const initial = (user?.display_name || 'U').charAt(0).toUpperCase()

  if (user?.avatar_url) {
    return (
      <img
        className={`${sizeClass} rounded-full object-cover border-2 border-border`}
        src={user.avatar_url}
        alt={user.display_name || 'User avatar'}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = `<div class="${sizeClass} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium border-2 border-border">${initial}</div>`
          }
        }}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-muted text-muted-foreground flex items-center justify-center font-medium border-2 border-border`}>
      {initial}
    </div>
  )
}

const DocumentViewer = ({ verification }: { verification: VerificationRequest }) => {
  const getDocumentPaths = (): string[] => {
    if (verification.document_urls && verification.document_urls.length > 0) {
      return verification.document_urls
    }
    if (verification.metadata?.document_url) {
      return [verification.metadata.document_url]
    }
    if (verification.metadata?.documents) {
      return verification.metadata.documents
        .map((doc) => doc.path)
        .filter((path) => path && path.trim() !== '')
    }
    if (verification.user_id && verification.verification_type) {
      return [`${verification.user_id}/${verification.verification_type}`]
    }
    return []
  }

  const paths = getDocumentPaths()

  if (paths.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No documents available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {paths.map((path, index) => {
        const { data: publicUrl } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(path.trim())

        const isPdf = verification.document_types?.[index]?.includes('pdf') || path.toLowerCase().includes('.pdf')

        return (
          <div key={index} className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <h4 className="text-sm font-medium text-foreground">Document {index + 1}</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {verification.document_types?.[index] || 'Unknown'}
              </span>
            </div>

            <div className="p-4">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center h-48 bg-muted/20 rounded border-2 border-dashed border-border">
                  <svg className="w-12 h-12 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-muted-foreground mb-3">PDF Document</p>
                  <a
                    href={publicUrl.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 underline"
                  >
                    Open PDF <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="relative group">
                  <img
                    src={publicUrl.publicUrl}
                    alt={`Document ${index + 1}`}
                    className="w-full h-64 object-contain rounded border border-border bg-muted/20"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const container = target.parentElement
                      if (container) {
                        container.innerHTML = `
                          <div class="flex flex-col items-center justify-center h-64 bg-muted/20 rounded border-2 border-dashed border-border">
                            <svg class="w-12 h-12 text-muted-foreground mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                            </svg>
                            <p class="text-sm text-muted-foreground mb-2">Document not accessible</p>
                            <a href="${publicUrl.publicUrl}" target="_blank" rel="noopener noreferrer" class="text-xs text-primary hover:text-primary/80 underline inline-flex items-center gap-1">
                              Try opening directly <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            </a>
                          </div>
                        `
                      }
                    }}
                  />
                  <a
                    href={publicUrl.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-background transition-colors opacity-0 group-hover:opacity-100 inline-flex items-center gap-1"
                  >
                    Full Size <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const MetadataSection = ({ verification }: { verification: VerificationRequest }) => {
  const { metadata } = verification
  if (!metadata) return null

  return (
    <div className="space-y-4">
      {/* Social Links */}
      {metadata.social_links && Object.values(metadata.social_links).some(v => v) && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Social Media</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(metadata.social_links).map(([platform, url]) =>
              url ? (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-background rounded hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-xs font-medium text-muted-foreground capitalize w-20">{platform}:</span>
                  <span className="text-xs text-primary group-hover:text-primary/80 truncate flex-1">{url}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Professional Info */}
      {metadata.professional_info && verification.verification_type === 'professional' && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Professional Information</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metadata.professional_info.years_experience && (
              <div>
                <dt className="text-xs text-muted-foreground">Experience</dt>
                <dd className="text-sm text-foreground font-medium">{metadata.professional_info.years_experience} years</dd>
              </div>
            )}
            {metadata.professional_info.license_number && (
              <div>
                <dt className="text-xs text-muted-foreground">License Number</dt>
                <dd className="text-sm text-foreground font-medium">{metadata.professional_info.license_number}</dd>
              </div>
            )}
            {metadata.professional_info.specializations && (
              <div className="md:col-span-2">
                <dt className="text-xs text-muted-foreground mb-1">Specializations</dt>
                <dd className="flex flex-wrap gap-1">
                  {metadata.professional_info.specializations.map((spec, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{spec}</span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Business Info */}
      {metadata.business_info && verification.verification_type === 'business' && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Business Information</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(metadata.business_info).map(([key, value]) =>
              value ? (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                  <dd className="text-sm text-foreground font-medium">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      )}

      {/* Contact Info */}
      {metadata.contact_info && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Contact Information</h4>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metadata.contact_info.phone && (
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="text-sm text-foreground font-medium">{metadata.contact_info.phone}</dd>
              </div>
            )}
            {metadata.contact_info.alternative_email && (
              <div>
                <dt className="text-xs text-muted-foreground">Alternative Email</dt>
                <dd className="text-sm text-foreground font-medium">{metadata.contact_info.alternative_email}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}

// Main Component
export function VerificationQueue() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('verification_requests')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        // Fetch user profiles with error handling
        const userIds = data.map(v => v.user_id).filter(id => id) // Filter out null/undefined IDs

        let profiles: any[] = []
        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('users_profile')
            .select('user_id, display_name, handle, avatar_url')
            .in('user_id', userIds)

          if (!profileError && profileData) {
            profiles = profileData
          } else {
            console.warn('Failed to fetch user profiles:', profileError)
          }
        }

        const verificationsWithProfiles = data.map(verification => ({
          ...verification,
          user_profile: profiles.find(p => p.user_id === verification.user_id) || {
            display_name: 'Unknown User',
            handle: 'unknown',
            avatar_url: null
          }
        }))

        setVerifications(verificationsWithProfiles)
      }
    } catch (error) {
      console.error('Error fetching verifications:', error)
      setActionMessage({ type: 'error', message: 'Failed to load verifications. Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchVerifications()
  }, [fetchVerifications])

  const deleteVerificationDocuments = async (verification: VerificationRequest) => {
    try {
      console.log('Deleting verification documents for GDPR compliance...')
      
      let documentsDeleted = 0
      let documentsFailed = 0

      // Handle multiple data structures for document deletion
      let documentPaths: string[] = []
      
      // Old system: document_urls array
      if (verification.document_urls && verification.document_urls.length > 0) {
        documentPaths = verification.document_urls
      }
      // New system: metadata.document_url string
      else if (verification.metadata?.document_url) {
        documentPaths = [verification.metadata.document_url]
      }
      // New system: metadata.documents array with paths
      else if (verification.metadata?.documents) {
        documentPaths = verification.metadata.documents
          .map((doc: any) => doc.path)
          .filter((path: string) => path && path.trim() !== '')
      }
      // Fallback: construct path from user_id and verification_type
      else if (verification.user_id && verification.verification_type) {
        documentPaths = [`${verification.user_id}/${verification.verification_type}`]
      }
      
      for (const documentPath of documentPaths) {
        try {
          // Extract the path from the full URL if needed
          const path = documentPath.includes('verification-documents/')
            ? documentPath.split('verification-documents/')[1]
            : documentPath

          const { error: deleteError } = await supabase.storage
            .from('verification-documents')
            .remove([path])

          if (deleteError) {
            console.error('Error deleting document:', deleteError)
            documentsFailed++
          } else {
            console.log('Successfully deleted document:', path)
            documentsDeleted++
          }
        } catch (deleteErr) {
          console.error('Error in document deletion:', deleteErr)
          documentsFailed++
        }
      }

      if (documentsFailed > 0) {
        console.warn(`Failed to delete ${documentsFailed} documents. ${documentsDeleted} documents deleted successfully.`)
      } else {
        console.log(`Successfully deleted ${documentsDeleted} verification documents.`)
      }
    } catch (error) {
      console.error('Error in document deletion process:', error)
    }
  }

  const updateVerificationStatus = async (id: string, status: StatusType, reason?: string) => {
    try {
      // Get current admin user for tracking
      const { data: { user: admin } } = await supabase.auth.getUser()

      const updates: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin?.id || null}

      if (reason) {
        updates.rejection_reason = reason
      }

      const { error } = await supabase
        .from('verification_requests')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Update verified status in user_profiles and award badge
      const verification = verifications.find(v => v.id === id)
      if (verification && status === 'approved') {
        // Get current admin user
        const { data: { user: admin } } = await supabase.auth.getUser()

        // Update user profile
        await supabase
          .from('users_profile')
          .update({
            verified: true,
            [`${verification.verification_type}_verified`]: true
          })
          .eq('user_id', verification.user_id)

        // Award verification badge
        const badgeTypeMap: Record<string, string> = {
          'age': 'verified_identity',
          'identity': 'verified_identity',
          'professional': 'verified_professional',
          'business': 'verified_business'
        }

        const badgeType = badgeTypeMap[verification.verification_type] || 'verified_identity'

        // Revoke any existing badge of the same type
        if (admin) {
          await supabase
            .from('verification_badges')
            .update({
              revoked_at: new Date().toISOString(),
              revoked_by: admin.id,
              revoke_reason: 'Superseded by new verification'
            })
            .eq('user_id', verification.user_id)
            .eq('badge_type', badgeType)
            .is('revoked_at', null)
        }

        // Issue new badge
        await supabase
          .from('verification_badges')
          .insert({
            user_id: verification.user_id,
            badge_type: badgeType,
            verification_request_id: id,
            issued_by: admin?.id,
            issued_at: new Date().toISOString(),
            expires_at: null
          })

        // GDPR Compliance: Delete verification documents after approval
        await deleteVerificationDocuments(verification)
      }

      const userName = verification?.user_profile?.display_name || 'User'
      const verificationType = verification?.verification_type || 'verification'
      const message = status === 'approved' 
        ? `✅ ${userName}'s ${verificationType} verification approved! Badge awarded and documents deleted for GDPR compliance.`
        : `❌ ${userName}'s ${verificationType} verification rejected.`

      setActionMessage({
        type: status === 'approved' ? 'success' : 'error',
        message
      })

      await fetchVerifications()
      setSelectedVerification(null)
    } catch (error) {
      console.error('Error updating verification:', error)
      setActionMessage({ type: 'error', message: 'Failed to update verification. Please try again.' })
    }
  }

  const handleReject = (verification: VerificationRequest) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason && reason.trim()) {
      updateVerificationStatus(verification.id, 'rejected', reason)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading verifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {actionMessage && (
        <div className={`rounded-lg border p-4 ${
          actionMessage.type === 'success'
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{actionMessage.message}</p>
            <button
              onClick={() => setActionMessage(null)}
              className="text-current hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Verifications Grid */}
      {verifications.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} verification requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <UserAvatar user={verification.user_profile} size="lg" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {verification.user_profile?.display_name || 'Unknown User'}
                      </h3>
                      <StatusBadge status={verification.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      @{verification.user_profile?.handle || 'unknown'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <TypeBadge type={verification.verification_type} />
                      <span>•</span>
                      <span>{new Date(verification.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedVerification(verification)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {verification.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateVerificationStatus(verification.id, 'approved')}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(verification)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Verification Review</h2>
                  <p className="text-sm text-muted-foreground">Review verification details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVerification(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* User Info */}
              <div className="bg-muted/30 rounded-lg p-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">User Information</p>
                <div className="flex items-center gap-6">
                  <UserAvatar user={selectedVerification.user_profile} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground mb-1">
                          {selectedVerification.user_profile?.display_name || 'Unknown User'}
                        </h3>
                        <p className="text-muted-foreground">
                          @{selectedVerification.user_profile?.handle || 'unknown'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <StatusBadge status={selectedVerification.status} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Type</p>
                          <TypeBadge type={selectedVerification.verification_type} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(selectedVerification.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedVerification.reviewed_at && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Reviewed</p>
                            <p className="text-sm font-medium text-foreground">
                              {new Date(selectedVerification.reviewed_at).toLocaleDateString()}
                            </p>
                            {selectedVerification.reviewed_by && (
                              <p className="text-xs text-muted-foreground">
                                by Admin
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents and Metadata Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Documents */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Verification Documents</h3>
                  <DocumentViewer verification={selectedVerification} />
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Additional Information</h3>
                  <MetadataSection verification={selectedVerification} />
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedVerification.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Rejection Reason</p>
                  <p className="text-sm text-destructive">{selectedVerification.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6">
              {selectedVerification.status === 'pending' ? (
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => setSelectedVerification(null)}
                    className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleReject(selectedVerification)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject Verification</span>
                  </button>
                  <button
                    onClick={() => updateVerificationStatus(selectedVerification.id, 'approved')}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve Verification</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-2 py-2">
                    <StatusBadge status={selectedVerification.status} />
                  </div>
                  <button
                    onClick={() => setSelectedVerification(null)}
                    className="w-full px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
