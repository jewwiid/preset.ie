'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { CheckCircle, XCircle, Clock, Eye, Shield, AlertTriangle } from 'lucide-react'

interface VerificationRequest {
  id: string
  user_id: string
  verification_type: string
  status: string
  document_urls: string[]
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
  user_profile?: {
    display_name: string
    handle: string
  }
}

export function VerificationQueue() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null)

  useEffect(() => {
    fetchVerifications()
  }, [filter])

  const fetchVerifications = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      let query = supabase
        .from('verification_requests')
        .select(`
          *,
          user_profile:users_profile(display_name, handle)
        `)
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching verifications:', error)
        setVerifications([])
      } else {
        setVerifications(data || [])
      }
    } catch (error) {
      console.error('Error fetching verifications:', error)
      setVerifications([])
    } finally {
      setLoading(false)
    }
  }

  const updateVerificationStatus = async (
    verificationId: string,
    newStatus: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      const updateData: any = {
        status: newStatus,
        reviewed_at: new Date().toISOString()
      }

      if (newStatus === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const verification = verifications.find(v => v.id === verificationId)
      if (!verification) {
        console.error('Verification not found')
        return
      }

      // Get current admin user
      const { data: { user: admin } } = await supabase.auth.getUser()
      if (!admin) {
        console.error('Admin user not authenticated')
        return
      }

      // Update verification request status
      const { error } = await supabase
        .from('verification_requests')
        .update(updateData)
        .eq('id', verificationId)

      if (error) throw error

      // If approved, issue the appropriate verification badge
      if (newStatus === 'approved') {
        // Determine badge type from verification type
        const badgeTypeMap: Record<string, string> = {
          'age': 'verified_identity',
          'identity': 'verified_identity',
          'professional': 'verified_professional',
          'business': 'verified_business'
        }

        const badgeType = badgeTypeMap[verification.verification_type] || 'verified_identity'

        // First, revoke any existing badge of the same type
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

        // Issue new badge
        const { error: badgeError } = await supabase
          .from('verification_badges')
          .insert({
            user_id: verification.user_id,
            badge_type: badgeType,
            verification_request_id: verificationId,
            issued_by: admin.id,
            issued_at: new Date().toISOString()
          })

        if (badgeError) {
          console.error('Error issuing badge:', badgeError)
        }

        // Update users_profile.verified_id for backward compatibility
        const { error: profileError } = await supabase
          .from('users_profile')
          .update({ verified_id: true })
          .eq('user_id', verification.user_id)

        if (profileError) console.error('Error updating profile:', profileError)
      }

      // GDPR Compliance: Delete verification documents after review
      if (verification.document_urls && verification.document_urls.length > 0) {
        console.log('Deleting verification documents for GDPR compliance...')

        for (const documentPath of verification.document_urls) {
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
            } else {
              console.log('Successfully deleted document:', path)
            }
          } catch (deleteErr) {
            console.error('Error in document deletion:', deleteErr)
          }
        }
      }

      await fetchVerifications()
      setSelectedVerification(null)
    } catch (error) {
      console.error('Error updating verification:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-primary-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-primary-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground-500" />
    }
  }

  const getVerificationTypeBadge = (type: string) => {
    const colors = {
      'government_id': 'bg-primary-100 text-primary-800',
      'student_id': 'bg-primary-100 text-primary-800',
      'professional_cert': 'bg-primary-100 text-primary-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[type as keyof typeof colors] || 'bg-muted-100 text-muted-foreground-800'}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="bg-background rounded-lg shadow p-8">
        <div className="text-center text-muted-foreground-500">Loading verification requests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === status 
                ? 'bg-primary-600 text-primary-foreground' 
                : 'bg-muted-200 text-muted-foreground-700 hover:bg-muted-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Verifications Table */}
      <div className="bg-background rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-muted-primary/30">
          <thead className="bg-muted-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-muted-primary/30">
            {verifications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground-500">
                  No verification requests found
                </td>
              </tr>
            ) : (
              verifications.map((verification) => (
                <tr key={verification.id} className="hover:bg-muted-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(verification.status)}
                      <span className="ml-2 text-sm text-muted-foreground-900">{verification.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground-900">
                        {verification.user_profile?.display_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground-500">
                        @{verification.user_profile?.handle || 'unknown'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVerificationTypeBadge(verification.verification_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground-500">
                    {new Date(verification.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedVerification(verification)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {verification.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateVerificationStatus(verification.id, 'approved')}
                            className="text-primary-600 hover:text-primary-900"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:')
                              if (reason) {
                                updateVerificationStatus(verification.id, 'rejected', reason)
                              }
                            }}
                            className="text-destructive-600 hover:text-destructive-900"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Verification Details Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Verification Details
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground-500">User</p>
                  <p className="font-medium">
                    {selectedVerification.user_profile?.display_name} 
                    <span className="text-muted-foreground-500 ml-1">@{selectedVerification.user_profile?.handle}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Status</p>
                  <div className="flex items-center">
                    {getStatusIcon(selectedVerification.status)}
                    <span className="ml-2">{selectedVerification.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Type</p>
                  {getVerificationTypeBadge(selectedVerification.verification_type)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Submitted</p>
                  <p className="font-medium">
                    {new Date(selectedVerification.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedVerification.document_urls && selectedVerification.document_urls.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground-500 mb-2">Documents</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVerification.document_urls.map((url, index) => (
                      <div key={index} className="border rounded p-2">
                        <img 
                          src={url} 
                          alt={`Document ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedVerification.rejection_reason && (
                <div className="bg-destructive-50 p-3 rounded">
                  <p className="text-sm text-muted-foreground-500">Rejection Reason</p>
                  <p className="text-destructive-800">{selectedVerification.rejection_reason}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedVerification.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        updateVerificationStatus(selectedVerification.id, 'approved')
                      }}
                      className="px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:')
                        if (reason) {
                          updateVerificationStatus(selectedVerification.id, 'rejected', reason)
                        }
                      }}
                      className="px-4 py-2 bg-destructive-600 text-primary-foreground rounded-lg hover:bg-destructive-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="px-4 py-2 bg-muted-200 text-muted-foreground-800 rounded-lg hover:bg-muted-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}