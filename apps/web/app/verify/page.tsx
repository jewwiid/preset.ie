'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Shield, CheckCircle, AlertCircle, Camera, ExternalLink, User, Briefcase, Building, XCircle } from 'lucide-react'
import { COUNTRY_CODES, type CountryCode } from '../../lib/social-utils'

interface VerificationFormData {
  request_type: 'identity' | 'professional' | 'business'
  document_file: File | null
  additional_info: string
  
  // Social Links (Identity & Professional)
  instagram_url?: string
  linkedin_url?: string
  tiktok_url?: string
  portfolio_url?: string
  
  // Professional Fields
  years_experience?: number
  professional_license_number?: string
  specializations?: string[]
  references_contact?: string
  
  // Business Fields
  business_name?: string
  business_website?: string
  business_registration_number?: string
  business_address?: string
  business_type?: string
  tax_id?: string
  
  // Contact Information (All types)
  phone_number?: string
  alternative_email?: string
}

// Helper function to format social media URLs
const formatSocialUrl = (url: string | null, platform: 'instagram' | 'linkedin' | 'tiktok'): string => {
  if (!url) return ''
  
  // If it's already a full URL, return as is
  if (url.startsWith('http')) return url
  
  // If it's just a username, format it properly
  const username = url.replace('@', '').trim()
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${username}`
    case 'linkedin':
      return `https://linkedin.com/in/${username}`
    case 'tiktok':
      return `https://tiktok.com/@${username}`
    default:
      return url
  }
}

export default function VerificationPage() {
  const [formData, setFormData] = useState<VerificationFormData>({
    request_type: 'identity',
    document_file: null,
    additional_info: '',
    instagram_url: '',
    linkedin_url: '',
    tiktok_url: '',
    portfolio_url: '',
    years_experience: undefined,
    professional_license_number: '',
    specializations: [],
    references_contact: '',
    business_name: '',
    business_website: '',
    business_registration_number: '',
    business_address: '',
    business_type: '',
    tax_id: '',
    phone_number: '',
    alternative_email: ''
  })
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<{
    approved: string[]
    pending: string[]
    rejected: any[]
  }>({ approved: [], pending: [], rejected: [] })
  const [selectedCountryCode, setSelectedCountryCode] = useState('+353')

  // Fetch user role and profile data on mount
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        if (!supabase) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch verification status
        const [profileResult, badgesResult, requestsResult] = await Promise.all([
          supabase
            .from('users_profile')
            .select('role_flags, instagram_url, linkedin_url, tiktok_url, portfolio_url, years_experience, phone_number')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('verification_badges')
            .select('badge_type')
            .eq('user_id', user.id)
            .is('revoked_at', null),
          supabase
            .from('verification_requests')
            .select('verification_type, status, rejection_reason, review_notes, submitted_at')
            .eq('user_id', user.id)
            .in('status', ['pending', 'reviewing', 'rejected'])
        ])

        const { data: profile, error: profileError } = profileResult

        if (profile && !profileError) {
          if (profile.role_flags) {
            setUserRoles(profile.role_flags)
          }

          // Pre-populate form with existing profile data and format URLs
          const phoneNumber = profile.phone_number || ''
          
          // Extract country code from phone number if it exists
          if (phoneNumber) {
            const countryCodeMatch = phoneNumber.match(/^\+\d{1,4}/)
            if (countryCodeMatch) {
              setSelectedCountryCode(countryCodeMatch[0])
            }
          }
          
          setFormData(prev => ({
            ...prev,
            instagram_url: formatSocialUrl(profile.instagram_url, 'instagram') || '',
            linkedin_url: formatSocialUrl(profile.linkedin_url, 'linkedin') || '',
            tiktok_url: formatSocialUrl(profile.tiktok_url, 'tiktok') || '',
            portfolio_url: profile.portfolio_url || '',
            years_experience: profile.years_experience || undefined,
            phone_number: phoneNumber
          }))
        }

        // Process verification status
        const approvedTypes: string[] = []
        const pendingTypes: string[] = []
        const rejectedTypes: any[] = []

        // Map badge types to verification types
        if (badgesResult.data) {
          badgesResult.data.forEach(badge => {
            if (badge.badge_type === 'verified_identity') {
              approvedTypes.push('identity')
            } else if (badge.badge_type === 'verified_professional') {
              approvedTypes.push('professional')
            } else if (badge.badge_type === 'verified_business') {
              approvedTypes.push('business')
            }
          })
        }

        if (requestsResult.data) {
          requestsResult.data.forEach(request => {
            if (!approvedTypes.includes(request.verification_type)) {
              if (request.status === 'rejected') {
                rejectedTypes.push(request)
              } else {
                pendingTypes.push(request.verification_type)
              }
            }
          })
        }

        setVerificationStatus({ 
          approved: approvedTypes, 
          pending: pendingTypes,
          rejected: rejectedTypes 
        })
      } catch (err) {
        console.error('Error fetching user profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Check if user is TALENT only (no CONTRIBUTOR role)
  const isTalentOnly = userRoles.includes('TALENT') && !userRoles.includes('CONTRIBUTOR')

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB')
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, or PDF file')
      return
    }

    setFormData(prev => ({ ...prev, document_file: file }))
    setError(null)
  }

  const handleReplaceFile = () => {
    const fileInput = document.getElementById('document-file-input') as HTMLInputElement
    if (fileInput) fileInput.click()
  }

  // Handle social media input with auto-formatting
  const handleSocialInput = (platform: 'instagram' | 'linkedin' | 'tiktok', value: string) => {
    const formattedUrl = formatSocialUrl(value, platform)
    setFormData(prev => ({
      ...prev,
      [`${platform}_url`]: formattedUrl
    }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.document_file) {
      setError('Please upload a verification document')
      return
    }

    // Prevent duplicate submissions
    if (verificationStatus.approved.includes(formData.request_type)) {
      setError(`You already have ${formData.request_type} verification approved. No need to submit again.`)
      return
    }

    if (verificationStatus.pending.includes(formData.request_type)) {
      setError(`You already have a ${formData.request_type} verification request pending review. Please wait for the current request to be processed.`)
      return
    }

    // Allow resubmission if previous request was rejected
    const rejectedRequest = verificationStatus.rejected.find(r => r.verification_type === formData.request_type)
    if (rejectedRequest) {
      console.log('Previous request was rejected, allowing resubmission:', rejectedRequest)
      // User can resubmit - no error needed
    }

    // Validate required fields based on verification type
    if (formData.request_type === 'identity') {
      if (!formData.instagram_url && !formData.linkedin_url && !formData.tiktok_url) {
        setError('Please provide at least one social media profile for identity & age verification')
        return
      }
    }

    if (formData.request_type === 'professional') {
      if (!formData.portfolio_url && !formData.linkedin_url) {
        setError('Please provide a portfolio URL or LinkedIn profile for professional verification')
        return
      }
    }

    if (formData.request_type === 'business') {
      if (!formData.business_name || !formData.business_website) {
        setError('Please provide business name and website for business verification')
        return
      }

      // Prevent TALENT-only users from submitting business verification
      if (isTalentOnly) {
        setError('Business verification is only available for Contributors and business owners. As a Talent, please use Identity or Professional verification.')
        return
      }
    }

    setUploading(true)
    setError(null)

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        setError('Database connection not available. Please try again.')
        setUploading(false)
        return
      }

      // 1. Get current user
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) {
        throw new Error('Please log in to submit a verification request')
      }

      // 2. Get user profile (for validation)
      const { data: profile } = await supabase!
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        throw new Error('User profile not found')
      }

      // 3. Upload document to secure bucket (create bucket if needed)
      const fileExt = formData.document_file.name.split('.').pop()
      const fileName = `${user.id}/${formData.request_type}/${Date.now()}.${fileExt}`
      
      // Try to upload, create bucket if it doesn't exist
      let uploadData, uploadError
      
      try {
        const result = await supabase!.storage
          .from('verification-documents')
          .upload(fileName, formData.document_file, {
            cacheControl: '3600',
            upsert: false
          })
        uploadData = result.data
        uploadError = result.error
      } catch (error: any) {
        // If bucket doesn't exist, try to create it
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          try {
            await supabase!.storage.createBucket('verification-documents', { 
              public: true, // Make public so admins can view documents
              fileSizeLimit: 5242880, // 5MB
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
            })
            
            // Retry upload after creating bucket
            const result = await supabase!.storage
              .from('verification-documents')
              .upload(fileName, formData.document_file, {
                cacheControl: '3600',
                upsert: false
              })
            uploadData = result.data
            uploadError = result.error
          } catch (bucketError) {
            throw new Error('Unable to create secure storage. Please contact support.')
          }
        } else {
          throw error
        }
      }

      if (uploadError) throw uploadError
      if (!uploadData) throw new Error('Upload failed - no data returned')

      // 4. Prepare data for new schema
      const socialLinks = {
        instagram: formData.instagram_url || null,
        linkedin: formData.linkedin_url || null,
        tiktok: formData.tiktok_url || null,
        portfolio: formData.portfolio_url || null
      }

      const professionalInfo = formData.request_type === 'professional' ? {
        years_experience: formData.years_experience || null,
        license_number: formData.professional_license_number || null,
        specializations: formData.specializations || [],
        references_contact: formData.references_contact || null
      } : {}

      const businessInfo = formData.request_type === 'business' ? {
        business_name: formData.business_name || null,
        website: formData.business_website || null,
        registration_number: formData.business_registration_number || null,
        business_address: formData.business_address || null,
        business_type: formData.business_type || null,
        tax_id: formData.tax_id || null
      } : {}

      const contactInfo = {
        phone: formData.phone_number || null,
        alternative_email: formData.alternative_email || null
      }

      const verificationData = {
        additional_info: formData.additional_info,
        file_name: formData.document_file.name,
        file_size: formData.document_file.size
      }

      // 5. Create verification request with correct schema
      const { error: insertError } = await supabase!
        .from('verification_requests')
        .insert({
          user_id: user.id, // Use auth user ID, not profile ID
          verification_type: formData.request_type,
          document_urls: [uploadData.path],
          document_types: [formData.document_file.type],
          metadata: {
            // Store all additional data in metadata JSONB field
            file_name: formData.document_file.name,
            file_size: formData.document_file.size,
            additional_info: formData.additional_info,
            social_links: socialLinks,
            professional_info: professionalInfo,
            business_info: businessInfo,
            contact_info: contactInfo
          }
        })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  // Type-specific field components
  const renderIdentityFields = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground flex items-center">
        <User className="w-4 h-4 mr-2" />
        Identity & Age Verification Details
      </h3>
      <p className="text-sm text-muted-foreground">
        Provide social media profiles to help verify your identity. At least one is required. Your government ID will verify both your identity and age (18+).
      </p>
      {(formData.instagram_url || formData.linkedin_url || formData.tiktok_url) && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary">
            We've pre-filled your social links from your profile. You can modify them if needed.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Instagram Profile
          </label>
          <input
            type="url"
            value={formData.instagram_url || ''}
            onChange={(e) => handleSocialInput('instagram', e.target.value)}
            placeholder="https://instagram.com/yourusername or just yourusername"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={formData.linkedin_url || ''}
            onChange={(e) => handleSocialInput('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/yourname or just yourname"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            TikTok Profile (Optional)
          </label>
          <input
            type="url"
            value={formData.tiktok_url || ''}
            onChange={(e) => handleSocialInput('tiktok', e.target.value)}
            placeholder="https://tiktok.com/@yourusername or just yourusername"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone Number (Optional)
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring min-w-[120px]"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={formData.phone_number?.replace(selectedCountryCode, '') || ''}
              onChange={(e) => {
                const phoneValue = `${selectedCountryCode}${e.target.value.replace(/[\s\-()]/g, '')}`
                setFormData(prev => ({ ...prev, phone_number: phoneValue }))
              }}
              placeholder={COUNTRY_CODES.find(c => c.code === selectedCountryCode)?.placeholder || "Phone number"}
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderProfessionalFields = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground flex items-center">
        <Briefcase className="w-4 h-4 mr-2" />
        Professional Verification Details
      </h3>
      <p className="text-sm text-muted-foreground">
        Provide professional credentials and portfolio. Portfolio URL or LinkedIn is required.
      </p>
      {(formData.portfolio_url || formData.linkedin_url || formData.years_experience) && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary">
            We've pre-filled your professional information from your profile. You can modify it if needed.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Portfolio Website <span className="text-destructive">*</span>
          </label>
          <input
            type="url"
            value={formData.portfolio_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
            placeholder="https://yourportfolio.com"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            LinkedIn Profile <span className="text-destructive">*</span>
          </label>
          <input
            type="url"
            value={formData.linkedin_url || ''}
            onChange={(e) => handleSocialInput('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/yourname or just yourname"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.years_experience || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || undefined }))}
            placeholder="5"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Professional License Number (Optional)
          </label>
          <input
            type="text"
            value={formData.professional_license_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, professional_license_number: e.target.value }))}
            placeholder="PHO123456"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Instagram Profile (Optional)
          </label>
          <input
            type="url"
            value={formData.instagram_url || ''}
            onChange={(e) => handleSocialInput('instagram', e.target.value)}
            placeholder="https://instagram.com/yourwork or just yourwork"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Professional Reference Contact (Optional)
          </label>
          <input
            type="email"
            value={formData.references_contact || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, references_contact: e.target.value }))}
            placeholder="reference@company.com"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>
    </div>
  )

  const renderBusinessFields = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground flex items-center">
        <Building className="w-4 h-4 mr-2" />
        Business Verification Details
      </h3>
      <p className="text-sm text-muted-foreground">
        Provide business information for verification. Business name and website are required.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Business Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={formData.business_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            placeholder="Your Business LLC"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Business Website <span className="text-destructive">*</span>
          </label>
          <input
            type="url"
            value={formData.business_website || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_website: e.target.value }))}
            placeholder="https://yourbusiness.com"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Business Registration Number
          </label>
          <input
            type="text"
            value={formData.business_registration_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_registration_number: e.target.value }))}
            placeholder="LLC123456789"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Business Type
          </label>
          <select
            value={formData.business_type || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="">Select business type</option>
            <option value="Photography Services">Photography Services</option>
            <option value="Creative Agency">Creative Agency</option>
            <option value="Production Company">Production Company</option>
            <option value="Freelance Services">Freelance Services</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            Business Address
          </label>
          <input
            type="text"
            value={formData.business_address || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
            placeholder="123 Business St, City, State, ZIP"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tax ID / VAT Number (Optional)
          </label>
          <input
            type="text"
            value={formData.tax_id || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
            placeholder="12-3456789"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Business Instagram (Optional)
          </label>
          <input
            type="url"
            value={formData.instagram_url || ''}
            onChange={(e) => handleSocialInput('instagram', e.target.value)}
            placeholder="https://instagram.com/yourbusiness or just yourbusiness"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-background rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Verification Submitted!
          </h2>
          <p className="text-muted-foreground mb-6">
            Your {formData.request_type} verification request has been submitted. 
            Our team will review it within 2-3 business days.
          </p>
          <div className="bg-primary/10 p-4 rounded-lg mb-6">
            <p className="text-sm text-primary">
              <Shield className="w-4 h-4 inline mr-1" />
              Your document will be automatically deleted after verification for security and GDPR compliance.
              You'll receive an email notification once your verification is processed.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/profile'}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Profile
          </button>
        </div>
      </div>
    )
  }

  // Show loading state while fetching user role
  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-foreground border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading verification options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-background rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-2xl font-semibold">Account Verification</h1>
                <p className="text-primary-foreground/80">Verify your identity to unlock premium features and build trust</p>
              </div>
            </div>
          </div>

          {/* Why Get Verified Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Why Get Verified?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Build Trust</h3>
                  <p className="text-sm text-muted-foreground">Increase credibility with clients and collaborators by proving your identity</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Stand Out</h3>
                  <p className="text-sm text-muted-foreground">Verified profiles rank higher in search results and get more visibility</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Show Professionalism</h3>
                  <p className="text-sm text-muted-foreground">Display verification badges that showcase your credentials</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Access Opportunities</h3>
                  <p className="text-sm text-muted-foreground">Some premium gigs and collaborations require verification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status Section */}
          {(verificationStatus.approved.length > 0 || verificationStatus.pending.length > 0 || verificationStatus.rejected.length > 0) && (
            <div className="bg-background p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">Your Verification Status</h2>

              {verificationStatus.approved.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Approved Verifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {verificationStatus.approved.map(type => (
                      <div key={type} className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        {type === 'identity' ? 'Identity & Age Verified' : type === 'professional' ? 'Professional Verified' : 'Business Verified'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verificationStatus.pending.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Pending Review
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {verificationStatus.pending.map(type => (
                      <div key={type} className="bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                        {type === 'identity' ? 'Identity & Age' : type === 'professional' ? 'Professional' : 'Business'} - Under Review
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verificationStatus.rejected.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Rejected Requests
                  </h3>
                  <div className="space-y-3">
                    {verificationStatus.rejected.map((request, index) => (
                      <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="bg-red-500 rounded-full px-2 py-1 text-xs font-medium text-white">
                                {request.verification_type === 'identity' ? 'Identity & Age' : 
                                 request.verification_type === 'professional' ? 'Professional' : 'Business'}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Rejected on {new Date(request.submitted_at).toLocaleDateString()}
                              </span>
                            </div>
                            {request.rejection_reason && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Reason:</p>
                                <p className="text-sm text-foreground">{request.rejection_reason}</p>
                              </div>
                            )}
                            {request.review_notes && (
                              <div className="mb-2">
                                <p className="text-sm font-medium text-foreground mb-1">Admin Notes:</p>
                                <p className="text-sm text-muted-foreground">{request.review_notes}</p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              💡 You can resubmit with corrected information. Make sure to upload clear, readable documents.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-4">
                💡 You can submit multiple verification types separately. Each request is reviewed independently.
              </p>
            </div>
          )}

          {/* Badge Examples Section */}
          <div className="bg-muted/30 p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Verification Badge Examples</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Earn these badges to show on your profile, in listings, and across the platform
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Identity Badge */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-primary fill-primary/20" />
                  <h3 className="font-medium text-foreground">Identity & Age Verified</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Identity and age confirmation with government ID + social profiles
                </p>
                <div className="text-xs text-primary font-medium">Identity & Age Verification</div>
              </div>

              {/* Professional Badge */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-6 h-6 text-primary fill-primary/20" />
                  <h3 className="font-medium text-foreground">Professional Verified</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Credentials and work experience confirmed
                </p>
                <div className="text-xs text-primary font-medium">Professional Verification</div>
              </div>

              {/* Business Badge */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-6 h-6 text-primary fill-primary/20" />
                  <h3 className="font-medium text-foreground">Business Verified</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Registered business entity confirmation
                </p>
                <div className="text-xs text-primary font-medium">Business Verification</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Verification Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-4">
                Verification Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    type: 'identity',
                    label: 'Identity & Age Verification (18+)',
                    desc: 'Verify your identity and age with government ID + social profiles',
                    icon: Shield
                  },
                  {
                    type: 'professional',
                    label: 'Professional Verification',
                    desc: 'Verify professional credentials and portfolio',
                    icon: Briefcase
                  },
                  {
                    type: 'business',
                    label: 'Business Verification',
                    desc: 'Verify business ownership and registration',
                    icon: Building
                  }
                ].filter(option => {
                  // Hide business verification for TALENT-only users
                  if (option.type === 'business' && isTalentOnly) {
                    return false
                  }
                  return true
                }).map(({ type, label, desc, icon: Icon }) => {
                  const isApproved = verificationStatus.approved.includes(type)
                  const isPending = verificationStatus.pending.includes(type)

                  return (
                    <label
                      key={type}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md relative ${
                        isApproved
                          ? 'border-primary/40 bg-primary/5 opacity-60 cursor-not-allowed'
                          : isPending
                          ? 'border-amber-500/40 bg-amber-500/5 opacity-60 cursor-not-allowed'
                          : formData.request_type === type
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name="verification_type"
                        value={type}
                        checked={formData.request_type === type}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          request_type: e.target.value as typeof formData.request_type
                        }))}
                        className="sr-only"
                        disabled={isApproved || isPending}
                      />
                      <div className="flex items-start">
                        <Icon className={`w-5 h-5 mr-3 mt-0.5 ${
                          isApproved
                            ? 'text-primary'
                            : isPending
                            ? 'text-amber-500'
                            : formData.request_type === type
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm flex items-center gap-2">
                            {label}
                            {isApproved && (
                              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {type === 'identity' ? 'Identity & Age Verified' : type === 'professional' ? 'Professional Verified' : 'Business Verified'}
                              </span>
                            )}
                            {isPending && (
                              <span className="text-xs text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div> {type === 'identity' ? 'Identity & Age' : type === 'professional' ? 'Professional' : 'Business'} - Under Review
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">{desc}</div>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Type-specific fields */}
            {formData.request_type === 'identity' && renderIdentityFields()}
            {formData.request_type === 'professional' && renderProfessionalFields()}
            {formData.request_type === 'business' && renderBusinessFields()}

            {/* Document Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Verification Document <span className="text-destructive">*</span>
              </label>
              {formData.request_type === 'identity' && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-primary">
                    <Shield className="w-4 h-4 inline mr-1" />
                    For identity & age verification, please upload a government-issued ID (passport, driver's license, or national ID) showing your birth date. This single document will verify both your identity and that you are 18 or older.
                  </p>
                </div>
              )}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/10'
                    : formData.document_file
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => {
                  // Only trigger file input when clicking the drop zone, not typing in other fields
                  const fileInput = document.getElementById('document-file-input') as HTMLInputElement
                  if (fileInput) fileInput.click()
                }}
              >
                {formData.document_file ? (
                  <div className="space-y-4">
                    {/* File info */}
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-primary mr-3" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{formData.document_file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(formData.document_file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    {/* Image preview for image files */}
                    {formData.document_file.type.startsWith('image/') && (
                      <div className="flex justify-center">
                        <div 
                          className="relative max-w-xs max-h-48 bg-background rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={handleReplaceFile}
                        >
                          <img
                            src={URL.createObjectURL(formData.document_file)}
                            alt="Document preview"
                            className="w-full h-full object-contain"
                            onLoad={(e) => {
                              // Clean up the object URL after image loads to prevent memory leaks
                              URL.revokeObjectURL((e.target as HTMLImageElement).src)
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <div className="bg-background/90 px-2 py-1 rounded text-xs text-foreground">
                              Click to replace
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* PDF preview */}
                    {formData.document_file.type === 'application/pdf' && (
                      <div className="flex justify-center">
                        <div 
                          className="bg-background border border-border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={handleReplaceFile}
                        >
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">PDF Document</p>
                            <p className="text-sm text-muted-foreground">Click to replace</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Drag & drop your document here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supported formats: JPG, PNG, WebP, PDF (Max 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="document-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.additional_info}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                placeholder="Any additional information you'd like to provide..."
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>

            {/* GDPR Notice */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex">
                <Shield className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-primary font-medium mb-1">Privacy & Security Notice</p>
                  <p className="text-primary">
                    Your documents are stored securely and will be <strong>automatically deleted</strong> after 
                    verification is complete. We comply with GDPR and data protection regulations. 
                    Only authorized admins can view your documents during the verification process.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-destructive mr-3 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !formData.document_file}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                uploading || !formData.document_file
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-transparent mr-2"></div>
                  Submitting Verification...
                </div>
              ) : (
                'Submit Verification Request'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}