'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Wand2, 
  Download, 
  Share2, 
  Eye, 
  Save, 
  Plus,
  Trash2,
  Move,
  Image as ImageIcon,
  Users,
  Calendar,
  DollarSign,
  Target,
  FolderOpen,
  X
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';

// Treatment format definitions
const TREATMENT_FORMATS = {
  film_tv: {
    label: 'Film / TV',
    icon: '🎬',
    sections: [
      { id: 'cover', label: 'Cover', required: true },
      { id: 'premise', label: 'Premise & Theme', required: true },
      { id: 'characters', label: 'Characters', required: true },
      { id: 'synopsis', label: 'Synopsis', required: true },
      { id: 'tone', label: 'Tone & Visual Language', required: true },
      { id: 'audience', label: 'Audience & Comparables', required: false },
      { id: 'schedule', label: 'Schedule & Next Steps', required: false }
    ]
  },
  documentary: {
    label: 'Documentary',
    icon: '📽️',
    sections: [
      { id: 'cover', label: 'Cover', required: true },
      { id: 'logline', label: 'Logline & Statement of Intent', required: true },
      { id: 'access', label: 'Access & Research Basis', required: true },
      { id: 'story_world', label: 'Story World & Participants', required: true },
      { id: 'narrative_arc', label: 'Narrative Arc / Episodes', required: true },
      { id: 'visual_approach', label: 'Visual Approach', required: true },
      { id: 'ethics', label: 'Ethics & Access / Risks', required: false },
      { id: 'production_plan', label: 'Production Plan / Deliverables', required: false }
    ]
  },
  commercial_brand: {
    label: 'Commercial / Brand',
    icon: '📺',
    sections: [
      { id: 'cover', label: 'Cover', required: true },
      { id: 'big_idea', label: 'The Big Idea', required: true },
      { id: 'audience_insight', label: 'Audience Insight & Brand Voice', required: true },
      { id: 'treatment_narrative', label: 'Treatment Narrative', required: true },
      { id: 'visual_language', label: 'Visual Language', required: true },
      { id: 'talent_locations', label: 'Talent & Locations', required: false },
      { id: 'deliverables', label: 'Deliverables', required: true },
      { id: 'production_approach', label: 'Production Approach & Timeline', required: false }
    ]
  },
  music_video: {
    label: 'Music Video',
    icon: '🎵',
    sections: [
      { id: 'cover', label: 'Cover', required: true },
      { id: 'concept_hook', label: 'Concept Hook & Artist Fit', required: true },
      { id: 'visual_motifs', label: 'Visual Motifs / References', required: true },
      { id: 'beat_outline', label: 'Beat-by-Beat Outline', required: true },
      { id: 'wardrobe_art', label: 'Wardrobe / Art Dir. / Choreo', required: false },
      { id: 'vfx_post', label: 'VFX / Post Look', required: false },
      { id: 'schedule_deliverables', label: 'Schedule & Deliverables', required: true }
    ]
  }
};

const TREATMENT_THEMES = {
  cinematic: { label: 'Cinematic', description: 'Elegant serif typography, film-inspired layouts' },
  minimal: { label: 'Minimal', description: 'Clean sans-serif, lots of white space' },
  editorial: { label: 'Editorial', description: 'Magazine-style layouts, bold typography' },
  bold_art: { label: 'Bold Art', description: 'Creative layouts, artistic typography' },
  brand_deck: { label: 'Brand Deck', description: 'Corporate-friendly, professional styling' }
};

interface TreatmentSection {
  id: string;
  heading: string;
  content: string;
  images: string[];
  required: boolean;
}

interface TreatmentData {
  id?: string;
  title: string;
  format: keyof typeof TREATMENT_FORMATS;
  theme: keyof typeof TREATMENT_THEMES;
  sections: TreatmentSection[];
  loglines: string[];
  cta_suggestions: Array<{ label: string; target: string }>;
}

function CreateTreatmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [treatmentData, setTreatmentData] = useState<TreatmentData>({
    title: '',
    format: 'film_tv',
    theme: 'cinematic',
    sections: [],
    loglines: [],
    cta_suggestions: []
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  // Image selection state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageSources, setImageSources] = useState<{
    moodboards: Array<{id: string, title: string, images: string[]}>;
    gigs: Array<{id: string, title: string, images: string[]}>;
    media: Array<{id: string, url: string, type: string}>;
  }>({
    moodboards: [],
    gigs: [],
    media: []
  });
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Initialize from URL params (gig_id, moodboard_id)
  const gigId = searchParams.get('gig_id');
  const moodboardId = searchParams.get('moodboard_id');

  useEffect(() => {
    if (gigId) {
      // Pre-fill from gig data
      fetchGigData(gigId);
    }
    if (moodboardId) {
      // Pre-fill from moodboard data
      fetchMoodboardData(moodboardId);
    }
  }, [gigId, moodboardId]);

  // Fetch image sources when component mounts
  useEffect(() => {
    fetchImageSources();
  }, [user]);

  const fetchGigData = async (gigId: string) => {
    try {
      const response = await fetch(`/api/gigs/${gigId}`);
      if (response.ok) {
        const gig = await response.json();
        setTreatmentData(prev => ({
          ...prev,
          title: gig.title || '',
          format: determineFormatFromGig(gig) || 'film_tv'
        }));
      }
    } catch (error) {
      console.error('Error fetching gig data:', error);
    }
  };

  const fetchMoodboardData = async (moodboardId: string) => {
    try {
      const response = await fetch(`/api/moodboards/${moodboardId}`);
      if (response.ok) {
        const moodboard = await response.json();
        // Extract images and palette for treatment
        console.log('Moodboard data:', moodboard);
        
        // Auto-select images from moodboard if available
        if (moodboard.items && Array.isArray(moodboard.items)) {
          const images = moodboard.items
            .filter((item: any) => item.type === 'image' && item.url)
            .map((item: any) => item.enhanced_url || item.url);
          setSelectedImages(images);
        }
      }
    } catch (error) {
      console.error('Error fetching moodboard data:', error);
    }
  };

  // Fetch available image sources
  const fetchImageSources = async () => {
    if (!user) return;
    
    try {
      // Fetch user's moodboards
      const moodboardsResponse = await fetch('/api/moodboards');
      if (moodboardsResponse.ok) {
        const moodboards = await moodboardsResponse.json();
        const moodboardsWithImages = moodboards.map((mb: any) => ({
          id: mb.id,
          title: mb.title || 'Untitled Moodboard',
          images: mb.items?.filter((item: any) => item.type === 'image' && item.url)
            .map((item: any) => item.enhanced_url || item.url) || []
        })).filter((mb: any) => mb.images.length > 0);
        
        setImageSources(prev => ({ ...prev, moodboards: moodboardsWithImages }));
      }

      // Fetch user's gigs
      const gigsResponse = await fetch('/api/gigs');
      if (gigsResponse.ok) {
        const gigs = await gigsResponse.json();
        const gigsWithImages = gigs.map((gig: any) => ({
          id: gig.id,
          title: gig.title,
          images: gig.media_ids ? [] : [] // Will be populated when media is fetched
        }));
        
        setImageSources(prev => ({ ...prev, gigs: gigsWithImages }));
      }

      // Fetch user's media
      const mediaResponse = await fetch('/api/media');
      if (mediaResponse.ok) {
        const media = await mediaResponse.json();
        const imageMedia = media.filter((m: any) => m.type === 'image').map((m: any) => ({
          id: m.id,
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${m.bucket}/${m.path}`,
          type: m.type
        }));
        
        setImageSources(prev => ({ ...prev, media: imageMedia }));
      }
    } catch (error) {
      console.error('Error fetching image sources:', error);
    }
  };

  // Handle image selection
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl) 
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  // Remove selected image
  const removeSelectedImage = (imageUrl: string) => {
    setSelectedImages(prev => prev.filter(url => url !== imageUrl));
  };

  const determineFormatFromGig = (gig: any): keyof typeof TREATMENT_FORMATS | null => {
    const purpose = gig.purpose?.toLowerCase() || '';
    if (purpose.includes('commercial') || purpose.includes('brand')) return 'commercial_brand';
    if (purpose.includes('documentary')) return 'documentary';
    if (purpose.includes('music')) return 'music_video';
    return 'film_tv';
  };

  const initializeSections = (format: keyof typeof TREATMENT_FORMATS) => {
    const formatConfig = TREATMENT_FORMATS[format];
    const sections: TreatmentSection[] = formatConfig.sections.map(section => ({
      id: section.id,
      heading: section.label,
      content: '',
      images: [],
      required: section.required
    }));
    
    setTreatmentData(prev => ({
      ...prev,
      format,
      sections
    }));
  };

  const generateAIDraft = async () => {
    if (!treatmentData.title.trim()) {
      alert('Please enter a title before generating AI draft');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/treatments/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: treatmentData.title,
          format: treatmentData.format,
          theme: treatmentData.theme,
          gig_id: gigId,
          moodboard_id: moodboardId,
          selected_images: selectedImages // Pass selected images for analysis
        })
      });

      if (response.ok) {
        const generatedData = await response.json();
        setTreatmentData(prev => ({
          ...prev,
          loglines: generatedData.loglines || [],
          sections: prev.sections.map(section => ({
            ...section,
            content: generatedData.sections?.[section.id]?.content || section.content
          })),
          cta_suggestions: generatedData.cta_suggestions || []
        }));
        setActiveTab('edit');
      } else {
        throw new Error('Failed to generate AI draft');
      }
    } catch (error) {
      console.error('Error generating AI draft:', error);
      alert('Failed to generate AI draft. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const saveTreatment = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treatmentData)
      });

      if (response.ok) {
        const { id } = await response.json();
        router.push(`/treatments/${id}/edit`);
      } else {
        throw new Error('Failed to save treatment');
      }
    } catch (error) {
      console.error('Error saving treatment:', error);
      alert('Failed to save treatment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (sectionId: string, content: string) => {
    setTreatmentData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      )
    }));
  };

  const addSmartBlock = (sectionId: string, blockType: string) => {
    // Add smart blocks like deliverables matrix, crew plan, etc.
    console.log('Adding smart block:', blockType, 'to section:', sectionId);
  };

  // Export and sharing functions
  const exportToPDF = async () => {
    setSaving(true);
    try {
      // First save the treatment if it hasn't been saved yet
      let treatmentId = treatmentData.id;
      if (!treatmentId) {
        const response = await fetch('/api/treatments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(treatmentData)
        });
        
        if (response.ok) {
          const { id } = await response.json();
          treatmentId = id;
        } else {
          throw new Error('Failed to save treatment');
        }
      }

      // Generate PDF export
      const pdfResponse = await fetch(`/api/treatments/${treatmentId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          includeImages: true,
          theme: treatmentData.theme
        })
      });

      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${treatmentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_treatment.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const createShareLink = async () => {
    setSaving(true);
    try {
      // First save the treatment if it hasn't been saved yet
      let treatmentId = treatmentData.id;
      if (!treatmentId) {
        const response = await fetch('/api/treatments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(treatmentData)
        });
        
        if (response.ok) {
          const { id } = await response.json();
          treatmentId = id;
        } else {
          throw new Error('Failed to save treatment');
        }
      }

      // Create shareable link
      const shareResponse = await fetch(`/api/treatments/${treatmentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility: 'unlisted',
          allowComments: true
        })
      });

      if (shareResponse.ok) {
        const { shareUrl } = await shareResponse.json();
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      console.error('Share link creation failed:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addToShowcase = async () => {
    setSaving(true);
    try {
      // First save the treatment if it hasn't been saved yet
      let treatmentId = treatmentData.id;
      if (!treatmentId) {
        const response = await fetch('/api/treatments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(treatmentData)
        });
        
        if (response.ok) {
          const { id } = await response.json();
          treatmentId = id;
        } else {
          throw new Error('Failed to save treatment');
        }
      }

      // Add to showcase
      const showcaseResponse = await fetch('/api/showcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'treatment',
          title: treatmentData.title,
          description: `Professional treatment: ${treatmentData.title}`,
          treatment_id: treatmentId,
          images: selectedImages.slice(0, 6), // Limit to 6 images
          tags: ['treatment', treatmentData.format, treatmentData.theme]
        })
      });

      if (showcaseResponse.ok) {
        alert('Treatment added to showcase successfully!');
        router.push('/showcases');
      } else {
        throw new Error('Failed to add to showcase');
      }
    } catch (error) {
      console.error('Add to showcase failed:', error);
      alert('Failed to add to showcase. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const content = treatmentData.sections
        .map(section => `# ${section.heading}\n\n${section.content}`)
        .join('\n\n');
      
      await navigator.clipboard.writeText(content);
      alert('Treatment content copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy content. Please try again.');
    }
  };

  const sendToClient = async () => {
    try {
      const shareUrl = await createShareLink();
      // Here you would integrate with email service
      const emailSubject = `Treatment: ${treatmentData.title}`;
      const emailBody = `Hi,\n\nI've created a treatment for "${treatmentData.title}". You can view it here:\n\n${shareUrl}\n\nBest regards`;
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink);
    } catch (error) {
      console.error('Send to client failed:', error);
      alert('Failed to prepare email. Please try again.');
    }
  };

  const createProjectFromTreatment = async () => {
    try {
      // Create a collaboration project from the treatment
      const projectResponse = await fetch('/api/collab/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: treatmentData.title,
          description: treatmentData.sections.find(s => s.id === 'premise')?.content || 
                      treatmentData.sections.find(s => s.id === 'big_idea')?.content || 
                      treatmentData.sections.find(s => s.id === 'concept')?.content || 
                      'Project based on treatment',
          synopsis: treatmentData.sections.find(s => s.id === 'synopsis')?.content || 
                   treatmentData.sections.find(s => s.id === 'treatment_narrative')?.content || 
                   treatmentData.sections.find(s => s.id === 'visual_story')?.content,
          visibility: 'published',
          treatment_id: treatmentData.id
        })
      });

      if (projectResponse.ok) {
        const { id } = await projectResponse.json();
        alert('Project created successfully!');
        router.push(`/collaborate/projects/${id}`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Create project failed:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to create treatments.</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl p-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">Create Treatment</h1>
                <p className="text-xl text-muted-foreground">Generate professional treatments from your gigs and moodboards</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button size="lg" className="px-8 py-3 text-lg font-semibold" onClick={saveTreatment} disabled={saving}>
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Treatment'}
              </Button>
            </div>
          </div>
        </div>

        <main>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Treatment Title</Label>
                      <Input
                        id="title"
                        value={treatmentData.title}
                        onChange={(e) => setTreatmentData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter treatment title..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select 
                        value={treatmentData.format} 
                        onValueChange={(value: keyof typeof TREATMENT_FORMATS) => initializeSections(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TREATMENT_FORMATS).map(([key, format]) => (
                            <SelectItem key={key} value={key}>
                              <span className="mr-2">{format.icon}</span>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="theme">Visual Theme</Label>
                      <Select 
                        value={treatmentData.theme} 
                        onValueChange={(value: keyof typeof TREATMENT_THEMES) => 
                          setTreatmentData(prev => ({ ...prev, theme: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TREATMENT_THEMES).map(([key, theme]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div className="font-medium">{theme.label}</div>
                                <div className="text-sm text-gray-500">{theme.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Selection */}
                    <div>
                      <Label>Visual References</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                          </span>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowImageSelector(!showImageSelector)}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            {showImageSelector ? 'Hide' : 'Select Images'}
                          </Button>
                        </div>
                        
                        {/* Selected Images Preview */}
                        {selectedImages.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedImages.map((imageUrl, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={imageUrl} 
                                  alt={`Selected ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <button
                                  onClick={() => removeSelectedImage(imageUrl)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Image Selector Modal */}
                        {showImageSelector && (
                          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                            <h4 className="font-medium mb-3">Select Images from Your Library</h4>
                            
                            {/* Moodboards */}
                            {imageSources.moodboards.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Moodboards</h5>
                                <div className="space-y-2">
                                  {imageSources.moodboards.map((moodboard) => (
                                    <div key={moodboard.id} className="border rounded p-2">
                                      <div className="text-sm font-medium mb-2">{moodboard.title}</div>
                                      <div className="flex flex-wrap gap-2">
                                        {moodboard.images.map((imageUrl, index) => (
                                          <button
                                            key={index}
                                            onClick={() => toggleImageSelection(imageUrl)}
                                            className={`relative w-12 h-12 rounded border-2 ${
                                              selectedImages.includes(imageUrl) 
                                                ? 'border-blue-500 ring-2 ring-blue-200' 
                                                : 'border-gray-200'
                                            }`}
                                          >
                                            <img 
                                              src={imageUrl} 
                                              alt={`Moodboard ${index + 1}`}
                                              className="w-full h-full object-cover rounded"
                                            />
                                            {selectedImages.includes(imageUrl) && (
                                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                              </div>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Media Library */}
                            {imageSources.media.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Media Library</h5>
                                <div className="flex flex-wrap gap-2">
                                  {imageSources.media.map((media) => (
                                    <button
                                      key={media.id}
                                      onClick={() => toggleImageSelection(media.url)}
                                      className={`relative w-12 h-12 rounded border-2 ${
                                        selectedImages.includes(media.url) 
                                          ? 'border-blue-500 ring-2 ring-blue-200' 
                                          : 'border-gray-200'
                                      }`}
                                    >
                                      <img 
                                        src={media.url} 
                                        alt="Media"
                                        className="w-full h-full object-cover rounded"
                                      />
                                      {selectedImages.includes(media.url) && (
                                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                          </div>
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {imageSources.moodboards.length === 0 && imageSources.media.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No images found in your library. Create moodboards or upload media to get started.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-3">Treatment Sections</h3>
                      <div className="space-y-2">
                        {treatmentData.sections.map((section) => (
                          <div key={section.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{section.heading}</span>
                              {section.required && (
                                <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={generateAIDraft} 
                        disabled={aiGenerating || !treatmentData.title.trim()}
                        className="w-full"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {aiGenerating ? 'Generating AI Draft...' : 'Generate AI Draft'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Treatment Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Loglines */}
                {treatmentData.loglines.length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Loglines</Label>
                    <div className="space-y-2 mt-2">
                      {treatmentData.loglines.map((logline, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm">{logline}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {treatmentData.sections.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">
                        {section.heading}
                        {section.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => addSmartBlock(section.id, 'deliverables')}>
                          <Target className="h-3 w-3 mr-1" />
                          Deliverables
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addSmartBlock(section.id, 'crew')}>
                          <Users className="h-3 w-3 mr-1" />
                          Crew
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addSmartBlock(section.id, 'schedule')}>
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => addSmartBlock(section.id, 'budget')}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          Budget
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      placeholder={`Enter content for ${section.heading.toLowerCase()}...`}
                      rows={6}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview Treatment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-8 min-h-[800px]">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">{treatmentData.title}</h1>
                    <div className="flex justify-center space-x-4 text-sm text-gray-600">
                      <span>{TREATMENT_FORMATS[treatmentData.format].label}</span>
                      <span>•</span>
                      <span>{TREATMENT_THEMES[treatmentData.theme].label}</span>
                    </div>
                  </div>

                  {treatmentData.sections.map((section) => (
                    <div key={section.id} className="mb-8">
                      <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
                      <div className="prose max-w-none">
                        {section.content ? (
                          <p className="whitespace-pre-wrap">{section.content}</p>
                        ) : (
                          <p className="text-gray-400 italic">No content yet...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export & Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => exportToPDF()}
                    disabled={saving}
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span>{saving ? 'Generating...' : 'PDF Export'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => createShareLink()}
                    disabled={saving}
                  >
                    <Share2 className="h-6 w-6 mb-2" />
                    <span>Share Link</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => addToShowcase()}
                    disabled={saving}
                  >
                    <Eye className="h-6 w-6 mb-2" />
                    <span>Add to Showcase</span>
                  </Button>
                </div>

                {/* Sharing Options */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Sharing Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <Select defaultValue="private">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private (Only You)</SelectItem>
                          <SelectItem value="unlisted">Unlisted (Link Only)</SelectItem>
                          <SelectItem value="public">Public (Discoverable)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Allow Comments</Label>
                      <Select defaultValue="enabled">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard()}>
                      Copy Content
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendToClient()}>
                      Send to Client
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => createProjectFromTreatment()}>
                      Create Project
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
}

export default function CreateTreatmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTreatmentPageContent />
    </Suspense>
  );
}
