'use client'

import { ChevronRight, FileText, Target, DollarSign, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CompType, PurposeType, LookingForType } from '../../../lib/gig-form-persistence'

interface BasicDetailsStepProps {
  title: string
  description: string
  lookingFor?: LookingForType[]  // Changed to array for multi-select
  purpose: PurposeType
  compType: CompType
  compDetails: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onLookingForChange?: (value: LookingForType[]) => void  // Changed to array
  onPurposeChange: (value: PurposeType) => void
  onCompTypeChange: (value: CompType) => void
  onCompDetailsChange: (value: string) => void
  onNext: () => void
  isValid: boolean
}

export default function BasicDetailsStep({
  title,
  description,
  lookingFor,
  purpose,
  compType,
  compDetails,
  onTitleChange,
  onDescriptionChange,
  onLookingForChange,
  onPurposeChange,
  onCompTypeChange,
  onCompDetailsChange,
  onNext,
  isValid
}: BasicDetailsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Basic Details</h2>
            <p className="text-muted-foreground text-sm">Let's start with the essential information about your gig</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Looking For - Multi-Select */}
        <div>
          <label htmlFor="looking-for" className="block text-sm font-medium text-foreground mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Who are you looking for? <span className="text-destructive">*</span>
            </div>
          </label>
          
          {/* Selected badges */}
          {lookingFor && lookingFor.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/50 rounded-lg border border-border">
              {lookingFor.map((type) => (
                <Badge key={type} variant="secondary" className="flex items-center gap-1">
                  {type.replace(/_/g, ' ')}
                  <button
                    type="button"
                    onClick={() => {
                      const newTypes = lookingFor.filter(t => t !== type)
                      onLookingForChange?.(newTypes)
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <Select value="" onValueChange={(value) => {
            const newType = value as LookingForType
            if (newType && !lookingFor?.includes(newType)) {
              onLookingForChange?.([...(lookingFor || []), newType])
            }
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={lookingFor && lookingFor.length > 0 ? "Add another role..." : "Select roles (you can choose multiple)"} />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {/* 🎭 Talent & Performers */}
              <SelectGroup>
                <SelectLabel>🎭 Talent & Performers</SelectLabel>
                <SelectItem value="MODELS">Models (All Types)</SelectItem>
                <SelectItem value="MODELS_FASHION">  • Fashion Models</SelectItem>
                <SelectItem value="MODELS_COMMERCIAL">  • Commercial Models</SelectItem>
                <SelectItem value="MODELS_FITNESS">  • Fitness Models</SelectItem>
                <SelectItem value="MODELS_EDITORIAL">  • Editorial Models</SelectItem>
                <SelectItem value="MODELS_RUNWAY">  • Runway Models</SelectItem>
                <SelectItem value="MODELS_HAND">  • Hand Models</SelectItem>
                <SelectItem value="MODELS_PARTS">  • Parts Models</SelectItem>
                <SelectItem value="ACTORS">Actors / Actresses</SelectItem>
                <SelectItem value="DANCERS">Dancers</SelectItem>
                <SelectItem value="MUSICIANS">Musicians</SelectItem>
                <SelectItem value="SINGERS">Singers</SelectItem>
                <SelectItem value="VOICE_ACTORS">Voice Actors</SelectItem>
                <SelectItem value="PERFORMERS">Performers</SelectItem>
                <SelectItem value="INFLUENCERS">Influencers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 📸 Visual Creators */}
              <SelectGroup>
                <SelectLabel>📸 Visual Creators</SelectLabel>
                <SelectItem value="PHOTOGRAPHERS">Photographers</SelectItem>
                <SelectItem value="VIDEOGRAPHERS">Videographers</SelectItem>
                <SelectItem value="CINEMATOGRAPHERS">Cinematographers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎬 Production & Crew */}
              <SelectGroup>
                <SelectLabel>🎬 Production & Crew</SelectLabel>
                <SelectItem value="PRODUCTION_CREW">Production Crew</SelectItem>
                <SelectItem value="PRODUCERS">Producers</SelectItem>
                <SelectItem value="DIRECTORS">Directors</SelectItem>
                <SelectItem value="CREATIVE_DIRECTORS">Creative Directors</SelectItem>
                <SelectItem value="ART_DIRECTORS">Art Directors</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 💄 Styling & Beauty */}
              <SelectGroup>
                <SelectLabel>💄 Styling & Beauty</SelectLabel>
                <SelectItem value="MAKEUP_ARTISTS">Makeup Artists</SelectItem>
                <SelectItem value="HAIR_STYLISTS">Hair Stylists</SelectItem>
                <SelectItem value="FASHION_STYLISTS">Fashion Stylists</SelectItem>
                <SelectItem value="WARDROBE_STYLISTS">Wardrobe Stylists</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎨 Post-Production */}
              <SelectGroup>
                <SelectLabel>🎨 Post-Production</SelectLabel>
                <SelectItem value="EDITORS">Editors (All Types)</SelectItem>
                <SelectItem value="VIDEO_EDITORS">  • Video Editors</SelectItem>
                <SelectItem value="PHOTO_EDITORS">  • Photo Editors</SelectItem>
                <SelectItem value="VFX_ARTISTS">VFX Artists</SelectItem>
                <SelectItem value="MOTION_GRAPHICS">Motion Graphics Artists</SelectItem>
                <SelectItem value="RETOUCHERS">Retouchers</SelectItem>
                <SelectItem value="COLOR_GRADERS">Color Graders</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎨 Design & Creative */}
              <SelectGroup>
                <SelectLabel>🎨 Design & Creative</SelectLabel>
                <SelectItem value="DESIGNERS">Designers (All Types)</SelectItem>
                <SelectItem value="GRAPHIC_DESIGNERS">  • Graphic Designers</SelectItem>
                <SelectItem value="ILLUSTRATORS">Illustrators</SelectItem>
                <SelectItem value="ANIMATORS">Animators</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 📱 Content & Social */}
              <SelectGroup>
                <SelectLabel>📱 Content & Social</SelectLabel>
                <SelectItem value="CONTENT_CREATORS">Content Creators</SelectItem>
                <SelectItem value="SOCIAL_MEDIA_MANAGERS">Social Media Managers</SelectItem>
                <SelectItem value="DIGITAL_MARKETERS">Digital Marketers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 💼 Business & Teams */}
              <SelectGroup>
                <SelectLabel>💼 Business & Teams</SelectLabel>
                <SelectItem value="AGENCIES">Agencies</SelectItem>
                <SelectItem value="BRAND_MANAGERS">Brand Managers</SelectItem>
                <SelectItem value="MARKETING_TEAMS">Marketing Teams</SelectItem>
                <SelectItem value="STUDIOS">Studios</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* ✍️ Writing */}
              <SelectGroup>
                <SelectLabel>✍️ Writing</SelectLabel>
                <SelectItem value="WRITERS">Writers</SelectItem>
                <SelectItem value="COPYWRITERS">Copywriters</SelectItem>
                <SelectItem value="SCRIPTWRITERS">Scriptwriters</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* Other */}
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                <SelectItem value="OTHER">Other Creative Roles</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            💡 Select one or more roles. This customizes the preferences step to show only relevant options and improves matchmaking quality.
          </p>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Gig Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="e.g., Fashion Editorial Shoot in Studio"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Write a clear, descriptive title that will attract the right talent
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
            placeholder="Describe your shoot concept, what you're looking for, and any specific requirements..."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Provide details about the concept, style, and what talent should expect (minimum 50 characters)
          </p>
          {description.length > 0 && description.length < 50 && (
            <p className="mt-1 text-xs text-destructive">
              {50 - description.length} more characters needed
            </p>
          )}
        </div>

        {/* Purpose and Compensation Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-foreground mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Purpose of Shoot <span className="text-destructive">*</span>
              </div>
            </label>
            <Select value={purpose} onValueChange={(value) => onPurposeChange(value as PurposeType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PORTFOLIO">Portfolio Building</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                <SelectItem value="EDITORIAL">Editorial</SelectItem>
                <SelectItem value="FASHION">Fashion</SelectItem>
                <SelectItem value="BEAUTY">Beauty</SelectItem>
                <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
                <SelectItem value="WEDDING">Wedding</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
                <SelectItem value="PRODUCT">Product</SelectItem>
                <SelectItem value="ARCHITECTURE">Architecture</SelectItem>
                <SelectItem value="STREET">Street</SelectItem>
                <SelectItem value="CONCEPTUAL">Conceptual</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compensation Type */}
          <div>
            <label htmlFor="comp-type" className="block text-sm font-medium text-foreground mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Compensation Type <span className="text-destructive">*</span>
              </div>
            </label>
            <Select value={compType} onValueChange={(value) => onCompTypeChange(value as CompType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select compensation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TFP">TFP (Time for Prints/Portfolio)</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="EXPENSES">Expenses Covered</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Compensation Details - Conditional */}
        {(compType === 'PAID' || compType === 'EXPENSES' || compType === 'OTHER') && (
          <div>
            <label htmlFor="comp-details" className="block text-sm font-medium text-foreground mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Compensation Details <span className="text-destructive">*</span>
              </div>
            </label>
            <textarea
              id="comp-details"
              required
              rows={3}
              value={compDetails}
              onChange={(e) => onCompDetailsChange(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
              placeholder={
                compType === 'PAID' 
                  ? "e.g., €150 per hour, €500 flat rate, includes 10 edited images..."
                  : compType === 'EXPENSES'
                  ? "e.g., Travel expenses covered, lunch provided, parking reimbursed..."
                  : "e.g., Equipment rental, mentorship, portfolio collaboration, skill exchange..."
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {compType === 'PAID' 
                ? "Specify the payment amount, rate, and what's included"
                : compType === 'EXPENSES'
                ? "Detail what expenses will be covered and any limits"
                : "Describe the alternative compensation arrangement clearly"
              }
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-end pt-6 border-t border-border">
          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="flex items-center gap-2"
          >
            Continue to Schedule
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}