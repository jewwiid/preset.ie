'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { StitchImage } from './StitchImageManager';
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters';

interface CreateStitchPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceImages: StitchImage[];
  currentPrompt: string;
  currentAspectRatio?: string;
  currentMaxImages?: number;
  currentCinematicParams?: Partial<CinematicParameters>;
  currentProvider?: string;
  onPresetCreated?: (preset: any) => void;
}

const PRESET_CATEGORIES = [
  { id: 'character-scene', name: 'Character & Scene' },
  { id: 'product-marketing', name: 'Product Marketing' },
  { id: 'style-transfer', name: 'Style Transfer' },
  { id: 'creative-composite', name: 'Creative Composite' },
];

export default function CreateStitchPresetDialog({
  open,
  onOpenChange,
  sourceImages,
  currentPrompt,
  currentAspectRatio = '1:1',
  currentMaxImages = 5,
  currentCinematicParams = {},
  currentProvider = 'nanobanana',
  onPresetCreated}: CreateStitchPresetDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('character-scene');
  const [promptTemplate, setPromptTemplate] = useState(currentPrompt);
  const [requiredTypes, setRequiredTypes] = useState<string[]>([]);
  const [optionalTypes, setOptionalTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('');
  const [tips, setTips] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  // Extract unique image types from current source images
  const availableTypes = Array.from(
    new Set(
      sourceImages.map((img) =>
        img.type === 'custom' && img.customLabel ? img.customLabel : img.type
      )
    )
  ).filter((type) => type !== 'custom');

  const handleAddRequiredType = useCallback((type: string) => {
    if (!type || requiredTypes.includes(type) || optionalTypes.includes(type)) return;
    setRequiredTypes((prev) => [...prev, type]);
  }, [requiredTypes, optionalTypes]);

  const handleAddOptionalType = useCallback((type: string) => {
    if (!type || requiredTypes.includes(type) || optionalTypes.includes(type)) return;
    setOptionalTypes((prev) => [...prev, type]);
  }, [requiredTypes, optionalTypes]);

  const handleRemoveRequiredType = useCallback((type: string) => {
    setRequiredTypes((prev) => prev.filter((t) => t !== type));
  }, []);

  const handleRemoveOptionalType = useCallback((type: string) => {
    setOptionalTypes((prev) => prev.filter((t) => t !== type));
  }, []);

  const handleAddNewType = useCallback(() => {
    if (!newTypeInput.trim()) return;
    const type = newTypeInput.trim();
    if (!requiredTypes.includes(type) && !optionalTypes.includes(type)) {
      handleAddRequiredType(type);
      setNewTypeInput('');
    }
  }, [newTypeInput, requiredTypes, optionalTypes, handleAddRequiredType]);

  const handleConvertPromptToTemplate = useCallback(() => {
    let template = promptTemplate;
    
    // Replace actual image type mentions with placeholders
    availableTypes.forEach((type) => {
      const regex = new RegExp(`\\b${type}s?\\b`, 'gi');
      template = template.replace(regex, `{${type}}`);
    });
    
    // Add {count} if it mentions numbers
    if (/\d+\s+(images?|shots?|photos?)/i.test(template)) {
      template = template.replace(/\d+\s+(images?|shots?|photos?)/gi, '{count} $1');
    }
    
    setPromptTemplate(template);
    toast.success('Prompt converted to template with placeholders');
  }, [promptTemplate, availableTypes]);

  const handleCreate = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    if (!promptTemplate.trim()) {
      toast.error('Please enter a prompt template');
      return;
    }
    if (requiredTypes.length === 0) {
      toast.error('Please add at least one required image type');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/stitch/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          prompt_template: promptTemplate.trim(),
          required_image_types: requiredTypes,
          optional_image_types: optionalTypes,
          max_images_suggestion: currentMaxImages,
          aspect_ratio_suggestion: currentAspectRatio,
          provider_preference: currentProvider,
          cinematic_parameters: Object.keys(currentCinematicParams).length > 0 ? currentCinematicParams : {},
          usage_instructions: usageInstructions.trim() || null,
          tips: tips.trim() || null,
          is_public: isPublic})});

      if (response.ok) {
        const { preset } = await response.json();
        toast.success('Preset created successfully!');
        onPresetCreated?.(preset);
        onOpenChange(false);
        
        // Reset form
        setName('');
        setDescription('');
        setPromptTemplate('');
        setRequiredTypes([]);
        setOptionalTypes([]);
        setUsageInstructions('');
        setTips('');
        setIsPublic(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create preset');
      }
    } catch (error) {
      console.error('Error creating preset:', error);
      toast.error('Failed to create preset');
    } finally {
      setCreating(false);
    }
  }, [
    name,
    description,
    category,
    promptTemplate,
    requiredTypes,
    optionalTypes,
    currentMaxImages,
    currentAspectRatio,
    currentProvider,
    currentCinematicParams,
    usageInstructions,
    tips,
    isPublic,
    onPresetCreated,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Stitch Preset</DialogTitle>
          <DialogDescription>
            Save your current Stitch configuration as a reusable preset. Use template variables like {'{character}'}, {'{location}'}, {'{count}'} in your prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name *</Label>
            <Input
              id="preset-name"
              placeholder="e.g., Character in Different Locations"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-description">Description</Label>
            <Textarea
              id="preset-description"
              placeholder="Describe what this preset does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="preset-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-template">Prompt Template *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleConvertPromptToTemplate}
              >
                Auto-Convert to Template
              </Button>
            </div>
            <Textarea
              id="prompt-template"
              placeholder="Use {character}, {location}, {style}, {count} as placeholders..."
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Placeholders will be replaced with actual image types when preset is used
            </p>
          </div>

          {/* Required Image Types */}
          <div className="space-y-2">
            <Label>Required Image Types *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {requiredTypes.map((type) => (
                <Badge key={type} variant="default">
                  {type}
                  <button
                    type="button"
                    onClick={() => handleRemoveRequiredType(type)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {requiredTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">No required types yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={handleAddRequiredType}>
                <SelectTrigger>
                  <SelectValue placeholder="Add from current images..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes
                    .filter((type) => !requiredTypes.includes(type) && !optionalTypes.includes(type))
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1 flex-1">
                <Input
                  placeholder="Or type custom..."
                  value={newTypeInput}
                  onChange={(e) => setNewTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewType();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddNewType}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Optional Image Types */}
          <div className="space-y-2">
            <Label>Optional Image Types</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {optionalTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                  <button
                    type="button"
                    onClick={() => handleRemoveOptionalType(type)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {optionalTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">No optional types</p>
              )}
            </div>
            <Select onValueChange={handleAddOptionalType}>
              <SelectTrigger>
                <SelectValue placeholder="Add optional type..." />
              </SelectTrigger>
              <SelectContent>
                {availableTypes
                  .filter((type) => !requiredTypes.includes(type) && !optionalTypes.includes(type))
                  .map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Usage Instructions & Tips */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usage-instructions">Usage Instructions</Label>
              <Textarea
                id="usage-instructions"
                placeholder="How to use this preset..."
                value={usageInstructions}
                onChange={(e) => setUsageInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tips">Tips</Label>
              <Textarea
                id="tips"
                placeholder="Pro tips for best results..."
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Settings Summary */}
          <div className="rounded-lg border p-3 space-y-1 text-sm bg-muted/30">
            <p className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Current Settings (will be saved with preset)
            </p>
            <p className="text-muted-foreground text-xs">
              • Max Images: {currentMaxImages}
            </p>
            <p className="text-muted-foreground text-xs">
              • Aspect Ratio: {currentAspectRatio}
            </p>
            <p className="text-muted-foreground text-xs">
              • Provider: {currentProvider}
            </p>
            {Object.keys(currentCinematicParams).length > 0 && (
              <p className="text-muted-foreground text-xs">
                • Cinematic Parameters: {Object.keys(currentCinematicParams).length} set
              </p>
            )}
          </div>

          {/* Make Public */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="public-preset">Make Public</Label>
              <p className="text-xs text-muted-foreground">
                Allow other users to discover and use this preset
              </p>
            </div>
            <Switch
              id="public-preset"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Preset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

