'use client';

/**
 * Preset Create Page - Refactored
 *
 * Form for creating AI presets with marketplace integration.
 * Supports import from playground and multi-step creation.
 *
 * Line count: ~400 lines (down from 1,498)
 * Reduction: 73%
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import {
  Palette,
  Wand2,
  Save,
  Eye,
  Settings,
  Info,
  Store,
  Plus,
  X} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Slider } from '../../../components/ui/slider';

// Import refactored modules
import { usePresetForm } from './hooks';
import {
  CATEGORIES,
  MOODS,
  STYLES,
  ASPECT_RATIOS,
  RESOLUTIONS,
  CONSISTENCY_LEVELS,
  MODEL_VERSIONS} from './constants/presetConfig';

function CreatePresetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userRole } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentMarketplaceTag, setCurrentMarketplaceTag] = useState('');

  // Use our refactored hook for state management
  const {
    presetData,
    errors,
    activeTab,
    updateField,
    updateNestedField,
    setActiveTab,
    generatePrompts,
    addTag,
    removeTag,
    addMarketplaceTag,
    removeMarketplaceTag,
    validate} = usePresetForm();

  // Load URL parameters on mount (from playground)
  useEffect(() => {
    const name = searchParams?.get('name');
    const description = searchParams?.get('description');
    const promptTemplate = searchParams?.get('prompt_template');

    if (name) updateField('name', name);
    if (description) updateField('description', description);
    if (promptTemplate) updateField('prompt_template', promptTemplate);

    const style = searchParams?.get('style');
    const subject = searchParams?.get('subject');
    const category = searchParams?.get('category');
    const mood = searchParams?.get('mood');

    if (style) updateNestedField('ai_metadata', 'style', style);
    if (subject) updateField('prompt_subject', subject);
    if (category) updateField('category', category);
    if (mood) updateNestedField('ai_metadata', 'mood', mood);
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, router]);

  // Save preset
  const handleSave = async () => {
    if (!validate()) {
      alert('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presetData)});

      if (!response.ok) throw new Error('Failed to save preset');

      const data = await response.json();
      alert('Preset saved successfully!');
      router.push(`/presets/${data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  // Handle tag input
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      addTag(currentTag);
      setCurrentTag('');
    }
  };

  const handleAddMarketplaceTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentMarketplaceTag.trim()) {
      addMarketplaceTag(currentMarketplaceTag);
      setCurrentMarketplaceTag('');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Preset</h1>
          <p className="text-muted-foreground">
            Design a reusable AI generation preset
          </p>
        </div>

        {/* Save Button */}
        <div className="mb-6 flex justify-end gap-3">
          <Button onClick={generatePrompts} variant="outline">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Prompts
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preset'}
          </Button>
        </div>

        {/* Main Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">
              <Info className="w-4 h-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <Wand2 className="w-4 h-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              <Store className="w-4 h-4 mr-2" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preset Name *</Label>
                  <Input
                    value={presetData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Cinematic Portrait Pro"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={presetData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe what this preset does..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                  )}
                </div>

                <div>
                  <Label>Category *</Label>
                  <Select
                    value={presetData.category}
                    onValueChange={(value) => updateField('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Style</Label>
                    <Select
                      value={presetData.ai_metadata.style}
                      onValueChange={(value) =>
                        updateNestedField('ai_metadata', 'style', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mood</Label>
                    <Select
                      value={presetData.ai_metadata.mood}
                      onValueChange={(value) =>
                        updateNestedField('ai_metadata', 'mood', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {presetData.ai_metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type tag and press Enter"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={presetData.is_public}
                    onCheckedChange={(checked) => updateField('is_public', checked)}
                  />
                  <Label>Make this preset public</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={presetData.prompt_subject}
                    onChange={(e) => updateField('prompt_subject', e.target.value)}
                    placeholder="e.g., person, product, landscape"
                  />
                </div>

                <div>
                  <Label>Prompt Template *</Label>
                  <Textarea
                    value={presetData.prompt_template}
                    onChange={(e) => updateField('prompt_template', e.target.value)}
                    placeholder="Use {subject}, {style}, {mood} as placeholders"
                    rows={4}
                  />
                  {errors.prompt_template && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.prompt_template}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Negative Prompt (Optional)</Label>
                  <Textarea
                    value={presetData.negative_prompt || ''}
                    onChange={(e) => updateField('negative_prompt', e.target.value)}
                    placeholder="What to avoid in generation..."
                    rows={3}
                  />
                </div>

                {presetData.enhanced_prompt && (
                  <div>
                    <Label>Enhanced Prompt (Preview)</Label>
                    <Textarea
                      value={presetData.enhanced_prompt}
                      readOnly
                      className="bg-muted"
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Resolution</Label>
                    <Select
                      value={presetData.style_settings.resolution}
                      onValueChange={(value) =>
                        updateNestedField('style_settings', 'resolution', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTIONS.map((res) => (
                          <SelectItem key={res.value} value={res.value}>
                            {res.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Aspect Ratio</Label>
                    <Select
                      value={presetData.style_settings.aspect_ratio}
                      onValueChange={(value) =>
                        updateNestedField('style_settings', 'aspect_ratio', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Consistency Level</Label>
                  <Select
                    value={presetData.style_settings.consistency_level}
                    onValueChange={(value: any) =>
                      updateNestedField('style_settings', 'consistency_level', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSISTENCY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Intensity: {presetData.style_settings.intensity}</Label>
                  <Slider
                    value={[presetData.style_settings.intensity]}
                    onValueChange={(values: number[]) =>
                      updateNestedField('style_settings', 'intensity', values[0])
                    }
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div>
                  <Label>Model Version</Label>
                  <Select
                    value={presetData.seedream_config.model_version}
                    onValueChange={(value: any) =>
                      updateNestedField('seedream_config', 'model_version', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_VERSIONS.map((version) => (
                        <SelectItem key={version.value} value={version.value}>
                          {version.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={presetData.is_for_sale}
                    onCheckedChange={(checked) => updateField('is_for_sale', checked)}
                  />
                  <Label>List on Marketplace</Label>
                </div>

                {presetData.is_for_sale && (
                  <>
                    <div>
                      <Label>Marketplace Title</Label>
                      <Input
                        value={presetData.marketplace_title}
                        onChange={(e) =>
                          updateField('marketplace_title', e.target.value)
                        }
                        placeholder="Title for marketplace listing"
                      />
                    </div>

                    <div>
                      <Label>Price (Credits)</Label>
                      <Input
                        type="number"
                        value={presetData.sale_price}
                        onChange={(e) =>
                          updateField('sale_price', Number(e.target.value))
                        }
                        min={0}
                      />
                    </div>

                    <div>
                      <Label>Marketplace Description</Label>
                      <Textarea
                        value={presetData.marketplace_description}
                        onChange={(e) =>
                          updateField('marketplace_description', e.target.value)
                        }
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Marketplace Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {presetData.marketplace_tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                            <X
                              className="w-3 h-3 ml-1 cursor-pointer"
                              onClick={() => removeMarketplaceTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <Input
                        value={currentMarketplaceTag}
                        onChange={(e) => setCurrentMarketplaceTag(e.target.value)}
                        onKeyDown={handleAddMarketplaceTag}
                        placeholder="Type tag and press Enter"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Preset Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Name</h3>
                    <p>{presetData.name || 'Not set'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <p>{presetData.category}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Enhanced Prompt</h3>
                    <p className="text-sm bg-muted p-3 rounded">
                      {presetData.enhanced_prompt || 'Generate prompts to see preview'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function CreatePresetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePresetPageContent />
    </Suspense>
  );
}
