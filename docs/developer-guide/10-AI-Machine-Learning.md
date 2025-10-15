# AI & Machine Learning - Preset Platform

## 🤖 AI-Powered Features Overview

Preset leverages artificial intelligence and machine learning to enhance user experience, automate content processing, and provide intelligent recommendations. The platform integrates multiple AI services to deliver a comprehensive suite of smart features.

## 🧠 Core AI Capabilities

### **1. Content Analysis & Enhancement**
- **Auto-tagging**: Automatically generate relevant tags for media content
- **Vibe Summaries**: AI-generated mood and style descriptions
- **Palette Extraction**: Automatic color palette generation from images
- **Blurhash Generation**: Efficient image placeholders
- **Shotlist Prompt Generation**: AI-assisted shotlist creation

### **2. Image Processing & Enhancement**
- **NanoBanana Integration**: Professional image enhancement
- **Stitch Feature**: Multi-image source import and processing
- **Style Transfer**: Apply artistic styles to images
- **Quality Enhancement**: Upscaling and noise reduction
- **Format Optimization**: Automatic format conversion and compression

### **3. Content Moderation**
- **NSFW Detection**: Automatic inappropriate content detection
- **Content Filtering**: User preference-based content filtering
- **Safety Scoring**: Confidence-based moderation decisions
- **Custom Type Detection**: User-defined content type recognition

### **4. Smart Recommendations**
- **Gig Matching**: AI-powered gig recommendations for talent
- **Profile Suggestions**: Personalized profile completion tips
- **Content Discovery**: Intelligent showcase and moodboard suggestions
- **Collaboration Matching**: Smart partner recommendations

## 🔧 AI Service Integration

### **NanoBanana API Integration**
Professional image enhancement service with credit-based pricing.

```typescript
// NanoBanana Service Integration
export class NanoBananaService {
  private apiKey: string;
  private baseUrl: string;
  private creditRatio: number = 4; // 1 user credit = 4 NanoBanana credits
  
  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async enhanceImage(imageUrl: string, enhancementType: string): Promise<EnhancedImage> {
    const response = await fetch(`${this.baseUrl}/enhance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        enhancement_type: enhancementType,
        quality: 'high'
      })
    });
    
    if (!response.ok) {
      throw new Error(`NanoBanana API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      enhancedUrl: result.enhanced_url,
      creditsUsed: result.credits_used,
      processingTime: result.processing_time,
      metadata: result.metadata
    };
  }
  
  async getCreditBalance(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/credits`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    const data = await response.json();
    return data.balance;
  }
}
```

### **Local AI Processing**
Client-side AI processing for immediate results.

```typescript
// Local Palette Extraction
export class PaletteExtractor {
  async extractPalette(imageFile: File): Promise<ColorPalette> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = this.extractDominantColors(imageData);
        
        resolve({
          primary: colors[0],
          secondary: colors[1],
          accent: colors[2],
          neutral: colors[3],
          complementary: colors[4]
        });
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  private extractDominantColors(imageData: ImageData): string[] {
    const data = imageData.data;
    const colorMap = new Map<string, number>();
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }
    
    // Sort by frequency and return top 5
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);
  }
}

// Blurhash Generation
export class BlurhashGenerator {
  async generateBlurhash(imageFile: File): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Resize image for performance
        const maxSize = 100;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const blurhash = this.encode(imageData, 4, 3);
        resolve(blurhash);
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  private encode(imageData: ImageData, componentX: number, componentY: number): string {
    // Simplified blurhash encoding implementation
    // In production, use a proper blurhash library
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate average color
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    
    const pixelCount = width * height;
    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);
    
    // Convert to base83 encoding (simplified)
    return `L${r.toString(36)}${g.toString(36)}${b.toString(36)}`;
  }
}
```

## 🎯 Smart Suggestions System

### **Dynamic Dashboard Suggestions**
AI-powered personalized suggestions for user engagement.

```typescript
// Smart Suggestions Engine
export class SmartSuggestionsEngine {
  private userProfile: UserProfile;
  private gigData: Gig[];
  private applicationData: Application[];
  
  constructor(userProfile: UserProfile, gigData: Gig[], applicationData: Application[]) {
    this.userProfile = userProfile;
    this.gigData = gigData;
    this.applicationData = applicationData;
  }
  
  generateSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // Profile completion suggestions
    if (this.userProfile.completion_percentage < 80) {
      suggestions.push({
        id: 'profile_completion',
        type: 'profile_completion',
        priority: 'high',
        title: 'Complete Your Profile',
        description: 'Add more details to increase your visibility',
        action: 'edit_profile',
        icon: 'user',
        color: 'blue'
      });
    }
    
    // Gig matching suggestions
    const matchingGigs = this.findMatchingGigs();
    if (matchingGigs.length > 0) {
      suggestions.push({
        id: 'gig_matches',
        type: 'gig_matches',
        priority: 'medium',
        title: `${matchingGigs.length} New Gig Matches`,
        description: 'Gigs that match your skills and location',
        action: 'view_gigs',
        icon: 'search',
        color: 'green',
        data: { gigs: matchingGigs }
      });
    }
    
    // Application deadline alerts
    const upcomingDeadlines = this.getUpcomingDeadlines();
    if (upcomingDeadlines.length > 0) {
      suggestions.push({
        id: 'deadline_alerts',
        type: 'deadline_alerts',
        priority: 'high',
        title: 'Upcoming Deadlines',
        description: `${upcomingDeadlines.length} applications due soon`,
        action: 'view_applications',
        icon: 'clock',
        color: 'red',
        data: { deadlines: upcomingDeadlines }
      });
    }
    
    // Nearby opportunities
    const nearbyGigs = this.findNearbyGigs();
    if (nearbyGigs.length > 0) {
      suggestions.push({
        id: 'nearby_opportunities',
        type: 'nearby_opportunities',
        priority: 'medium',
        title: 'Nearby Opportunities',
        description: `${nearbyGigs.length} gigs within 25km`,
        action: 'view_nearby',
        icon: 'map-pin',
        color: 'purple',
        data: { gigs: nearbyGigs }
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  private findMatchingGigs(): Gig[] {
    return this.gigData.filter(gig => {
      // Match based on skills, location, and preferences
      const skillMatch = this.userProfile.skills.some(skill => 
        gig.required_skills.includes(skill)
      );
      const locationMatch = this.calculateDistance(gig.location, this.userProfile.location) < 50;
      const preferenceMatch = gig.comp_type === this.userProfile.preferred_comp_type;
      
      return skillMatch && locationMatch && preferenceMatch;
    });
  }
  
  private getUpcomingDeadlines(): Application[] {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return this.applicationData.filter(app => {
      const deadline = new Date(app.gig.application_deadline);
      return deadline <= threeDaysFromNow && app.status === 'pending';
    });
  }
  
  private findNearbyGigs(): Gig[] {
    return this.gigData.filter(gig => {
      const distance = this.calculateDistance(gig.location, this.userProfile.location);
      return distance <= 25; // Within 25km
    });
  }
  
  private calculateDistance(location1: Location, location2: Location): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(location2.lat - location1.lat);
    const dLon = this.toRadians(location2.lng - location1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(location1.lat)) * Math.cos(this.toRadians(location2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

## 🛡️ Content Moderation AI

### **NSFW Detection System**
Comprehensive content moderation with multiple detection methods.

```typescript
// NSFW Detection Service
export class NSFWDetectionService {
  private model: any; // TensorFlow.js model
  
  async loadModel(): Promise<void> {
    // Load pre-trained NSFW detection model
    this.model = await tf.loadLayersModel('/models/nsfw-detection/model.json');
  }
  
  async detectNSFW(imageFile: File): Promise<NSFWDetectionResult> {
    if (!this.model) {
      await this.loadModel();
    }
    
    const image = await this.preprocessImage(imageFile);
    const prediction = this.model.predict(image);
    const scores = await prediction.data();
    
    return {
      isNSFW: scores[0] > 0.5,
      confidence: scores[0],
      categories: {
        explicit: scores[1],
        suggestive: scores[2],
        safe: scores[3]
      },
      timestamp: new Date().toISOString()
    };
  }
  
  private async preprocessImage(imageFile: File): Promise<tf.Tensor> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = 224; // Model input size
        canvas.height = 224;
        ctx.drawImage(img, 0, 0, 224, 224);
        
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const tensor = tf.browser.fromPixels(imageData)
          .resizeNearestNeighbor([224, 224])
          .expandDims(0)
          .div(255.0);
        
        resolve(tensor);
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }
}

// Content Moderation Workflow
export class ContentModerationWorkflow {
  private nsfwService: NSFWDetectionService;
  private userPreferences: UserContentPreferences;
  
  constructor(nsfwService: NSFWDetectionService, userPreferences: UserContentPreferences) {
    this.nsfwService = nsfwService;
    this.userPreferences = userPreferences;
  }
  
  async moderateContent(content: Content): Promise<ModerationResult> {
    const results: ModerationResult[] = [];
    
    // NSFW Detection
    if (content.type === 'image') {
      const nsfwResult = await this.nsfwService.detectNSFW(content.file);
      results.push({
        type: 'nsfw_detection',
        result: nsfwResult,
        action: this.determineNSFWAction(nsfwResult)
      });
    }
    
    // Custom Type Detection
    if (content.customType) {
      const customResult = await this.detectCustomType(content);
      results.push({
        type: 'custom_type_detection',
        result: customResult,
        action: this.determineCustomTypeAction(customResult)
      });
    }
    
    // User Preference Filtering
    const preferenceResult = this.checkUserPreferences(content);
    results.push({
      type: 'user_preferences',
      result: preferenceResult,
      action: this.determinePreferenceAction(preferenceResult)
    });
    
    return this.aggregateResults(results);
  }
  
  private determineNSFWAction(result: NSFWDetectionResult): ModerationAction {
    if (result.isNSFW && result.confidence > 0.8) {
      return 'block';
    } else if (result.isNSFW && result.confidence > 0.5) {
      return 'flag';
    } else {
      return 'allow';
    }
  }
  
  private determineCustomTypeAction(result: CustomTypeResult): ModerationAction {
    if (result.confidence > 0.7) {
      return 'categorize';
    } else {
      return 'review';
    }
  }
  
  private determinePreferenceAction(result: PreferenceResult): ModerationAction {
    if (result.violatesPreferences) {
      return 'filter';
    } else {
      return 'allow';
    }
  }
  
  private aggregateResults(results: ModerationResult[]): ModerationResult {
    const actions = results.map(r => r.action);
    
    if (actions.includes('block')) {
      return { type: 'aggregated', action: 'block', results };
    } else if (actions.includes('flag')) {
      return { type: 'aggregated', action: 'flag', results };
    } else if (actions.includes('filter')) {
      return { type: 'aggregated', action: 'filter', results };
    } else {
      return { type: 'aggregated', action: 'allow', results };
    }
  }
}
```

## 🎨 Stitch Feature AI Integration

### **Multi-Image Processing**
AI-powered image stitching and enhancement.

```typescript
// Stitch AI Service
export class StitchAIService {
  private nanoBananaService: NanoBananaService;
  private paletteExtractor: PaletteExtractor;
  private blurhashGenerator: BlurhashGenerator;
  
  constructor(
    nanoBananaService: NanoBananaService,
    paletteExtractor: PaletteExtractor,
    blurhashGenerator: BlurhashGenerator
  ) {
    this.nanoBananaService = nanoBananaService;
    this.paletteExtractor = paletteExtractor;
    this.blurhashGenerator = blurhashGenerator;
  }
  
  async processStitchProject(project: StitchProject): Promise<StitchResult> {
    const results: StitchResult[] = [];
    
    for (const source of project.sources) {
      // Extract palette
      const palette = await this.paletteExtractor.extractPalette(source.file);
      
      // Generate blurhash
      const blurhash = await this.blurhashGenerator.generateBlurhash(source.file);
      
      // Enhance with NanoBanana
      const enhanced = await this.nanoBananaService.enhanceImage(
        source.url,
        project.enhancementType
      );
      
      results.push({
        sourceId: source.id,
        palette,
        blurhash,
        enhancedUrl: enhanced.enhancedUrl,
        creditsUsed: enhanced.creditsUsed,
        metadata: {
          originalSize: source.file.size,
          enhancedSize: enhanced.metadata.size,
          processingTime: enhanced.processingTime
        }
      });
    }
    
    return {
      projectId: project.id,
      results,
      totalCreditsUsed: results.reduce((sum, r) => sum + r.creditsUsed, 0),
      processingTime: Date.now() - project.createdAt
    };
  }
  
  async generateShotlistPrompt(project: StitchProject): Promise<string> {
    const sourceDescriptions = project.sources.map(source => 
      `${source.label}: ${source.description}`
    ).join(', ');
    
    const prompt = `
      Create a detailed shotlist for a ${project.type} project with the following sources:
      ${sourceDescriptions}
      
      Style: ${project.style}
      Mood: ${project.mood}
      Location: ${project.location}
      
      Please provide:
      1. 5-10 specific shot descriptions
      2. Camera angles and movements
      3. Lighting suggestions
      4. Composition tips
      5. Equipment recommendations
    `;
    
    return prompt;
  }
}
```

## 📊 AI Analytics & Insights

### **User Behavior Analysis**
AI-powered analytics for user engagement and platform optimization.

```typescript
// AI Analytics Service
export class AIAnalyticsService {
  private eventBus: EventBus;
  private userProfiles: Map<string, UserProfile>;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.userProfiles = new Map();
  }
  
  async analyzeUserBehavior(userId: string, timeRange: DateRange): Promise<BehaviorAnalysis> {
    const events = await this.eventBus.getEvents(userId, timeRange);
    const profile = this.userProfiles.get(userId);
    
    const analysis: BehaviorAnalysis = {
      userId,
      timeRange,
      engagementScore: this.calculateEngagementScore(events),
      preferences: this.extractPreferences(events, profile),
      patterns: this.identifyPatterns(events),
      recommendations: this.generateRecommendations(events, profile)
    };
    
    return analysis;
  }
  
  private calculateEngagementScore(events: Event[]): number {
    const weights = {
      'gig_created': 10,
      'gig_applied': 5,
      'application_accepted': 15,
      'showcase_created': 8,
      'message_sent': 3,
      'profile_updated': 5
    };
    
    let score = 0;
    for (const event of events) {
      score += weights[event.type] || 1;
    }
    
    return Math.min(score / 100, 1); // Normalize to 0-1
  }
  
  private extractPreferences(events: Event[], profile: UserProfile): UserPreferences {
    const preferences: UserPreferences = {
      gigTypes: new Map(),
      locations: new Map(),
      timeSlots: new Map(),
      compTypes: new Map()
    };
    
    for (const event of events) {
      if (event.type === 'gig_applied' && event.data.gig) {
        const gig = event.data.gig;
        
        // Track gig type preferences
        preferences.gigTypes.set(gig.type, (preferences.gigTypes.get(gig.type) || 0) + 1);
        
        // Track location preferences
        preferences.locations.set(gig.location_text, (preferences.locations.get(gig.location_text) || 0) + 1);
        
        // Track compensation type preferences
        preferences.compTypes.set(gig.comp_type, (preferences.compTypes.get(gig.comp_type) || 0) + 1);
      }
    }
    
    return preferences;
  }
  
  private identifyPatterns(events: Event[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    
    // Identify peak activity times
    const hourlyActivity = new Map<number, number>();
    for (const event of events) {
      const hour = new Date(event.timestamp).getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    }
    
    const peakHour = Array.from(hourlyActivity.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (peakHour) {
      patterns.push({
        type: 'peak_activity_time',
        value: peakHour[0],
        confidence: peakHour[1] / events.length
      });
    }
    
    // Identify application success patterns
    const applications = events.filter(e => e.type === 'gig_applied');
    const accepted = events.filter(e => e.type === 'application_accepted');
    
    if (applications.length > 0) {
      patterns.push({
        type: 'application_success_rate',
        value: accepted.length / applications.length,
        confidence: Math.min(applications.length / 10, 1)
      });
    }
    
    return patterns;
  }
  
  private generateRecommendations(events: Event[], profile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Profile completion recommendations
    if (profile.completion_percentage < 80) {
      recommendations.push({
        type: 'profile_completion',
        priority: 'high',
        message: 'Complete your profile to increase visibility',
        action: 'edit_profile'
      });
    }
    
    // Skill development recommendations
    const skillGaps = this.identifySkillGaps(events, profile);
    if (skillGaps.length > 0) {
      recommendations.push({
        type: 'skill_development',
        priority: 'medium',
        message: `Consider developing: ${skillGaps.join(', ')}`,
        action: 'update_skills'
      });
    }
    
    // Location expansion recommendations
    const locationDiversity = this.analyzeLocationDiversity(events);
    if (locationDiversity < 0.3) {
      recommendations.push({
        type: 'location_expansion',
        priority: 'low',
        message: 'Consider expanding your location range',
        action: 'update_location_preferences'
      });
    }
    
    return recommendations;
  }
}
```

## 🔮 Future AI Enhancements

### **Planned AI Features**
- **Advanced Matchmaking**: ML-powered gig-talent matching
- **Predictive Analytics**: Success rate predictions for applications
- **Automated Content Creation**: AI-generated gig descriptions and shotlists
- **Sentiment Analysis**: Message and review sentiment analysis
- **Fraud Detection**: AI-powered scam and fraud prevention
- **Performance Optimization**: ML-driven platform performance improvements

### **AI Model Training**
- **User Behavior Models**: Personalized recommendation models
- **Content Quality Models**: Automated content quality assessment
- **Success Prediction Models**: Application and collaboration success prediction
- **Anomaly Detection Models**: Unusual behavior and fraud detection

---

This comprehensive AI and machine learning system provides Preset with intelligent features that enhance user experience, automate content processing, and provide valuable insights for platform optimization. The integration of multiple AI services ensures robust functionality while maintaining cost efficiency through the credit marketplace system.
