'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Upload, Shield, CheckCircle, AlertCircle, Camera, ExternalLink, User, Briefcase, Building } from 'lucide-react'

interface VerificationFormData {
  request_type: 'age' | 'identity' | 'professional' | 'business'
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

export default function VerificationPage() {
  const [formData, setFormData] = useState<VerificationFormData>({
    request_type: 'age',
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

    // Validate required fields based on verification type
    if (formData.request_type === 'identity') {
      if (!formData.instagram_url && !formData.linkedin_url && !formData.tiktok_url) {
        setError('Please provide at least one social media profile for identity verification')
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

      // 2. Get user profile
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
              public: false,
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

      // 5. Create verification request with corrected schema
      const { error: insertError } = await supabase!
        .from('verification_requests')
        .insert({
          user_id: profile.id,
          verification_type: formData.request_type, // Use verification_type (existing column)
          request_type: formData.request_type, // Also add request_type for new functionality
          document_url: uploadData.path, // Single document URL
          document_type: formData.document_file.type, // Single document type
          document_urls: [uploadData.path], // Array for backwards compatibility
          document_types: [formData.document_file.type], // Array for backwards compatibility
          verification_data: verificationData,
          social_links: socialLinks,
          professional_info: professionalInfo,
          business_info: businessInfo,
          contact_info: contactInfo,
          // Keep legacy field for backwards compatibility
          additional_data: {
            file_name: formData.document_file.name,
            file_size: formData.document_file.size,
            additional_info: formData.additional_info
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
      <h3 className="font-medium text-gray-900 flex items-center">
        <User className="w-4 h-4 mr-2" />
        Identity Verification Details
      </h3>
      <p className="text-sm text-gray-600">
        Provide social media profiles to help verify your identity. At least one is required.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instagram Profile
          </label>
          <input
            type="url"
            value={formData.instagram_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
            placeholder="https://instagram.com/yourusername"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn Profile
          </label>
          <input
            type="url"
            value={formData.linkedin_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
            placeholder="https://linkedin.com/in/yourname"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            TikTok Profile (Optional)
          </label>
          <input
            type="url"
            value={formData.tiktok_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tiktok_url: e.target.value }))}
            placeholder="https://tiktok.com/@yourusername"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
            placeholder="+1 (555) 123-4567"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderProfessionalFields = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center">
        <Briefcase className="w-4 h-4 mr-2" />
        Professional Verification Details
      </h3>
      <p className="text-sm text-gray-600">
        Provide professional credentials and portfolio. Portfolio URL or LinkedIn is required.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Portfolio Website <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.portfolio_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
            placeholder="https://yourportfolio.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn Profile <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.linkedin_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
            placeholder="https://linkedin.com/in/yourname"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.years_experience || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || undefined }))}
            placeholder="5"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Professional License Number (Optional)
          </label>
          <input
            type="text"
            value={formData.professional_license_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, professional_license_number: e.target.value }))}
            placeholder="PHO123456"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instagram Profile (Optional)
          </label>
          <input
            type="url"
            value={formData.instagram_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
            placeholder="https://instagram.com/yourwork"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Professional Reference Contact (Optional)
          </label>
          <input
            type="email"
            value={formData.references_contact || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, references_contact: e.target.value }))}
            placeholder="reference@company.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )

  const renderBusinessFields = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center">
        <Building className="w-4 h-4 mr-2" />
        Business Verification Details
      </h3>
      <p className="text-sm text-gray-600">
        Provide business information for verification. Business name and website are required.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.business_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            placeholder="Your Business LLC"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Website <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.business_website || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_website: e.target.value }))}
            placeholder="https://yourbusiness.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Registration Number
          </label>
          <input
            type="text"
            value={formData.business_registration_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_registration_number: e.target.value }))}
            placeholder="LLC123456789"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Type
          </label>
          <select
            value={formData.business_type || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_type: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Address
          </label>
          <input
            type="text"
            value={formData.business_address || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
            placeholder="123 Business St, City, State, ZIP"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax ID / VAT Number (Optional)
          </label>
          <input
            type="text"
            value={formData.tax_id || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
            placeholder="12-3456789"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Instagram (Optional)
          </label>
          <input
            type="url"
            value={formData.instagram_url || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
            placeholder="https://instagram.com/yourbusiness"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Verification Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your {formData.request_type} verification request has been submitted. 
            Our team will review it within 2-3 business days.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <Shield className="w-4 h-4 inline mr-1" />
              Your document will be automatically deleted after verification for security and GDPR compliance.
              You'll receive an email notification once your verification is processed.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/profile'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-2xl font-semibold">Account Verification</h1>
                <p className="text-blue-100">Verify your identity to unlock premium features and build trust</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Verification Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Verification Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    type: 'age', 
                    label: 'Age Verification (18+)', 
                    desc: 'Verify you are 18 or older',
                    icon: User,
                    color: 'blue'
                  },
                  { 
                    type: 'identity', 
                    label: 'Identity Verification', 
                    desc: 'Verify your real identity with social profiles',
                    icon: Shield,
                    color: 'green'
                  },
                  { 
                    type: 'professional', 
                    label: 'Professional Verification', 
                    desc: 'Verify professional credentials and portfolio',
                    icon: Briefcase,
                    color: 'purple'
                  },
                  { 
                    type: 'business', 
                    label: 'Business Verification', 
                    desc: 'Verify business ownership and registration',
                    icon: Building,
                    color: 'orange'
                  }
                ].map(({ type, label, desc, icon: Icon, color }) => (
                  <label
                    key={type}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      formData.request_type === type
                        ? `border-${color}-500 bg-${color}-50 shadow-md`
                        : 'border-gray-200 hover:border-gray-300'
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
                    />
                    <div className="flex items-start">
                      <Icon className={`w-5 h-5 mr-3 mt-0.5 ${
                        formData.request_type === type 
                          ? `text-${color}-600` 
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{label}</div>
                        <div className="text-gray-600 text-xs mt-1">{desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Type-specific fields */}
            {formData.request_type === 'identity' && renderIdentityFields()}
            {formData.request_type === 'professional' && renderProfessionalFields()}
            {formData.request_type === 'business' && renderBusinessFields()}
            
            {/* Age verification has no additional fields */}
            {formData.request_type === 'age' && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <Shield className="w-4 h-4 inline mr-1" />
                  For age verification, please upload a government-issued ID showing your birth date.
                </p>
              </div>
            )}

            {/* Document Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Verification Document <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : formData.document_file
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
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
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary-500 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{formData.document_file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(formData.document_file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag & drop your document here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                value={formData.additional_info}
                onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                placeholder="Any additional information you'd like to provide..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* GDPR Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <Shield className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium mb-1">Privacy & Security Notice</p>
                  <p className="text-yellow-700">
                    Your documents are stored securely and will be <strong>automatically deleted</strong> after 
                    verification is complete. We comply with GDPR and data protection regulations. 
                    Only authorized admins can view your documents during the verification process.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !formData.document_file}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                uploading || !formData.document_file
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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