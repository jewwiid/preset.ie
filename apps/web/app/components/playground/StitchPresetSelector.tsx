'use client';

import { useState, useEffect, useCallback } from 'react';
import { StitchPreset, STITCH_PRESETS } from '../../../types/stitch-preset';
import { StitchImage } from './StitchImageManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, CheckCircle, XCircle, Plus, Heart, Globe, User, Sparkles } from 'lucide-react';
import { buildStitchPrompt, validateStitchPreset } from '../../../lib/stitch-prompt-builder';
import { toast } from 'sonner';
import CreateStitchPresetDialog from './CreateStitchPresetDialog';
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters';

interface StitchPresetSelectorProps {
  sourceImages: StitchImage[];
  currentPrompt: string;
  currentAspectRatio?: string;
  currentMaxImages?: number;
  currentCinematicParams?: Partial<CinematicParameters>;
  currentProvider?: string;
  onPresetSelect: (preset: StitchPreset | null) => void;
  onApplyPreset: (data: {
    prompt: string;
    aspectRatio?: string;
    maxImages?: number;
    cinematicParams?: any;
  }) => void;
}

export default function StitchPresetSelector({
  sourceImages,
  currentPrompt,
  currentAspectRatio,
  currentMaxImages,
  currentCinematicParams,
  currentProvider,
  onPresetSelect,
  onApplyPreset
}: StitchPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<StitchPreset | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ 
    valid: true, 
    errors: [] 
  });
  const [userPresets, setUserPresets] = useState<any[]>([]);
  const [publicPresets, setPublicPresets] = useState<any[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [presetScope, setPresetScope] = useState<'mine' | 'public' | 'built-in'>('built-in');

  // Fetch user and public presets
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        // Fetch user's presets
        const mineResponse = await fetch('/api/stitch/presets?scope=mine');
        if (mineResponse.ok) {
          const { presets } = await mineResponse.json();
          setUserPresets(presets || []);
        }

        // Fetch public presets
        const publicResponse = await fetch('/api/stitch/presets?scope=public&limit=20');
        if (publicResponse.ok) {
          const { presets } = await publicResponse.json();
          setPublicPresets(presets || []);
        }
      } catch (error) {
        console.error('Error fetching presets:', error);
      } finally {
        setLoadingPresets(false);
      }
    };

    fetchPresets();
  }, []);

  useEffect(() => {
    if (selectedPreset) {
      const result = validateStitchPreset(selectedPreset, sourceImages);
      setValidation(result);
    }
  }, [selectedPreset, sourceImages]);

  const handlePresetChange = (presetId: string) => {
    if (presetId === 'none') {
      setSelectedPreset(null);
      onPresetSelect(null);
      return;
    }

    // Check built-in presets
    let preset = STITCH_PRESETS.find(p => p.id === presetId);
    
    // Check user presets
    if (!preset) {
      preset = userPresets.find(p => p.id === presetId);
    }
    
    // Check public presets
    if (!preset) {
      preset = publicPresets.find(p => p.id === presetId);
    }

    if (preset) {
      setSelectedPreset(preset);
      onPresetSelect(preset);
    }
  };

  const handleApplyPreset = useCallback(async () => {
    if (!selectedPreset || !validation.valid) return;

    const { prompt } = buildStitchPrompt(selectedPreset, sourceImages, selectedPreset.max_images_suggestion || 5);
    
    onApplyPreset({
      prompt,
      aspectRatio: selectedPreset.aspect_ratio_suggestion,
      maxImages: selectedPreset.max_images_suggestion,
      cinematicParams: selectedPreset.cinematic_parameters || (selectedPreset as any).cinematic_params});

    // Track usage if it's a database preset
    if (selectedPreset.id && !STITCH_PRESETS.find(p => p.id === selectedPreset.id)) {
      try {
        await fetch(`/api/stitch/presets/${selectedPreset.id}/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            num_images_generated: selectedPreset.max_images_suggestion,
            aspect_ratio_used: selectedPreset.aspect_ratio_suggestion,
            provider_used: currentProvider,
            success: true})});
      } catch (error) {
        console.error('Error tracking preset usage:', error);
      }
    }
  }, [selectedPreset, validation, sourceImages, onApplyPreset, currentProvider]);

  const handlePresetCreated = useCallback((preset: any) => {
    setUserPresets((prev) => [preset, ...prev]);
    toast.success('Preset created! It will appear in "My Presets"');
  }, []);

  const handleLikePreset = useCallback(async (presetId: string, isLiked: boolean) => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/stitch/presets/${presetId}/like`, { method });
      
      if (response.ok) {
        // Update local state
        setPublicPresets((prev) =>
          prev.map((p) =>
            p.id === presetId
              ? { ...p, is_liked: !isLiked, likes_count: p.likes_count + (isLiked ? -1 : 1) }
              : p
          )
        );
        toast.success(isLiked ? 'Preset unliked' : 'Preset liked!');
      }
    } catch (error) {
      console.error('Error liking preset:', error);
      toast.error('Failed to update like status');
    }
  }, []);

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Stitch Presets</CardTitle>
            <CardDescription>
              Use templates to guide your multi-image generation
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            disabled={sourceImages.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={presetScope} onValueChange={(v) => setPresetScope(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="built-in" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Built-in
            </TabsTrigger>
            <TabsTrigger value="mine" className="gap-1">
              <User className="h-3 w-3" />
              Mine ({userPresets.length})
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-1">
              <Globe className="h-3 w-3" />
              Public
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="built-in" className="space-y-3">
            <Select value={selectedPreset?.id || 'none'} onValueChange={handlePresetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a built-in preset..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Preset (Custom)</SelectItem>
                {STITCH_PRESETS.map(preset => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>

          <TabsContent value="mine" className="space-y-3">
            {userPresets.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No custom presets yet. Create one to get started!
              </div>
            ) : (
              <Select value={selectedPreset?.id || 'none'} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your preset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Preset (Custom)</SelectItem>
                  {userPresets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} {preset.usage_count > 0 && `(${preset.usage_count} uses)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </TabsContent>

          <TabsContent value="public" className="space-y-3">
            {loadingPresets ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Loading presets...
              </div>
            ) : publicPresets.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No public presets available yet
              </div>
            ) : (
              <Select value={selectedPreset?.id || 'none'} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a public preset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Preset (Custom)</SelectItem>
                  {publicPresets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} ❤️ {preset.likes_count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </TabsContent>
        </Tabs>

        {selectedPreset && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <p className="font-medium mb-1">{selectedPreset.description}</p>
                <p className="mt-2">
                  <strong>Required:</strong> {selectedPreset.required_image_types.join(', ')}
                </p>
                {selectedPreset.optional_image_types && selectedPreset.optional_image_types.length > 0 && (
                  <p>
                    <strong>Optional:</strong> {selectedPreset.optional_image_types.join(', ')}
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {/* Validation badges */}
            <div className="flex flex-wrap gap-2">
              {selectedPreset.required_image_types.map((type: string) => {
                const hasType = sourceImages.some(img => 
                  (img.type === 'custom' && img.customLabel === type) || img.type === type
                );
                return (
                  <Badge
                    key={type}
                    variant={hasType ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {hasType ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {type}
                  </Badge>
                );
              })}
            </div>

            {/* Like button for public presets */}
            {presetScope === 'public' && selectedPreset.id && !(selectedPreset as any).is_mine && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLikePreset(selectedPreset.id!, (selectedPreset as any).is_liked)}
                className="w-full gap-2"
              >
                <Heart className={`h-4 w-4 ${(selectedPreset as any).is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                {(selectedPreset as any).is_liked ? 'Liked' : 'Like'} ({selectedPreset.likes_count || 0})
              </Button>
            )}

            {!validation.valid && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">
                  {validation.errors.map((err: string, i: number) => (
                    <p key={i}>• {err}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleApplyPreset}
              disabled={!validation.valid}
              className="w-full"
            >
              Apply Preset
            </Button>
          </>
        )}
      </CardContent>
    </Card>

    {/* Create Preset Dialog */}
    <CreateStitchPresetDialog
      open={showCreateDialog}
      onOpenChange={setShowCreateDialog}
      sourceImages={sourceImages}
      currentPrompt={currentPrompt}
      currentAspectRatio={currentAspectRatio}
      currentMaxImages={currentMaxImages}
      currentCinematicParams={currentCinematicParams}
      currentProvider={currentProvider}
      onPresetCreated={handlePresetCreated}
    />
    </>
  );
}

