# Smart Suggestions Enhancement Plan

## 📊 Current Implementation Analysis

### **Location**: `apps/web/components/dashboard/SmartSuggestionsCard.tsx`

### **Current Suggestions** (Static):
1. **Premium Creator Status** - If years_experience >= 3
2. **Specialization Opportunities** - If has specializations
3. **Rate Optimization** - If has hourly rates
4. **Travel Opportunities** - If available_for_travel
5. **Complete Profile** - If profile is empty

### **Problems with Current Approach**:
- ❌ Generic messages (not personalized)
- ❌ Doesn't use matching data
- ❌ Doesn't use profile completion percentage
- ❌ Doesn't suggest specific actions
- ❌ No AI/smart logic, just conditional display

---

## 🚀 **Proposed Enhancements**

### **1. Profile Completion Integration** ✨

#### **Current Profile Completion Display:**
```
Profile Completion: 89%
[Complete your profile to increase visibility →]
```

#### **Enhanced Smart Suggestion:**
```tsx
{profile.profile_completion_percentage < 100 && (
  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-amber-500 rounded-full">
        <AlertCircle className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-600">
          {profile.profile_completion_percentage}% Profile Complete
        </p>
        <p className="text-xs text-amber-600/80 mt-1">
          Complete your {getMissingFieldsMessage()} to increase visibility by 
          {100 - profile.profile_completion_percentage}% and get more relevant matches.
        </p>
        <button className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium">
          Add {getTopMissingField()} →
        </button>
      </div>
    </div>
  </div>
)}
```

**Examples:**
- 89% complete → "Add portfolio URL to reach 97%"
- 75% complete → "Add bio and specializations to reach 95%"
- 50% complete → "Complete 5 key fields to improve matches"

---

### **2. Matchmaking-Based Suggestions** 🎯

#### **Integration with Gig Matching:**

```tsx
// Get user's top gig matches
const topMatches = await getTopGigMatches(profile.id, 3)

{topMatches && topMatches.length > 0 && (
  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-green-500 rounded-full">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-green-600">
          {topMatches.length} Perfect Matches Found!
        </p>
        <p className="text-xs text-green-600/80 mt-1">
          "{topMatches[0].title}" in {topMatches[0].city} is a {topMatches[0].score}% match. 
          Apply now before the deadline!
        </p>
        <button className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium">
          View Gig →
        </button>
      </div>
    </div>
  </div>
)}
```

**Examples:**
- "3 Perfect Matches Found! 'Fashion Editorial' in London is a 95% match"
- "New gig matches your profile! 'Model Casting' needs your specializations"
- "High-paying match! €200/hour gig matches your rate range"

---

### **3. Role-Specific Suggestions** 🎭

#### **For TALENT Users:**

```tsx
{profile.role_flags.includes('TALENT') && (
  <>
    {/* Gig Availability */}
    {getAvailableGigsCount(profile.city) > 0 && (
      <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
        <p className="text-sm font-medium text-blue-600">
          {getAvailableGigsCount(profile.city)} Gigs in {profile.city}
        </p>
        <p className="text-xs text-blue-600/80 mt-1">
          {getGigsByRole('MODELS').length} model gigs near you. 
          Your profile is a {getAverageMatchScore()}% average match.
        </p>
      </div>
    )}
    
    {/* Portfolio Improvement */}
    {!profile.portfolio_url && (
      <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-sm font-medium text-purple-600">
          Portfolio Missing
        </p>
        <p className="text-xs text-purple-600/80 mt-1">
          Adding a portfolio URL increases your match score by 15-20% on average.
          {getPortfolioGigsRequiringIt()} gigs require portfolios.
        </p>
      </div>
    )}
  </>
)}
```

#### **For CONTRIBUTOR Users:**

```tsx
{profile.role_flags.includes('CONTRIBUTOR') && (
  <>
    {/* Gig Creation Prompt */}
    {getUserGigsCount() === 0 && (
      <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
        <p className="text-sm font-medium text-emerald-600">
          Create Your First Gig
        </p>
        <p className="text-xs text-emerald-600/80 mt-1">
          {getTalentInArea(profile.city).length} talents in {profile.city} match your specializations. 
          Post a gig to connect with them!
        </p>
      </div>
    )}
    
    {/* Applicant Stats */}
    {getUserGigsCount() > 0 && (
      <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
        <p className="text-sm font-medium text-indigo-600">
          Application Activity
        </p>
        <p className="text-xs text-indigo-600/80 mt-1">
          Your "{getMostRecentGig().title}" gig has {getApplicationCount()} applications. 
          Avg match quality: {getAverageApplicantScore()}%
        </p>
      </div>
    )}
  </>
)}
```

---

### **4. Smart Matchmaking Insights** 🧠

```tsx
// Calculate what improves their match scores
const matchingInsights = analyzeMatchingPotential(profile)

{matchingInsights.improvements.length > 0 && (
  <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-orange-500 rounded-full">
        <TrendingUp className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-orange-600">
          Improve Your Match Score
        </p>
        <p className="text-xs text-orange-600/80 mt-1">
          {matchingInsights.topImprovement.action} would increase your average 
          match score from {matchingInsights.current}% to {matchingInsights.potential}%
        </p>
        <ul className="mt-2 text-xs text-orange-600/80 space-y-1">
          {matchingInsights.improvements.slice(0, 3).map(imp => (
            <li key={imp.field}>• {imp.message}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

**Examples:**
- "Adding height info would match 12 more model gigs"
- "Listing equipment would improve photographer gig matches by 25%"
- "Available for travel? Unlocks 8 additional gigs in nearby cities"

---

### **5. Profile Completion Breakdown** 📊

```tsx
// Show what's missing categorized by impact
const missingFields = calculateMissingFields(profile)

{missingFields.highImpact.length > 0 && (
  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-red-500 rounded-full">
        <AlertTriangle className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-600">
          High-Impact Fields Missing
        </p>
        <p className="text-xs text-red-600/80 mt-1">
          These fields have the biggest impact on your visibility:
        </p>
        <div className="mt-2 space-y-1">
          {missingFields.highImpact.map(field => (
            <div key={field.key} className="flex items-center justify-between text-xs">
              <span className="text-red-600/80">{field.label}</span>
              <span className="text-red-600 font-medium">+{field.weight} points</span>
            </div>
          ))}
        </div>
        <button className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium">
          Add Now →
        </button>
      </div>
    </div>
  </div>
)}
```

**Example**:
```
High-Impact Fields Missing
• Specializations: +15 points
• Bio: +10 points
• Hourly Rate: +10 points
Total potential: +35% completion
```

---

## 🎨 **Implementation Plan**

### **Phase 1: Profile Completion Integration** (2-3 hours)

#### **1.1: Create Helper Functions**

```typescript
// File: apps/web/lib/utils/smart-suggestions.ts

export function getMissingFields(profile: UserProfile) {
  const PROFILE_FIELDS = [
    { key: 'bio', label: 'Bio', weight: 10, category: 'high' },
    { key: 'specializations', label: 'Specializations', weight: 15, category: 'high' },
    { key: 'hourly_rate_min', label: 'Hourly Rate', weight: 10, category: 'high' },
    { key: 'portfolio_url', label: 'Portfolio', weight: 8, category: 'medium' },
    { key: 'equipment_list', label: 'Equipment', weight: 8, category: 'medium' },
    // ... etc
  ]
  
  return PROFILE_FIELDS.filter(field => {
    const value = profile[field.key]
    return !value || (Array.isArray(value) && value.length === 0)
  })
}

export function getTopMissingField(profile: UserProfile) {
  const missing = getMissingFields(profile)
  const sorted = missing.sort((a, b) => b.weight - a.weight)
  return sorted[0]?.label || 'profile'
}

export function calculateProfileImpact(profile: UserProfile) {
  const missing = getMissingFields(profile)
  const highImpact = missing.filter(f => f.category === 'high')
  const potentialGain = highImpact.reduce((sum, f) => sum + f.weight, 0)
  
  return {
    current: profile.profile_completion_percentage,
    potential: Math.min(100, profile.profile_completion_percentage + potentialGain),
    highImpactFields: highImpact,
    totalMissing: missing.length
  }
}
```

#### **1.2: Update SmartSuggestionsCard**

```tsx
import { getMissingFields, getTopMissingField, calculateProfileImpact } from '@/lib/utils/smart-suggestions'

export function SmartSuggestionsCard({ profile }: SmartSuggestionsCardProps) {
  const impact = calculateProfileImpact(profile)
  const topMissing = getTopMissingField(profile)
  
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      {/* Profile Completion Suggestion */}
      {profile.profile_completion_percentage < 100 && (
        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-600">
                {profile.profile_completion_percentage}% Profile Complete
              </p>
              <p className="text-xs text-amber-600/80 mt-1">
                Add {topMissing} to boost visibility and match {impact.potential}% more gigs
              </p>
              <button 
                onClick={() => router.push('/profile')}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Complete {topMissing} (+{impact.highImpactFields[0]?.weight} points) →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Rest of suggestions... */}
    </div>
  )
}
```

---

### **Phase 2: Matchmaking Integration** (4-5 hours)

#### **2.1: Create Matchmaking Suggestions Hook**

```typescript
// File: apps/web/lib/hooks/dashboard/useSmartSuggestions.ts

export function useSmartSuggestions(profile: UserProfile) {
  const [topMatches, setTopMatches] = useState<GigMatch[]>([])
  const [matchingInsights, setMatchingInsights] = useState<MatchingInsights | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchSuggestions() {
      if (!profile.id) return
      
      // Get top 3 gig matches
      const { data: matches } = await supabase
        .rpc('find_compatible_gigs_for_user', { p_profile_id: profile.id, p_limit: 3 })
      
      setTopMatches(matches || [])
      
      // Analyze what would improve their matches
      const insights = await analyzeMatchingPotential(profile)
      setMatchingInsights(insights)
      
      setLoading(false)
    }
    
    fetchSuggestions()
  }, [profile.id])
  
  return { topMatches, matchingInsights, loading }
}

// Analyze what fields would improve matching
async function analyzeMatchingPotential(profile: UserProfile) {
  const improvements = []
  
  // Check if adding height would help
  if (!profile.height_cm) {
    const gigsNeedingHeight = await supabase
      .from('gigs')
      .select('id')
      .filter('applicant_preferences->physical->height_range', 'not.is', null)
      .filter('status', 'eq', 'PUBLISHED')
    
    if (gigsNeedingHeight.data && gigsNeedingHeight.data.length > 0) {
      improvements.push({
        field: 'height_cm',
        action: 'Add your height',
        message: `${gigsNeedingHeight.data.length} model gigs require height info`,
        impact: 15,
        category: 'physical'
      })
    }
  }
  
  // Check if adding equipment would help
  if (!profile.equipment_list || profile.equipment_list.length === 0) {
    const gigsNeedingEquipment = await supabase
      .from('gigs')
      .select('id')
      .contains('looking_for_types', ['PHOTOGRAPHERS'])
    
    if (gigsNeedingEquipment.data && gigsNeedingEquipment.data.length > 0) {
      improvements.push({
        field: 'equipment_list',
        action: 'List your equipment',
        message: `${gigsNeedingEquipment.data.length} photographer gigs need equipment info`,
        impact: 20,
        category: 'professional'
      })
    }
  }
  
  // Check if portfolio would help
  if (!profile.portfolio_url) {
    const gigsNeedingPortfolio = await supabase
      .from('gigs')
      .select('id')
      .filter('applicant_preferences->professional->portfolio_required', 'eq', true)
    
    if (gigsNeedingPortfolio.data && gigsNeedingPortfolio.data.length > 0) {
      improvements.push({
        field: 'portfolio_url',
        action: 'Add portfolio link',
        message: `Required for ${gigsNeedingPortfolio.data.length} premium gigs`,
        impact: 25,
        category: 'professional'
      })
    }
  }
  
  return {
    current: calculateCurrentMatchScore(profile),
    potential: calculatePotentialMatchScore(profile, improvements),
    improvements: improvements.sort((a, b) => b.impact - a.impact),
    topImprovement: improvements[0]
  }
}
```

#### **2.2: Display Matchmaking Suggestions**

```tsx
{matchingInsights && matchingInsights.improvements.length > 0 && (
  <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-purple-500 rounded-full">
        <TrendingUp className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-purple-600">
          Unlock More Matches
        </p>
        <p className="text-xs text-purple-600/80 mt-1">
          {matchingInsights.topImprovement.action} to match {matchingInsights.topImprovement.gigCount} more gigs
        </p>
        <ul className="mt-2 text-xs text-purple-600/80 space-y-1">
          {matchingInsights.improvements.slice(0, 3).map(imp => (
            <li key={imp.field}>• {imp.message} (+{imp.impact}% match score)</li>
          ))}
        </ul>
        <button className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium">
          {matchingInsights.topImprovement.action} →
        </button>
      </div>
    </div>
  </div>
)}
```

**Examples:**
- "Add height info to match 12 more model gigs (+15% score)"
- "List equipment to unlock 8 photographer gigs (+20% score)"
- "Add portfolio to qualify for 15 premium gigs (+25% score)"

---

### **Phase 3: Intelligent Recommendations** (3-4 hours)

#### **3.1: Location-Based Suggestions**

```tsx
{/* Gigs in nearby cities */}
{profile.available_for_travel && getNearbyGigs(profile.city).length > 0 && (
  <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
    <p className="text-sm font-medium text-cyan-600">
      Nearby Opportunities
    </p>
    <p className="text-xs text-cyan-600/80 mt-1">
      {getNearbyGigs(profile.city)[0].city} ({getNearbyGigs(profile.city)[0].distance}km away) 
      has {getNearbyGigs(profile.city).length} gigs matching your profile.
    </p>
  </div>
)}
```

#### **3.2: Timing-Based Suggestions**

```tsx
{/* Deadlines approaching */}
{getGigsWithDeadlines(3).length > 0 && (
  <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
    <p className="text-sm font-medium text-rose-600">
      ⏰ Deadlines Approaching
    </p>
    <p className="text-xs text-rose-600/80 mt-1">
      {getGigsWithDeadlines(3).length} gigs close applications in the next 3 days. 
      Apply now to secure your spot!
    </p>
  </div>
)}
```

#### **3.3: Market Intelligence**

```tsx
{/* Rate comparison */}
{profile.hourly_rate_min && (
  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
    <p className="text-sm font-medium text-emerald-600">
      Market Rate Analysis
    </p>
    <p className="text-xs text-emerald-600/80 mt-1">
      Your rate (€{profile.hourly_rate_min}-{profile.hourly_rate_max}/hour) is 
      {compareToMarketRate(profile)} the average for {profile.primary_skill} 
      in {profile.country}.
      {getRateRecommendation(profile)}
    </p>
  </div>
)}
```

**Examples:**
- "15% above average - great positioning!"
- "20% below market - consider increasing rates"
- "Competitive for your experience level"

---

## 📊 **Data Sources Integration**

### **From Profile Completion System:**
```typescript
- profile.profile_completion_percentage  // 89%
- calculateMissingFields()                // What's missing
- getApplicableFields()                   // Role-aware fields
- categoryProgress                        // By category
```

### **From Matchmaking System:**
```typescript
- find_compatible_gigs_for_user()        // Top matches
- calculate_gig_compatibility()           // Match scores
- role_match_status                       // Perfect/Partial/None
- matched_attributes                      // What matches
- missing_requirements                    // What's missing
```

### **From Gig System:**
```typescript
- looking_for_types                       // What gigs need
- applicant_preferences                   // Gig requirements
- city, country                           // Location data
- application_deadline                    // Timing data
```

---

## 🎯 **Mockup: Enhanced Smart Suggestions**

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Smart Suggestions                                         │
│ Based on your profile, matches, and market data             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 89% Profile Complete                                     │
│ Add Portfolio URL to reach 97% and match 15% more gigs      │
│ [Add Portfolio URL (+8 points) →]                           │
│                                                              │
│ ✨ 3 Perfect Matches Found!                                 │
│ "Fashion Editorial" in London is a 95% match                │
│ Apply before Oct 12 deadline                                │
│ [View Gig →]                                                │
│                                                              │
│ 📈 Improve Your Match Score                                 │
│ Adding height info would increase avg match from 75% to 90% │
│ • 12 model gigs require height (+15% score)                 │
│ • 8 gigs prefer your specializations (+10% score)           │
│ [Add Height Info →]                                         │
│                                                              │
│ ⏰ Deadline Alert                                           │
│ 2 high-match gigs close in 3 days                          │
│ "Urban Fashion Shoot" (89% match) - Apply now!              │
│ [View Urgent Gigs →]                                        │
│                                                              │
│ 💰 Rate Optimization                                        │
│ Your €50-150/hour is competitive for Fashion Photography    │
│ Top earners in your area charge €120-200/hour              │
│ [See Market Data →]                                         │
│                                                              │
│ 🌍 Nearby Opportunities                                     │
│ Dublin (85km away) has 5 gigs matching your profile         │
│ Travel availability unlocks €800 more in potential earnings │
│ [Explore Nearby →]                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Implementation Priority**

### **Quick Wins (1-2 hours)**:
1. ✅ Profile completion percentage display
2. ✅ Top missing field suggestion
3. ✅ Simple "Complete X to reach Y%" messaging

### **Medium Impact (3-4 hours)**:
4. ✅ Top 3 gig matches display
5. ✅ Match score insights
6. ✅ Missing fields breakdown

### **Advanced Features (5-8 hours)**:
7. ✅ Market rate comparison
8. ✅ Location-based suggestions
9. ✅ Deadline alerts
10. ✅ Full matching analysis

---

## 💡 **Smart Suggestion Types by User State**

### **For New Users (< 50% complete)**:
- 🔴 "Complete Profile" (high priority)
- 📝 "Add bio and specializations first"
- 💼 "Set your hourly rate to appear in searches"

### **For Partial Users (50-90% complete)**:
- 🟡 "Almost there! Add portfolio for +10%"
- 🎯 "3 gigs match your profile - complete profile to improve matches"
- 📊 "You're missing 5 high-impact fields"

### **For Complete Users (90-100%)**:
- 🟢 "Great profile! 12 gigs match your skills"
- ✨ "Top match: 'Fashion Editorial' (95%)"
- 💰 "Rate optimization: Consider raising rates"

---

## ✅ **Summary**

**YES, absolutely!** We can integrate:

1. **Profile Completion Data**:
   - Show missing fields with impact scores
   - Calculate potential improvement
   - Suggest highest-impact fields first

2. **Matchmaking Data**:
   - Show top gig matches with scores
   - Explain what would improve matches
   - Highlight missing requirements for specific gigs

3. **Combined Intelligence**:
   - "Add height (+10%) to match 12 more gigs"
   - "Complete bio to appear in 8 searches"
   - "Your profile matches 85% of model gigs in London"

**Next Step**: Want me to implement the enhanced Smart Suggestions now? 🚀

