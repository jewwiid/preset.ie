export interface AnalysisPersona {
  id: string;
  name: string;
  description: string;
  specialization: string[];
  targetAudience: string[];
  analysisFocus: string[];
  icon: string;
}

export const ANALYSIS_PERSONAS: AnalysisPersona[] = [
  {
    id: 'photographer',
    name: 'Professional Photographer',
    description: 'Senior Commercial Photographer with 15+ years experience',
    specialization: ['Commercial Photography', 'Lighting Techniques', 'Composition', 'Technical Excellence'],
    targetAudience: ['Commercial Clients', 'Brands', 'Agencies'],
    analysisFocus: ['Technical Quality', 'Commercial Viability', 'Client Presentation', 'Professional Standards'],
    icon: '📸'
  },
  {
    id: 'creative-director',
    name: 'Creative Director',
    description: 'Creative Director at top advertising agency',
    specialization: ['Brand Storytelling', 'Visual Narrative', 'Campaign Concepts', 'Market Positioning'],
    targetAudience: ['Brands', 'Marketing Teams', 'Campaign Managers'],
    analysisFocus: ['Brand Alignment', 'Emotional Impact', 'Market Positioning', 'Campaign Effectiveness'],
    icon: '🎨'
  },
  {
    id: 'social-media',
    name: 'Social Media Strategist',
    description: 'Social Media Manager at major brands',
    specialization: ['Platform Optimization', 'Engagement Tactics', 'Viral Content', 'Audience Psychology'],
    targetAudience: ['Social Media Managers', 'Content Creators', 'Influencers'],
    analysisFocus: ['Platform Optimization', 'Engagement Potential', 'Viral Potential', 'Audience Appeal'],
    icon: '📱'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Specialist',
    description: 'E-commerce Visual Specialist',
    specialization: ['Product Photography', 'Conversion Optimization', 'Sales Psychology', 'Category Analysis'],
    targetAudience: ['E-commerce Brands', 'Product Managers', 'Sales Teams'],
    analysisFocus: ['Conversion Optimization', 'Product Appeal', 'Sales Performance', 'Category Standards'],
    icon: '🛍️'
  },
  {
    id: 'art-director',
    name: 'Art Director',
    description: 'Art Director for magazines and brands',
    specialization: ['Editorial Design', 'Artistic Vision', 'Trend Analysis', 'Visual Excellence'],
    targetAudience: ['Magazines', 'Editorial Teams', 'Art Collectors'],
    analysisFocus: ['Artistic Excellence', 'Trend Alignment', 'Editorial Quality', 'Visual Impact'],
    icon: '🎭'
  }
];
