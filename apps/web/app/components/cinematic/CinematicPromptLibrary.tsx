'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Star, 
  Filter, 
  Camera, 
  Film, 
  Palette, 
  Settings,
  Eye,
  Copy,
  Heart,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { Separator } from '../../../components/ui/separator';
import { CinematicParameters, CINEMATIC_PARAMETERS } from '../../../../../packages/types/src/cinematic-parameters';

interface CinematicPromptTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  base_prompt: string;
  cinematic_parameters: Partial<CinematicParameters>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  usage_count: number;
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

interface CustomDirector {
  id: number;
  value: string;
  label: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface CustomSceneMood {
  id: number;
  value: string;
  label: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface CinematicPromptLibraryProps {
  onTemplateSelect?: (template: CinematicPromptTemplate) => void;
  onDirectorSelect?: (director: CustomDirector) => void;
  onMoodSelect?: (mood: CustomSceneMood) => void;
  compact?: boolean;
}

export default function CinematicPromptLibrary({
  onTemplateSelect,
  onDirectorSelect,
  onMoodSelect,
  compact = false
}: CinematicPromptLibraryProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<CinematicPromptTemplate[]>([]);
  const [directors, setDirectors] = useState<CustomDirector[]>([]);
  const [moods, setMoods] = useState<CustomSceneMood[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  
  // Create dialog state
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateDirector, setShowCreateDirector] = useState(false);
  const [showCreateMood, setShowCreateMood] = useState(false);
  
  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'portrait',
    base_prompt: '',
    cinematic_parameters: {} as Partial<CinematicParameters>,
    difficulty: 'beginner' as const,
    tags: [] as string[],
    is_public: false
  });
  
  const [directorForm, setDirectorForm] = useState({
    name: '',
    description: '',
    visual_style: '',
    signature_elements: [] as string[],
    example_prompts: [] as string[],
    is_public: false
  });
  
  const [moodForm, setMoodForm] = useState({
    name: '',
    description: '',
    color_palette: '',
    lighting_style: '',
    atmosphere_description: '',
    example_prompts: [] as string[],
    is_public: false
  });

  // Load data on component mount
  useEffect(() => {
    loadTemplates();
    loadDirectors();
    loadMoods();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/cinematic-prompts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDirectors = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/custom-directors?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDirectors(data.directors || []);
      } else {
        setDirectors([]);
      }
    } catch (error) {
      console.error('Error loading directors:', error);
      setDirectors([]);
    }
  };

  const loadMoods = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/custom-moods?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMoods(data.moods || []);
      } else {
        setMoods([]);
      }
    } catch (error) {
      console.error('Error loading moods:', error);
      setMoods([]);
    }
  };

  // Reload data when filters change
  useEffect(() => {
    loadTemplates();
    loadDirectors();
    loadMoods();
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const handleTemplateSelect = (template: CinematicPromptTemplate) => {
    onTemplateSelect?.(template);
  };

  const handleDirectorSelect = (director: CustomDirector) => {
    // Transform the director data to match expected format
    const transformedDirector = {
      ...director,
      name: director.label
    };
    onDirectorSelect?.(transformedDirector);
  };

  const handleMoodSelect = (mood: CustomSceneMood) => {
    // Transform the mood data to match expected format
    const transformedMood = {
      ...mood,
      name: mood.label
    };
    onMoodSelect?.(transformedMood);
  };

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/cinematic-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setTemplates(prev => [data.template, ...prev]);
        setShowCreateTemplate(false);
        setTemplateForm({
          name: '',
          description: '',
          category: 'portrait',
          base_prompt: '',
          cinematic_parameters: {},
          difficulty: 'beginner',
          tags: [],
          is_public: false
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const createDirector = async () => {
    try {
      const response = await fetch('/api/custom-directors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directorForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setDirectors(prev => [data.director, ...prev]);
        setShowCreateDirector(false);
        setDirectorForm({
          name: '',
          description: '',
          visual_style: '',
          signature_elements: [],
          example_prompts: [],
          is_public: false
        });
      }
    } catch (error) {
      console.error('Error creating director:', error);
    }
  };

  const createMood = async () => {
    try {
      const response = await fetch('/api/custom-moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setMoods(prev => [data.mood, ...prev]);
        setShowCreateMood(false);
        setMoodForm({
          name: '',
          description: '',
          color_palette: '',
          lighting_style: '',
          atmosphere_description: '',
          example_prompts: [],
          is_public: false
        });
      }
    } catch (error) {
      console.error('Error creating mood:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-primary-100 text-primary-800';
      case 'intermediate': return 'bg-primary-100 text-primary-800';
      case 'advanced': return 'bg-destructive-100 text-destructive-800';
      default: return 'bg-muted-100 text-muted-foreground-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'portrait': return <Camera className="h-4 w-4" />;
      case 'landscape': return <Eye className="h-4 w-4" />;
      case 'cinematic': return <Film className="h-4 w-4" />;
      case 'fashion': return <Star className="h-4 w-4" />;
      case 'architecture': return <Settings className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Film className="h-5 w-5" />
            Cinematic Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates, directors, moods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="directors">Directors</TabsTrigger>
              <TabsTrigger value="moods">Moods</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="space-y-2">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading templates...</div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Film className="h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">No cinematic templates available</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Templates will appear here when they're added to the database
                    </div>
                  </div>
                ) : (
                  templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <span className="font-medium text-sm leading-tight truncate">{template.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <Badge className={`${getDifficultyColor(template.difficulty)} flex-shrink-0 text-xs`}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="directors" className="space-y-2">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading directors...</div>
                  </div>
                ) : directors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Film className="h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">No custom directors available</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Directors will appear here when they're added to the database
                    </div>
                  </div>
                ) : (
                  directors.map((director) => (
                  <div
                    key={director.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleDirectorSelect(director)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm leading-tight block truncate">{director.label}</span>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {director.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {director.usage_count}
                      </Badge>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="moods" className="space-y-2">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading moods...</div>
                  </div>
                ) : moods.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Palette className="h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">No custom moods available</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Moods will appear here when they're added to the database
                    </div>
                  </div>
                ) : (
                  moods.map((mood) => (
                  <div
                    key={mood.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleMoodSelect(mood)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm leading-tight block truncate">{mood.label}</span>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {mood.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {mood.usage_count}
                      </Badge>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Cinematic Prompt Library
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates, directors, moods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="architecture">Architecture</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="abstract">Abstract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="directors" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Directors
            </TabsTrigger>
            <TabsTrigger value="moods" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Moods
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Prompt Templates</h3>
              <Badge variant="outline">
                {templates.length} templates
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        <CardTitle className="text-base">{template.name}</CardTitle>
                      </div>
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Base Prompt:</strong> {template.base_prompt}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Used {template.usage_count} times</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="directors" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Custom Directors</h3>
              <Badge variant="outline">
                {directors.length} directors
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {directors.map((director) => (
                <Card key={director.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{director.label}</CardTitle>
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {director.usage_count}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {director.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Value:</strong> {director.value}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {director.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDirectorSelect(director)}
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Use Director Style
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="moods" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Custom Scene Moods</h3>
              <Badge variant="outline">
                {moods.length} moods
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moods.map((mood) => (
                <Card key={mood.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{mood.label}</CardTitle>
                      <Badge variant="outline">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {mood.usage_count}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mood.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Value:</strong> {mood.value}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {mood.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoodSelect(mood)}
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Use Scene Mood
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Create Template
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create a new cinematic prompt template
                  </p>
                </CardHeader>
                <CardContent>
                  <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Cinematic Prompt Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="template-name">Name *</Label>
                              <Input
                                id="template-name"
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                placeholder="Template name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="template-category">Category</Label>
                              <Select value={templateForm.category} onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="portrait">Portrait</SelectItem>
                                  <SelectItem value="landscape">Landscape</SelectItem>
                                  <SelectItem value="cinematic">Cinematic</SelectItem>
                                  <SelectItem value="fashion">Fashion</SelectItem>
                                  <SelectItem value="architecture">Architecture</SelectItem>
                                  <SelectItem value="nature">Nature</SelectItem>
                                  <SelectItem value="abstract">Abstract</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="template-description">Description</Label>
                            <Textarea
                              id="template-description"
                              value={templateForm.description}
                              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                              placeholder="Template description"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="template-prompt">Base Prompt *</Label>
                            <Textarea
                              id="template-prompt"
                              value={templateForm.base_prompt}
                              onChange={(e) => setTemplateForm({ ...templateForm, base_prompt: e.target.value })}
                              placeholder="e.g., portrait of {subject}"
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Cinematic Parameters */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Cinematic Parameters</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Camera Settings */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Camera Settings</h4>
                              <div className="space-y-2">
                                <Label htmlFor="camera-angle">Camera Angle</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.cameraAngle || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, cameraAngle: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select camera angle" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.CAMERA_ANGLES.map((angle) => (
                                      <SelectItem key={angle} value={angle}>
                                        {angle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lens-type">Lens Type</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.lensType || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, lensType: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select lens type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.LENS_TYPES.map((lens) => (
                                      <SelectItem key={lens} value={lens}>
                                        {lens.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Lighting & Style */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Lighting & Style</h4>
                              <div className="space-y-2">
                                <Label htmlFor="lighting-style">Lighting Style</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.lightingStyle || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, lightingStyle: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select lighting style" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.LIGHTING_STYLES.map((lighting) => (
                                      <SelectItem key={lighting} value={lighting}>
                                        {lighting.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="color-palette">Color Palette</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.colorPalette || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, colorPalette: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select color palette" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.COLOR_PALETTES.map((palette) => (
                                      <SelectItem key={palette} value={palette}>
                                        {palette.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Director & Mood */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Director & Mood</h4>
                              <div className="space-y-2">
                                <Label htmlFor="director-style">Director Style</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.directorStyle || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, directorStyle: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select director style" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.DIRECTOR_STYLES.map((director) => (
                                      <SelectItem key={director} value={director}>
                                        {director.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="scene-mood">Scene Mood</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.sceneMood || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, sceneMood: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select scene mood" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.SCENE_MOODS.map((mood) => (
                                      <SelectItem key={mood} value={mood}>
                                        {mood.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Shot & Composition */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Shot & Composition</h4>
                              <div className="space-y-2">
                                <Label htmlFor="shot-size">Shot Size</Label>
                                <Select 
                                  value={templateForm.cinematic_parameters.shotSize || ''} 
                                  onValueChange={(value) => setTemplateForm({ 
                                    ...templateForm, 
                                    cinematic_parameters: { ...templateForm.cinematic_parameters, shotSize: value as any }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select shot size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CINEMATIC_PARAMETERS.SHOT_SIZES.map((shot) => (
                                      <SelectItem key={shot} value={shot}>
                                        {shot.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty Level</Label>
                                <Select 
                                  value={templateForm.difficulty} 
                                  onValueChange={(value) => setTemplateForm({ ...templateForm, difficulty: value as any })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Settings */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Settings</h3>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="template-public"
                              checked={templateForm.is_public}
                              onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_public: checked })}
                            />
                            <Label htmlFor="template-public">Make public</Label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createTemplate}>
                            Create Template
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Add Director
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add a custom director style
                  </p>
                </CardHeader>
                <CardContent>
                  <Dialog open={showCreateDirector} onOpenChange={setShowCreateDirector}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Director
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Custom Director</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="director-name">Name *</Label>
                          <Input
                            id="director-name"
                            value={directorForm.name}
                            onChange={(e) => setDirectorForm({ ...directorForm, name: e.target.value })}
                            placeholder="Director name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="director-description">Description</Label>
                          <Textarea
                            id="director-description"
                            value={directorForm.description}
                            onChange={(e) => setDirectorForm({ ...directorForm, description: e.target.value })}
                            placeholder="Director description"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="director-style">Visual Style</Label>
                          <Textarea
                            id="director-style"
                            value={directorForm.visual_style}
                            onChange={(e) => setDirectorForm({ ...directorForm, visual_style: e.target.value })}
                            placeholder="Describe the visual style"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="director-public"
                            checked={directorForm.is_public}
                            onCheckedChange={(checked) => setDirectorForm({ ...directorForm, is_public: checked })}
                          />
                          <Label htmlFor="director-public">Make public</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCreateDirector(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createDirector}>
                            Add Director
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Add Mood
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add a custom scene mood
                  </p>
                </CardHeader>
                <CardContent>
                  <Dialog open={showCreateMood} onOpenChange={setShowCreateMood}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mood
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Custom Scene Mood</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="mood-name">Name *</Label>
                          <Input
                            id="mood-name"
                            value={moodForm.name}
                            onChange={(e) => setMoodForm({ ...moodForm, name: e.target.value })}
                            placeholder="Mood name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mood-description">Description</Label>
                          <Textarea
                            id="mood-description"
                            value={moodForm.description}
                            onChange={(e) => setMoodForm({ ...moodForm, description: e.target.value })}
                            placeholder="Mood description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mood-palette">Color Palette</Label>
                            <Input
                              id="mood-palette"
                              value={moodForm.color_palette}
                              onChange={(e) => setMoodForm({ ...moodForm, color_palette: e.target.value })}
                              placeholder="e.g., warm-golden"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mood-lighting">Lighting Style</Label>
                            <Input
                              id="mood-lighting"
                              value={moodForm.lighting_style}
                              onChange={(e) => setMoodForm({ ...moodForm, lighting_style: e.target.value })}
                              placeholder="e.g., soft-light"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mood-atmosphere">Atmosphere Description</Label>
                          <Textarea
                            id="mood-atmosphere"
                            value={moodForm.atmosphere_description}
                            onChange={(e) => setMoodForm({ ...moodForm, atmosphere_description: e.target.value })}
                            placeholder="Describe the atmosphere"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="mood-public"
                            checked={moodForm.is_public}
                            onCheckedChange={(checked) => setMoodForm({ ...moodForm, is_public: checked })}
                          />
                          <Label htmlFor="mood-public">Make public</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCreateMood(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createMood}>
                            Add Mood
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
