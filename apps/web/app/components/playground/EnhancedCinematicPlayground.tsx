'use client';

import React, { useState, useEffect } from 'react';
import { CinematicParameters, CinematicFilter } from '@preset/types';
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector';
import CinematicSearchFilter from '../cinematic/CinematicSearchFilter';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Wand2,
  Camera,
  Search,
  Image as ImageIcon,
  Settings,
  Zap,
  Eye,
  Download,
  Share2
} from 'lucide-react';
import { getAuthToken } from '@/lib/auth-utils';

interface EnhancedCinematicPlaygroundProps {
  onEnhanceImage: (request: CinematicEnhancementRequest) => Promise<void>;
  isEnhancing?: boolean;
  currentImage?: string;
  userCredits?: number;
}

interface CinematicEnhancementRequest {
  inputImageUrl: string;
  enhancementType: string;
  prompt: string;
  cinematicParameters: Partial<CinematicParameters>;
  strength?: number;
  moodboardId?: string;
}

interface SearchResult {
  id: string;
  url: string;
  cinematicMetadata: CinematicParameters;
  cinematicTags: string[];
  width: number;
  height: number;
  created_at: string;
}

export default function EnhancedCinematicPlayground({
  onEnhanceImage,
  isEnhancing = false,
  currentImage,
  userCredits = 0
}: EnhancedCinematicPlaygroundProps) {
  const [activeTab, setActiveTab] = useState('enhance');
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>();
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [enhancementType, setEnhancementType] = useState('cinematic');
  const [strength, setStrength] = useState(0.8);
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true);
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true);
  
  // Handle toggle changes from CinematicParameterSelector
  const handleToggleChange = (technicalDetails: boolean, styleReferences: boolean) => {
    setIncludeTechnicalDetails(technicalDetails);
    setIncludeStyleReferences(styleReferences);
  };
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<CinematicFilter>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleEnhanceImage = async () => {
    if (!currentImage || !enhancementPrompt.trim()) {
      return;
    }

    const request: CinematicEnhancementRequest = {
      inputImageUrl: currentImage,
      enhancementType,
      prompt: enhancementPrompt,
      cinematicParameters,
      strength
    };

    await onEnhanceImage(request);
  };

  const handleGenerateTemplate = (category: string, mood: string, style?: string) => {
    // Generate a template based on the category
    const templates = {
      portrait: {
        cameraAngle: 'eye-level' as const,
        lensType: 'portrait-85mm' as const,
        shotSize: 'close-up' as const,
        depthOfField: 'shallow-focus' as const,
        lightingStyle: 'soft-light' as const,
        sceneMood: mood as any,
        directorStyle: style as any
      },
      landscape: {
        cameraAngle: 'eye-level' as const,
        lensType: 'wide-angle-24mm' as const,
        shotSize: 'wide-shot' as const,
        depthOfField: 'deep-focus' as const,
        lightingStyle: 'natural-light' as const,
        sceneMood: mood as any,
        directorStyle: style as any
      },
      cinematic: {
        cameraAngle: 'low-angle' as const,
        lensType: 'anamorphic' as const,
        shotSize: 'wide-shot' as const,
        depthOfField: 'shallow-focus' as const,
        lightingStyle: 'chiaroscuro' as const,
        sceneMood: mood as any,
        directorStyle: style as any,
        aspectRatio: '2.39:1' as const
      }
    };

    setCinematicParameters(templates[category as keyof typeof templates] || {});
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const token = await getAuthToken();

      if (!token) {
        console.error('No auth token available for search');
        setIsSearching(false);
        return;
      }

      const response = await fetch('/api/search-cinematic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          searchQuery,
          filters: searchFilters,
          limit: 20
        })
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    // Set the selected image as current image
    // This would typically update the parent component's state
    console.log('Selected image:', imageUrl);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cinematic Enhancement Playground</h2>
          <p className="text-muted-foreground">
            Create stunning images with professional cinematic parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {userCredits} credits
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhance" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Enhance Image
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Gallery
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhancement Controls */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Enhancement Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enhancement-type">Enhancement Type</Label>
                    <select
                      id="enhancement-type"
                      value={enhancementType}
                      onChange={(e) => setEnhancementType(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="cinematic">Cinematic</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                      <option value="style">Artistic Style</option>
                      <option value="lighting">Lighting</option>
                      <option value="color">Color Grading</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt">Enhancement Prompt</Label>
                    <Input
                      id="prompt"
                      placeholder="Describe the enhancement you want..."
                      value={enhancementPrompt}
                      onChange={(e) => setEnhancementPrompt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strength">Enhancement Strength</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        id="strength"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={strength}
                        onChange={(e) => setStrength(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {Math.round(strength * 100)}%
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleEnhanceImage}
                    disabled={!currentImage || !enhancementPrompt.trim() || isEnhancing || userCredits < 1}
                    className="w-full"
                  >
                    {isEnhancing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Enhance Image (1 credit)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Cinematic Parameters */}
              <CinematicParameterSelector
                parameters={cinematicParameters}
                onParametersChange={setCinematicParameters}
                onGenerateTemplate={handleGenerateTemplate}
                onToggleChange={handleToggleChange}
                showAdvanced={true}
              />
            </div>

            {/* Image Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Image Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentImage ? (
                    <div className="space-y-4">
                      <img
                        src={currentImage}
                        alt="Current image"
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        Upload an image to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Filters */}
            <div className="lg:col-span-1">
              <CinematicSearchFilter
                onFiltersChange={setSearchFilters}
                onSearchChange={setSearchQuery}
                onClearFilters={() => {
                  setSearchFilters({});
                  setSearchQuery('');
                }}
                compact={false}
              />
            </div>

            {/* Search Results */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Search cinematic images..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="group cursor-pointer"
                        onClick={() => handleImageSelect(result.url)}
                      >
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={result.url}
                            alt="Search result"
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {result.cinematicTags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag.split(':')[1]?.replace(/-/g, ' ') || tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {searchResults.length === 0 && !isSearching && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No results found. Try adjusting your search criteria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cinematic Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Portrait',
                    description: 'Professional portrait with shallow depth of field',
                    category: 'portrait',
                    mood: 'romantic',
                    style: 'sofia-coppola'
                  },
                  {
                    name: 'Landscape',
                    description: 'Epic landscape with deep focus and natural lighting',
                    category: 'landscape',
                    mood: 'peaceful',
                    style: 'roger-deakins'
                  },
                  {
                    name: 'Cinematic',
                    description: 'Dramatic cinematic shot with low angle and chiaroscuro',
                    category: 'cinematic',
                    mood: 'dramatic',
                    style: 'david-fincher'
                  },
                  {
                    name: 'Wes Anderson',
                    description: 'Symmetrical composition with pastel colors',
                    category: 'cinematic',
                    mood: 'nostalgic',
                    style: 'wes-anderson'
                  },
                  {
                    name: 'Film Noir',
                    description: 'High contrast black and white with dramatic shadows',
                    category: 'cinematic',
                    mood: 'mysterious',
                    style: undefined
                  },
                  {
                    name: 'Neon Cyberpunk',
                    description: 'Futuristic aesthetic with colored lighting',
                    category: 'cinematic',
                    mood: 'futuristic',
                    style: 'christopher-doyle'
                  }
                ].map((template) => (
                  <div
                    key={template.name}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleGenerateTemplate(template.category, template.mood, template.style)}
                  >
                    <h3 className="font-medium mb-2">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.mood}
                      </Badge>
                      {template.style && (
                        <Badge variant="outline" className="text-xs">
                          {template.style.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
