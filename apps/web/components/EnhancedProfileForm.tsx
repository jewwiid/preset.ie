'use client'

import { useState, useEffect } from 'react'
import { Camera, User, MapPin, Briefcase, Instagram, Globe, Phone, Calendar, Sparkles } from 'lucide-react'
import { DatePicker } from './ui/date-picker'
import { MultiSelectCombobox } from './ui/combobox'

interface EnhancedProfileFormProps {
  formData: any
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  error: string | null
  STYLE_TAGS: string[]
  VIBES: string[]
  handleStyleTagToggle: (tag: string) => void
  handleVibeTagToggle: (vibe: string) => void
}

export default function EnhancedProfileForm({
  formData,
  setFormData,
  onSubmit,
  loading,
  error,
  STYLE_TAGS,
  VIBES,
  handleStyleTagToggle,
  handleVibeTagToggle
}: EnhancedProfileFormProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [predefinedSkills, setPredefinedSkills] = useState<string[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)

  // Fetch predefined skills from database
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/collab/predefined/skills')
        if (response.ok) {
          const data = await response.json()
          setPredefinedSkills(data.skills.map((s: any) => s.name))
        }
      } catch (error) {
        console.error('Error fetching predefined skills:', error)
        // Fallback to basic skills
        setPredefinedSkills([
          'Photography', 'Videography', 'Editing', 'Lighting', 'Portrait Photography',
          'Fashion Photography', 'Wedding Photography', 'Commercial Photography'
        ])
      } finally {
        setSkillsLoading(false)
      }
    }
    fetchSkills()
  }, [])

  const sections = [
    { title: 'Basic Info', icon: User },
    { title: 'Style & Vibes', icon: Sparkles },
    { title: 'Social Media', icon: Instagram },
    { title: 'Professional', icon: Briefcase }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev: any) => ({ ...prev, avatarFile: file }))
    }
  }

  const isContributor = formData.role === 'CONTRIBUTOR' || formData.role === 'BOTH'
  const isTalent = formData.role === 'TALENT' || formData.role === 'BOTH'

  return (
    <div className="min-h-screen bg-muted-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-muted-foreground-900">Complete Your Profile</h1>
          <p className="mt-2 text-muted-foreground-600">Let's set up your creative profile</p>
        </div>

        {/* Section Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-background rounded-lg p-1 shadow-sm">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentSection(index)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentSection === index
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-muted-foreground-500 hover:text-muted-foreground-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {section.title}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-background rounded-lg shadow p-8">
          {error && (
            <div className="bg-destructive-100 border border-destructive-400 text-destructive-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Section 0: Basic Info */}
          {currentSection === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-muted-foreground-900 mb-6">Basic Information</h2>
              
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-muted-200 rounded-full flex items-center justify-center">
                    {formData.avatarFile ? (
                      <img
                        src={URL.createObjectURL(formData.avatarFile)}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-muted-foreground-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <h3 className="text-lg font-medium text-muted-foreground-900 mb-4">I am a...</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['CONTRIBUTOR', 'TALENT', 'BOTH'].map((role) => (
                    <label key={role} className="relative">
                      <input
                        type="radio"
                        value={role}
                        checked={formData.role === role}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, role: e.target.value }))}
                        className="sr-only"
                        required
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.role === role
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-border-300 hover:border-border-400'
                      }`}>
                        <h4 className="font-semibold text-muted-foreground-900">{role === 'BOTH' ? 'Both' : role.charAt(0) + role.slice(1).toLowerCase()}</h4>
                        <p className="text-sm text-muted-foreground-600 mt-1">
                          {role === 'CONTRIBUTOR' && 'Post gigs and hire talent'}
                          {role === 'TALENT' && 'Apply to gigs and build portfolio'}
                          {role === 'BOTH' && 'Post gigs and apply to others'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Handle *
                  </label>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, handle: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="@username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                  Date of Birth
                </label>
                <DatePicker
                  date={formData.dateOfBirth}
                  onDateChange={(date) => setFormData((prev: any) => ({ ...prev, dateOfBirth: date }))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Section 1: Style & Vibes */}
          {currentSection === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-muted-foreground-900 mb-6">Your Style & Vibes</h2>
              
              {/* Style Tags */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-4">
                  Style Tags (select up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleStyleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.styleTags.includes(tag)
                          ? 'bg-primary-600 text-primary-foreground'
                          : 'bg-muted-200 text-muted-foreground-700 hover:bg-muted-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibe Tags */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground-700 mb-4">
                  Your Vibe (select up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map((vibe) => (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() => handleVibeTagToggle(vibe)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.vibeTags.includes(vibe)
                          ? 'bg-primary-600 text-primary-foreground'
                          : 'bg-muted-200 text-muted-foreground-700 hover:bg-muted-300'
                      }`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>

              {/* Talent-specific fields */}
              {isTalent && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-muted-foreground-900 mb-4">Talent Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={formData.heightCm || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, heightCm: parseInt(e.target.value) || null }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Eye Color
                      </label>
                      <select
                        value={formData.eyeColor}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, eyeColor: e.target.value }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select...</option>
                        <option value="Brown">Brown</option>
                        <option value="Blue">Blue</option>
                        <option value="Green">Green</option>
                        <option value="Hazel">Hazel</option>
                        <option value="Gray">Gray</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Hair Color
                      </label>
                      <select
                        value={formData.hairColor}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, hairColor: e.target.value }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select...</option>
                        <option value="Black">Black</option>
                        <option value="Brown">Brown</option>
                        <option value="Blonde">Blonde</option>
                        <option value="Red">Red</option>
                        <option value="Gray">Gray</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Shoe Size
                      </label>
                      <input
                        type="text"
                        value={formData.shoeSize}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, shoeSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., 42, 9.5, etc."
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Measurements
                    </label>
                    <input
                      type="text"
                      value={formData.measurements}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, measurements: e.target.value }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., 34-28-36, S/M/L, etc."
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.tattoos}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, tattoos: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-muted-foreground-700">Has tattoos</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.piercings}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, piercings: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-muted-foreground-700">Has piercings</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.availableForTravel}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, availableForTravel: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-muted-foreground-700">Available for travel</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Contributor-specific fields */}
              {isContributor && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-muted-foreground-900 mb-4">Contributor Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={formData.yearsExperience || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Typical Turnaround (days)
                      </label>
                      <input
                        type="number"
                        value={formData.typicalTurnaroundDays || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, typicalTurnaroundDays: parseInt(e.target.value) || null }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.hasStudio}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, hasStudio: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-muted-foreground-700">I have a studio</span>
                    </label>
                  </div>

                  {formData.hasStudio && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                          Studio Name
                        </label>
                        <input
                          type="text"
                          value={formData.studioName}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, studioName: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                          Studio Address
                        </label>
                        <input
                          type="text"
                          value={formData.studioAddress}
                          onChange={(e) => setFormData((prev: any) => ({ ...prev, studioAddress: e.target.value }))}
                          className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Section 2: Social Media */}
          {currentSection === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-muted-foreground-900 mb-6">Social Media & Contact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, instagramHandle: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    TikTok Handle
                  </label>
                  <input
                    type="text"
                    value={formData.tiktokHandle}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, tiktokHandle: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, websiteUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, portfolioUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://your-portfolio.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Professional */}
          {currentSection === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-muted-foreground-900 mb-6">Professional Details</h2>
              
              {isContributor && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-muted-foreground-900">Contributor Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Hourly Rate Min (€)
                      </label>
                      <input
                        type="number"
                        value={formData.hourlyRateMin || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, hourlyRateMin: parseFloat(e.target.value) || null }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                        Hourly Rate Max (€)
                      </label>
                      <input
                        type="number"
                        value={formData.hourlyRateMax || ''}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, hourlyRateMax: parseFloat(e.target.value) || null }))}
                        className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Specializations
                    </label>
                    {skillsLoading ? (
                      <div className="w-full px-3 py-2 border border-border-300 rounded-md bg-gray-50">
                        Loading skills...
                      </div>
                    ) : (
                      <MultiSelectCombobox
                        values={formData.specializations || []}
                        onValuesChange={(skills) => setFormData((prev: any) => ({ ...prev, specializations: skills }))}
                        options={predefinedSkills}
                        placeholder="Select your specializations..."
                        emptyText="No skills found."
                        maxSelections={15}
                      />
                    )}
                    <p className="text-xs text-muted-foreground-500 mt-1">
                      Select up to 15 specializations that best describe your skills
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Equipment (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.equipment.join(', ')}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, equipment: e.target.value.split(',').map(s => s.trim()) }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Canon R5, Sony A7R4, Profoto B1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Editing Software (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.editingSoftware.join(', ')}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, editingSoftware: e.target.value.split(',').map(s => s.trim()) }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Photoshop, Lightroom, Capture One"
                    />
                  </div>
                </div>
              )}

              {isTalent && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-muted-foreground-900">Talent Categories</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
                      Categories (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.talentCategories.join(', ')}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, talentCategories: e.target.value.split(',').map(s => s.trim()) }))}
                      className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Model, Actor, Dancer, Musician"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className="px-4 py-2 text-muted-foreground-600 hover:text-muted-foreground-700 disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {sections.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentSection ? 'bg-primary-600' : 'bg-muted-300'
                  }`}
                />
              ))}
            </div>

            {currentSection < sections.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSection(currentSection + 1)}
                className="px-6 py-2 bg-primary-600 text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
