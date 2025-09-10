'use client'

import { useState, useEffect, useRef } from 'react'
import { fileToDataUrl, compressImage } from '../lib/storage'
import { 
  User, 
  MapPin, 
  Globe, 
  Instagram, 
  Music2, 
  Link, 
  Phone,
  Camera,
  Palette,
  Briefcase,
  Ruler,
  Eye,
  Scissors,
  Building,
  Calendar,
  DollarSign,
  Plane,
  Check,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react'

interface ProfileSetupFormProps {
  role: 'CONTRIBUTOR' | 'TALENT' | 'BOTH'
  currentData: {
    displayName: string
    handle: string
    bio: string
    city: string
    country?: string
    dateOfBirth: string
    instagramHandle?: string
    tiktokHandle?: string
    websiteUrl?: string
    phoneNumber?: string
    avatarUrl?: string
  }
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
}

const COUNTRIES = [
  'Ireland', 'United Kingdom', 'United States', 'Canada', 'Australia',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  'Sweden', 'Denmark', 'Norway', 'Poland', 'Other'
]

const EQUIPMENT_OPTIONS = [
  'DSLR Camera', 'Mirrorless Camera', 'Film Camera', 'Lighting Kit',
  'Reflectors', 'Tripod', 'Gimbal', 'Drone', 'Backdrop', 'Studio Space'
]

const SOFTWARE_OPTIONS = [
  'Lightroom', 'Photoshop', 'Capture One', 'DaVinci Resolve',
  'Final Cut Pro', 'Premiere Pro', 'After Effects'
]

const TALENT_CATEGORIES = [
  'Model', 'Actor', 'Dancer', 'Musician', 'Artist', 'Influencer'
]

const EYE_COLORS = [
  'Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'
]

const HAIR_COLORS = [
  'Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Other'
]

export default function ProfileSetupForm({
  role,
  currentData,
  onUpdate,
  onNext,
  onBack
}: ProfileSetupFormProps) {
  // Basic fields
  const [displayName, setDisplayName] = useState(currentData.displayName)
  const [handle, setHandle] = useState(currentData.handle)
  const [bio, setBio] = useState(currentData.bio)
  const [city, setCity] = useState(currentData.city)
  const [country, setCountry] = useState(currentData.country || 'Ireland')
  
  // Profile photo
  const [avatarUrl, setAvatarUrl] = useState(currentData.avatarUrl || '')
  const [avatarPreview, setAvatarPreview] = useState(currentData.avatarUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Social media
  const [instagramHandle, setInstagramHandle] = useState(currentData.instagramHandle || '')
  const [tiktokHandle, setTiktokHandle] = useState(currentData.tiktokHandle || '')
  const [websiteUrl, setWebsiteUrl] = useState(currentData.websiteUrl || '')
  const [phoneNumber, setPhoneNumber] = useState(currentData.phoneNumber || '')
  
  // Contributor fields
  const [equipment, setEquipment] = useState<string[]>([])
  const [software, setSoftware] = useState<string[]>([])
  const [hasStudio, setHasStudio] = useState(false)
  const [studioName, setStudioName] = useState('')
  const [turnaroundDays, setTurnaroundDays] = useState(7)
  const [yearsExperience, setYearsExperience] = useState(0)
  
  // Talent fields
  const [heightCm, setHeightCm] = useState('')
  const [eyeColor, setEyeColor] = useState('')
  const [hairColor, setHairColor] = useState('')
  const [talentCategories, setTalentCategories] = useState<string[]>([])
  const [hasTattoos, setHasTattoos] = useState(false)
  const [hasPiercings, setHasPiercings] = useState(false)
  
  // Common optional fields
  const [availableForTravel, setAvailableForTravel] = useState(false)
  const [travelRadiusKm, setTravelRadiusKm] = useState(50)
  
  const isContributor = role === 'CONTRIBUTOR' || role === 'BOTH'
  const isTalent = role === 'TALENT' || role === 'BOTH'
  
  // Handle validation
  const [handleError, setHandleError] = useState('')
  const [handleAvailable, setHandleAvailable] = useState(true)
  
  useEffect(() => {
    if (handle.length < 3) {
      setHandleError('Handle must be at least 3 characters')
      setHandleAvailable(false)
    } else if (!/^[a-z][a-z0-9_]*$/.test(handle)) {
      setHandleError('Handle must start with a letter and contain only lowercase letters, numbers, and underscores')
      setHandleAvailable(false)
    } else {
      setHandleError('')
      setHandleAvailable(true)
      // TODO: Check handle availability in database
    }
  }, [handle])
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      
      try {
        setUploading(true)
        
        // Compress image if needed
        const compressedFile = await compressImage(file)
        setSelectedFile(compressedFile)
        
        // Create preview
        const dataUrl = await fileToDataUrl(compressedFile)
        setAvatarPreview(dataUrl)
        
        // Note: Actual upload to storage will happen on form submission
        // to avoid orphaned files if user doesn't complete signup
      } catch (error) {
        console.error('Error processing image:', error)
        alert('Error processing image. Please try another.')
      } finally {
        setUploading(false)
      }
    }
  }
  
  const handleSave = () => {
    const profileData: any = {
      displayName,
      handle: handle.toLowerCase(),
      bio,
      city,
      country,
      avatarFile: selectedFile, // Pass the actual file for upload
      avatarPreview: avatarPreview, // Keep preview for immediate display
      instagramHandle: instagramHandle.replace('@', ''),
      tiktokHandle: tiktokHandle.replace('@', ''),
      websiteUrl,
      phoneNumber,
      yearsExperience,
      availableForTravel,
      travelRadiusKm
    }
    
    if (isContributor) {
      profileData.equipment = equipment
      profileData.editingSoftware = software
      profileData.hasStudio = hasStudio
      profileData.studioName = studioName
      profileData.typicalTurnaroundDays = turnaroundDays
    }
    
    if (isTalent) {
      profileData.heightCm = heightCm ? parseInt(heightCm) : null
      profileData.eyeColor = eyeColor
      profileData.hairColor = hairColor
      profileData.talentCategories = talentCategories
      profileData.tattoos = hasTattoos
      profileData.piercings = hasPiercings
    }
    
    onUpdate(profileData)
    onNext()
  }
  
  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item))
    } else {
      setArray([...array, item])
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Set up your profile</h2>
        
        {/* Profile Photo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                  <img 
                    src={avatarPreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                </div>
              )}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview('')
                    setAvatarUrl('')
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">Choose Photo</span>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>
        
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Handle * {handleAvailable && handle && (
                  <span className="text-green-600 text-xs ml-2">
                    <Check className="inline w-3 h-3" /> Available
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    handleError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="johndoe"
                  required
                />
              </div>
              {handleError && (
                <p className="text-xs text-red-600 mt-1">{handleError}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Dublin"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Social Media & Contact */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media & Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="@username"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TikTok
                </label>
                <div className="relative">
                  <Music2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={tiktokHandle}
                    onChange={(e) => setTiktokHandle(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="@username"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="+353..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Contributor-specific fields */}
          {isContributor && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Creator Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {EQUIPMENT_OPTIONS.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem(equipment, setEquipment, item)}
                        className={`px-3 py-2 text-sm rounded-lg transition ${
                          equipment.includes(item)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Editing Software
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SOFTWARE_OPTIONS.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem(software, setSoftware, item)}
                        className={`px-3 py-2 text-sm rounded-lg transition ${
                          software.includes(item)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasStudio}
                      onChange={(e) => setHasStudio(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">I have a studio</span>
                  </label>
                  
                  {hasStudio && (
                    <input
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Studio name"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typical Turnaround (days)
                  </label>
                  <input
                    type="number"
                    value={turnaroundDays}
                    onChange={(e) => setTurnaroundDays(parseInt(e.target.value) || 7)}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Talent-specific fields */}
          {isTalent && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Talent Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TALENT_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleArrayItem(talentCategories, setTalentCategories, cat)}
                        className={`px-3 py-2 text-sm rounded-lg transition ${
                          talentCategories.includes(cat)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      min="100"
                      max="250"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                      placeholder="175"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eye Color
                    </label>
                    <select
                      value={eyeColor}
                      onChange={(e) => setEyeColor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                    >
                      <option value="">Select...</option>
                      {EYE_COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hair Color
                    </label>
                    <select
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                    >
                      <option value="">Select...</option>
                      {HAIR_COLORS.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTattoos}
                      onChange={(e) => setHasTattoos(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Has tattoos</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPiercings}
                      onChange={(e) => setHasPiercings(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Has piercings</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Travel availability */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableForTravel}
                  onChange={(e) => setAvailableForTravel(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Available for travel</span>
              </label>
              
              {availableForTravel && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Within</span>
                  <input
                    type="number"
                    value={travelRadiusKm}
                    onChange={(e) => setTravelRadiusKm(parseInt(e.target.value) || 50)}
                    min="10"
                    max="500"
                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-600">km</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Back
          </button>
          
          <button
            onClick={handleSave}
            disabled={!displayName || !handle || !handleAvailable || !city}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}