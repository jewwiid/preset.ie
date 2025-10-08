'use client'

import { useStreamlinedProfile } from '../StreamlinedProfileProvider'
import { usePredefinedOptions, getOptionNames } from '../../../../lib/hooks/use-predefined-options'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Label } from '../../../../components/ui/label'
import { Badge } from '../../../../components/ui/badge'
import { 
  User, 
  MapPin, 
  Globe, 
  Instagram, 
  Link, 
  Check,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react'

const COUNTRIES = [
  'Ireland', 'United Kingdom', 'United States', 'Canada', 'Australia',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  'Sweden', 'Denmark', 'Norway', 'Poland', 'Other'
]

export function EssentialProfileStep() {
  const { 
    handleProfileSubmit, 
    setCurrentStep, 
    selectedRole,
    firstName, 
    setFirstName,
    lastName, 
    setLastName,
    displayName, 
    setDisplayName,
    handle, 
    setHandle,
    handleError,
    handleAvailable,
    profileData,
    setProfileData,
    selectedFile,
    setSelectedFile,
    avatarPreview,
    setAvatarPreview,
    existingAvatarUrl,
    setExistingAvatarUrl
  } = useStreamlinedProfile()

  const { options: predefinedOptions, loading: optionsLoading } = usePredefinedOptions()

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return
      }
      
      try {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
        setSelectedFile(file)
      } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error processing image:', error)
        }
      }
    }
  }

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          Add your basic information and profile photo
        </p>
      </div>

      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarPreview ? (
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
                <img 
                  src={avatarPreview} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : existingAvatarUrl ? (
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted">
                <img 
                  src={existingAvatarUrl} 
                  alt="Current profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            {(avatarPreview || existingAvatarUrl) && (
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview('')
                  setSelectedFile(null)
                  setExistingAvatarUrl('')
                }}
                className="absolute -top-1 -right-1 bg-destructive text-primary-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">{existingAvatarUrl ? 'Change Photo' : 'Choose Photo'}</span>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="pl-10"
              placeholder="Emma"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="pl-10"
              placeholder="Thompson"
              required
            />
          </div>
        </div>
      </div>

      {/* Display Name and Handle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">
            Display Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="pl-10"
              placeholder="John Doe"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="handle">
            Handle * {handleAvailable && handle && (
              <Badge variant="secondary" className="ml-2">
                <Check className="inline w-3 h-3 mr-1" /> Available
              </Badge>
            )}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
            <Input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              className={`pl-8 ${handleError ? 'border-destructive' : ''}`}
              placeholder="johndoe"
              required
            />
          </div>
          {handleError && (
            <p className="text-xs text-destructive">{handleError}</p>
          )}
        </div>
      </div>
      
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">
          Bio
        </Label>
        <Textarea
          id="bio"
          value={profileData.bio || ''}
          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
          placeholder="Tell us about yourself..."
        />
      </div>
      
      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">
            City *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="city"
              type="text"
              value={profileData.city || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
              className="pl-10"
              placeholder="Dublin"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">
            Country *
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Select 
              value={profileData.country || 'Ireland'} 
              onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Primary Skill - REQUIRED */}
      <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary mb-2">
          What's your primary skill? <span className="text-destructive-500 ml-1">*</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This will be shown on your profile and in directory listings
        </p>

        {selectedRole === 'CONTRIBUTOR' && (
          <Select
            value={profileData.primarySkill || ''}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, primarySkill: value }))}
            disabled={optionsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your primary skill..." />
            </SelectTrigger>
            <SelectContent>
              {getOptionNames(predefinedOptions.skills).map(skill => (
                <SelectItem key={skill} value={skill}>{skill}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedRole === 'TALENT' && (
          <Select
            value={profileData.primarySkill || ''}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, primarySkill: value }))}
            disabled={optionsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your primary category..." />
            </SelectTrigger>
            <SelectContent>
              {getOptionNames(predefinedOptions.talentCategories).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedRole === 'BOTH' && (
          <Select
            value={profileData.primarySkill || ''}
            onValueChange={(value) => setProfileData(prev => ({ ...prev, primarySkill: value }))}
            disabled={optionsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your primary skill..." />
            </SelectTrigger>
            <SelectContent>
              <optgroup label="Contributor Skills">
                {getOptionNames(predefinedOptions.skills).map(skill => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </optgroup>
              <optgroup label="Talent Categories">
                {getOptionNames(predefinedOptions.talentCategories).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </optgroup>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Social Media (Optional) */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Social Media (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">
              Instagram
            </Label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="instagramHandle"
                type="text"
                value={profileData.instagramHandle || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, instagramHandle: e.target.value }))}
                className="pl-10"
                placeholder="@username"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">
              Website
            </Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="websiteUrl"
                type="url"
                value={profileData.websiteUrl || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                className="pl-10"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('role')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </form>
  )
}
