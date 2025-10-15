'use client'

import { ChevronRight, FileText, Target, DollarSign, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CompType, BudgetType, PurposeType, LookingForType } from '../../../lib/gig-form-persistence'
import VoiceToTextButton from '@/components/ui/VoiceToTextButton'

interface BasicDetailsStepProps {
  title: string
  description: string
  lookingFor?: LookingForType[]  // Changed to array for multi-select
  purpose: PurposeType
  compType: CompType
  compDetails: string
  budgetMin?: number | null
  budgetMax?: number | null
  budgetType?: BudgetType
  userSubscriptionTier?: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onLookingForChange?: (value: LookingForType[]) => void  // Changed to array
  onPurposeChange: (value: PurposeType) => void
  onCompTypeChange: (value: CompType) => void
  onCompDetailsChange: (value: string) => void
  onBudgetMinChange?: (value: number | null) => void
  onBudgetMaxChange?: (value: number | null) => void
  onBudgetTypeChange?: (value: BudgetType) => void
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
  budgetMin,
  budgetMax,
  budgetType = 'hourly',
  userSubscriptionTier = 'FREE',
  onTitleChange,
  onDescriptionChange,
  onLookingForChange,
  onPurposeChange,
  onCompTypeChange,
  onCompDetailsChange,
  onBudgetMinChange,
  onBudgetMaxChange,
  onBudgetTypeChange,
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
                <SelectItem value="Model">Models</SelectItem>
                <SelectItem value="Fashion Model">  • Fashion Models</SelectItem>
                <SelectItem value="Commercial Model">  • Commercial Models</SelectItem>
                <SelectItem value="Fitness Model">  • Fitness Models</SelectItem>
                <SelectItem value="Plus-Size Model">  • Plus-Size Models</SelectItem>
                <SelectItem value="Hand Model">  • Hand Models</SelectItem>
                <SelectItem value="Actor">Actors / Actresses</SelectItem>
                <SelectItem value="Actress">Actresses</SelectItem>
                <SelectItem value="Dancer">Dancers</SelectItem>
                <SelectItem value="Musician">Musicians</SelectItem>
                <SelectItem value="Singer">Singers</SelectItem>
                <SelectItem value="Voice Actor">Voice Actors</SelectItem>
                <SelectItem value="Performer">Performers</SelectItem>
                <SelectItem value="Influencer">Influencers</SelectItem>
                <SelectItem value="Content Creator">Content Creators</SelectItem>
                <SelectItem value="Stunt Performer">Stunt Performers</SelectItem>
                <SelectItem value="Extra/Background Actor">Background Actors</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 📸 Visual Creators */}
              <SelectGroup>
                <SelectLabel>📸 Visual Creators</SelectLabel>
                <SelectItem value="Photographer">Photographers</SelectItem>
                <SelectItem value="Videographer">Videographers</SelectItem>
                <SelectItem value="Cinematographer">Cinematographers</SelectItem>
                <SelectItem value="Drone Operator">Drone Operators</SelectItem>
                <SelectItem value="Camera Operator">Camera Operators</SelectItem>
                <SelectItem value="BTS Photographer">BTS Photographers</SelectItem>
                <SelectItem value="Product Photographer">Product Photographers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎬 Production & Crew */}
              <SelectGroup>
                <SelectLabel>🎬 Production & Crew</SelectLabel>
                <SelectItem value="Producer">Producers</SelectItem>
                <SelectItem value="Director">Directors</SelectItem>
                <SelectItem value="Creative Director">Creative Directors</SelectItem>
                <SelectItem value="Art Director">Art Directors</SelectItem>
                <SelectItem value="Production Assistant">Production Assistants</SelectItem>
                <SelectItem value="Location Scout">Location Scouts</SelectItem>
                <SelectItem value="Production Manager">Production Managers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 💄 Styling & Beauty */}
              <SelectGroup>
                <SelectLabel>💄 Styling & Beauty</SelectLabel>
                <SelectItem value="Makeup Artist">Makeup Artists</SelectItem>
                <SelectItem value="Hair Stylist">Hair Stylists</SelectItem>
                <SelectItem value="Fashion Stylist">Fashion Stylists</SelectItem>
                <SelectItem value="Wardrobe Stylist">Wardrobe Stylists</SelectItem>
                <SelectItem value="Nail Technician">Nail Technicians</SelectItem>
                <SelectItem value="Beauty Artist">Beauty Artists</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎨 Post-Production */}
              <SelectGroup>
                <SelectLabel>🎨 Post-Production</SelectLabel>
                <SelectItem value="Video Editor">Video Editors</SelectItem>
                <SelectItem value="Photo Editor">Photo Editors</SelectItem>
                <SelectItem value="VFX Artist">VFX Artists</SelectItem>
                <SelectItem value="Motion Graphics Artist">Motion Graphics Artists</SelectItem>
                <SelectItem value="Retoucher">Retouchers</SelectItem>
                <SelectItem value="Color Grader">Color Graders</SelectItem>
                <SelectItem value="Sound Editor">Sound Editors</SelectItem>
                <SelectItem value="Video Colorist">Video Colorists</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎨 Design & Creative */}
              <SelectGroup>
                <SelectLabel>🎨 Design & Creative</SelectLabel>
                <SelectItem value="Graphic Designer">Graphic Designers</SelectItem>
                <SelectItem value="Illustrator">Illustrators</SelectItem>
                <SelectItem value="Animator">Animators</SelectItem>
                <SelectItem value="UI/UX Designer">UI/UX Designers</SelectItem>
                <SelectItem value="Web Designer">Web Designers</SelectItem>
                <SelectItem value="Brand Designer">Brand Designers</SelectItem>
                <SelectItem value="Logo Designer">Logo Designers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 📱 Content & Social */}
              <SelectGroup>
                <SelectLabel>📱 Content & Social</SelectLabel>
                <SelectItem value="Social Media Manager">Social Media Managers</SelectItem>
                <SelectItem value="Digital Marketer">Digital Marketers</SelectItem>
                <SelectItem value="Copywriter">Copywriters</SelectItem>
                <SelectItem value="Content Strategist">Content Strategists</SelectItem>
                <SelectItem value="Community Manager">Community Managers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 💼 Business & Teams */}
              <SelectGroup>
                <SelectLabel>💼 Business & Teams</SelectLabel>
                <SelectItem value="Marketing Manager">Marketing Managers</SelectItem>
                <SelectItem value="Brand Manager">Brand Managers</SelectItem>
                <SelectItem value="Project Manager">Project Managers</SelectItem>
                <SelectItem value="Account Manager">Account Managers</SelectItem>
                <SelectItem value="Studio Owner">Studio Owners</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* ✍️ Writing */}
              <SelectGroup>
                <SelectLabel>✍️ Writing</SelectLabel>
                <SelectItem value="Writer">Writers</SelectItem>
                <SelectItem value="Copywriter">Copywriters</SelectItem>
                <SelectItem value="Scriptwriter">Scriptwriters</SelectItem>
                <SelectItem value="Technical Writer">Technical Writers</SelectItem>
                <SelectItem value="Content Writer">Content Writers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🎵 Music & Audio */}
              <SelectGroup>
                <SelectLabel>🎵 Music & Audio</SelectLabel>
                <SelectItem value="Music Producer">Music Producers</SelectItem>
                <SelectItem value="Audio Engineer">Audio Engineers</SelectItem>
                <SelectItem value="Sound Designer">Sound Designers</SelectItem>
                <SelectItem value="Composer">Composers</SelectItem>
                <SelectItem value="DJ">DJs</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* 🏠 Studios & Spaces */}
              <SelectGroup>
                <SelectLabel>🏠 Studios & Spaces</SelectLabel>
                <SelectItem value="Studio Owner">Studio Owners</SelectItem>
                <SelectItem value="Rental Studio">Rental Studios</SelectItem>
                <SelectItem value="Venue Manager">Venue Managers</SelectItem>
                <SelectItem value="Space Manager">Space Managers</SelectItem>
              </SelectGroup>

              <SelectSeparator />

              {/* Other */}
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                <SelectItem value="Other Creative Professional">Other Creative Roles</SelectItem>
                <SelectItem value="Assistant">Assistants</SelectItem>
                <SelectItem value="Intern">Interns</SelectItem>
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
          <div className="relative">
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full px-4 py-3 pr-14 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
              placeholder="Describe your shoot concept, what you're looking for, and any specific requirements..."
            />
            <div className="absolute right-2 bottom-2">
                <VoiceToTextButton
                  onAppendText={async (text) => {
                    // Typewriter effect
                    const base = description.endsWith(' ') || !description ? description : description + ' ';
                    let out = base;
                    onDescriptionChange(out);
                    for (let i = 0; i < text.length; i++) {
                      out += text[i];
                      onDescriptionChange(out);
                      await new Promise(r => setTimeout(r, 8));
                    }
                  }}
                  userSubscriptionTier={userSubscriptionTier as 'FREE' | 'PLUS' | 'PRO'}
                  size={32}
                />
            </div>
          </div>
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

        {/* Budget Fields - Only show for PAID gigs */}
        {compType === 'PAID' && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Budget Range (Optional)</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Setting a budget helps matchmaking by connecting you with talent in your price range
            </p>

            {/* Budget Type Selector */}
            <div>
              <Label htmlFor="budget-type" className="text-sm mb-2">Budget Type</Label>
              <Select value={budgetType || 'hourly'} onValueChange={(value) => onBudgetTypeChange?.(value as BudgetType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select budget type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Per Hour (€/hour)</SelectItem>
                  <SelectItem value="per_day">Per Day (€/day)</SelectItem>
                  <SelectItem value="per_project">Per Project (total)</SelectItem>
                  <SelectItem value="total">Total Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget Min/Max */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget-min" className="text-sm mb-2">
                  Minimum Budget (€)
                </Label>
                <Input
                  id="budget-min"
                  type="number"
                  min="0"
                  step="5"
                  value={budgetMin ?? ''}
                  onChange={(e) => onBudgetMinChange?.(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 50"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="budget-max" className="text-sm mb-2">
                  Maximum Budget (€)
                </Label>
                <Input
                  id="budget-max"
                  type="number"
                  min="0"
                  step="5"
                  value={budgetMax ?? ''}
                  onChange={(e) => onBudgetMaxChange?.(e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 150"
                  className="w-full"
                />
              </div>
            </div>

            {budgetMin && budgetMax && budgetMin > budgetMax && (
              <p className="text-xs text-destructive">
                ⚠️ Minimum budget should be less than maximum budget
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-end pt-6 border-t border-border">
          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Continue to Schedule
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}