'use client';

import React, { useState, useEffect } from 'react';
import { 
  CameraAngle, 
  LensType, 
  ShotSize, 
  DepthOfField,
  CompositionTechnique,
  LightingStyle,
  ColorPalette,
  DirectorStyle,
  EraEmulation,
  SceneMood,
  CameraMovement,
  AspectRatio,
  TimeSetting,
  WeatherCondition,
  LocationType,
  CinematicParameters
} from '../../../../../packages/types/src/cinematic-parameters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Slider } from '../../../components/ui/slider';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { 
  Camera, 
  Lightbulb, 
  Palette, 
  Film, 
  Compass, 
  Clock, 
  MapPin,
  Settings,
  Wand2,
  Eye,
  Zap
} from 'lucide-react';

interface CinematicParameterSelectorProps {
  parameters: Partial<CinematicParameters>;
  onParametersChange: (parameters: Partial<CinematicParameters>) => void;
  onGenerateTemplate?: (category: string, mood: SceneMood, style?: DirectorStyle) => void;
  onToggleChange?: (includeTechnicalDetails: boolean, includeStyleReferences: boolean) => void;
  onClear?: () => void;
  showAdvanced?: boolean;
  compact?: boolean;
}

export default function CinematicParameterSelector({
  parameters,
  onParametersChange,
  onGenerateTemplate,
  onToggleChange,
  onClear,
  showAdvanced = false,
  compact = false
}: CinematicParameterSelectorProps) {
  const [activeTab, setActiveTab] = useState('camera');
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true);
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true);
  
  // Dynamic parameters state
  const [dynamicParameters, setDynamicParameters] = useState<Record<string, any[]>>({});
  const [loadingParameters, setLoadingParameters] = useState(false);

  // Fetch dynamic parameters from API
  useEffect(() => {
    const fetchParameters = async () => {
      setLoadingParameters(true);
      try {
        const response = await fetch('/api/cinematic-parameters');
        const data = await response.json();
        
        if (data.success) {
          setDynamicParameters(data.parameters);
          console.log('🔍 Loaded dynamic parameters:', data.parameters);
        }
      } catch (error) {
        console.error('Failed to fetch cinematic parameters:', error);
      } finally {
        setLoadingParameters(false);
      }
    };

    fetchParameters();
  }, []);

  // Notify parent when toggle states change
  useEffect(() => {
    if (onToggleChange) {
      onToggleChange(includeTechnicalDetails, includeStyleReferences);
    }
  }, [includeTechnicalDetails, includeStyleReferences, onToggleChange]);

  const updateParameter = <K extends keyof CinematicParameters>(
    key: K,
    value: CinematicParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value
    });
  };

  const clearParameter = (key: keyof CinematicParameters) => {
    const newParams = { ...parameters };
    delete newParams[key];
    onParametersChange(newParams);
  };

  // Helper function to convert database parameters to UI format
  const getParameterOptions = (category: string) => {
    const dbParams = dynamicParameters[category] || [];
    return dbParams.map(param => ({
      value: param.value,
      label: param.label,
      description: param.description
    }));
  };

  // Track active preset
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [availablePresets, setAvailablePresets] = useState<any[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);

  // Fetch presets from API
  useEffect(() => {
    const fetchPresets = async () => {
      setPresetsLoading(true);
      try {
        const response = await fetch('/api/cinematic-presets');
        const data = await response.json();
        
        if (data.success) {
          setAvailablePresets(data.presets || []);
        } else {
          console.error('Failed to fetch presets:', data.error);
        }
      } catch (error) {
        console.error('Error fetching presets:', error);
      } finally {
        setPresetsLoading(false);
      }
    };

    fetchPresets();
  }, []);

  // Apply cinematic preset from database
  const applyCinematicPreset = (presetName: string) => {
    const preset = availablePresets.find(p => p.name === presetName);
    if (preset && preset.parameters) {
      setActivePreset(presetName);
      onParametersChange({
        ...parameters,
        ...preset.parameters
      });
    }
  };

  const generateTemplate = (category: 'portrait' | 'landscape' | 'street' | 'cinematic' | 'artistic' | 'commercial') => {
    if (onGenerateTemplate) {
      const mood = parameters.sceneMood || 'romantic';
      const style = parameters.directorStyle;
      onGenerateTemplate(category, mood, style);
    }
  };

  const ParameterSelect = ({
    label,
    value,
    options,
    onValueChange,
    icon: Icon,
    description 
  }: {
    label: string;
    value: string | undefined;
    options: { value: string; label: string; description?: string }[];
    onValueChange: (value: string) => void;
    icon?: React.ComponentType<any>;
    description?: string;
  }) => {
    // Find the currently selected option to get its description
    const selectedOption = options.find(option => option.value === value);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <Label className="text-sm font-medium">{label}</Label>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onValueChange('')}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>
        <Select value={value || ''} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span>{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Show description outside the dropdown */}
        {selectedOption?.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedOption.description}
          </p>
        )}
      </div>
    );
  };

  const cameraOptions = getParameterOptions('camera_angles');

  const lensOptions = getParameterOptions('lens_types');

  const lightingOptions = getParameterOptions('lighting_styles');

  const directorOptions = getParameterOptions('director_styles');

  const moodOptions = getParameterOptions('scene_moods');

  const colorOptions = getParameterOptions('color_palettes');

  // Show loading state if parameters are still being fetched
  if (loadingParameters) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wand2 className="h-4 w-4 text-primary" />
            Cinematic Parameters
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Loading cinematic parameters...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            Cinematic Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ParameterSelect
              label="Camera Angle"
              value={parameters.cameraAngle}
              options={cameraOptions}
              onValueChange={(value) => updateParameter('cameraAngle', value as CameraAngle)}
              icon={Camera}
            />
            <ParameterSelect
              label="Lens Type"
              value={parameters.lensType}
              options={lensOptions}
              onValueChange={(value) => updateParameter('lensType', value as LensType)}
              icon={Eye}
            />
            <ParameterSelect
              label="Lighting"
              value={parameters.lightingStyle}
              options={lightingOptions}
              onValueChange={(value) => updateParameter('lightingStyle', value as LightingStyle)}
              icon={Lightbulb}
            />
            <ParameterSelect
              label="Mood"
              value={parameters.sceneMood}
              options={moodOptions}
              onValueChange={(value) => updateParameter('sceneMood', value as SceneMood)}
              icon={Film}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="technical-details"
                checked={includeTechnicalDetails}
                onCheckedChange={setIncludeTechnicalDetails}
              />
              <Label htmlFor="technical-details" className="text-sm">
                Technical Details
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="style-references"
                checked={includeStyleReferences}
                onCheckedChange={setIncludeStyleReferences}
              />
              <Label htmlFor="style-references" className="text-sm">
                Style References
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          Cinematic Parameters
        </CardTitle>
        <div className="space-y-4">
          {/* Toggle Switches */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="technical-details"
                checked={includeTechnicalDetails}
                onCheckedChange={setIncludeTechnicalDetails}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="technical-details" className="text-sm font-medium text-foreground">
                Technical Details
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="style-references"
                checked={includeStyleReferences}
                onCheckedChange={setIncludeStyleReferences}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="style-references" className="text-sm font-medium text-foreground">
                Style References
              </Label>
            </div>
          </div>
          {/* Preset Buttons Grid */}
          {presetsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading presets...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {availablePresets.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {availablePresets.slice(0, 5).map((preset) => (
                      <Button
                        key={preset.id}
                        variant={activePreset === preset.name ? "default" : "secondary"}
                        size="sm"
                        onClick={() => applyCinematicPreset(preset.name)}
                        className={`text-xs font-medium transition-all duration-200 ${
                          activePreset === preset.name 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {preset.display_name}
                      </Button>
                    ))}
                  </div>
                  {availablePresets.length > 5 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {availablePresets.slice(5).map((preset) => (
                        <Button
                          key={preset.id}
                          variant={activePreset === preset.name ? "default" : "secondary"}
                          size="sm"
                          onClick={() => applyCinematicPreset(preset.name)}
                          className={`text-xs font-medium transition-all duration-200 ${
                            activePreset === preset.name 
                              ? 'bg-primary text-primary-foreground shadow-md' 
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {preset.display_name}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No presets available. Please try refreshing the page.
                </div>
              )}
            </div>
          )}
          
          {/* Selected Preset Description */}
          {activePreset && (() => {
            const selectedPreset = availablePresets.find(p => p.name === activePreset);
            return selectedPreset ? (
              <div className="mt-4 p-4 bg-card border border-border rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h4 className="text-sm font-semibold text-foreground">Selected Preset</h4>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="default" className="text-xs px-2 py-1 font-medium">
                    {selectedPreset.display_name}
                  </Badge>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {selectedPreset.description}
                  </span>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {selectedPreset.category}
                  </Badge>
                </div>
              </div>
            ) : null;
          })()}
          
          {/* Clear All Button */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActivePreset(null);
                if (onClear) {
                  onClear();
                } else {
                  onParametersChange({});
                }
              }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:border-destructive/20 transition-all duration-200"
            >
              Clear All Parameters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="lighting" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Lighting
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Style
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Camera Angle"
                value={parameters.cameraAngle}
                options={cameraOptions}
                onValueChange={(value) => updateParameter('cameraAngle', value as CameraAngle)}
                icon={Camera}
              />
              <ParameterSelect
                label="Lens Type"
                value={parameters.lensType}
                options={lensOptions}
                onValueChange={(value) => updateParameter('lensType', value as LensType)}
                icon={Eye}
              />
            </div>
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Shot Size"
                value={parameters.shotSize}
                options={getParameterOptions('shot_sizes')}
                onValueChange={(value) => updateParameter('shotSize', value as ShotSize)}
              />
              <ParameterSelect
                label="Depth of Field"
                value={parameters.depthOfField}
                options={getParameterOptions('depth_of_field')}
                onValueChange={(value) => updateParameter('depthOfField', value as DepthOfField)}
              />
            </div>
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Camera Movement"
                value={parameters.cameraMovement}
                options={getParameterOptions('camera_movements')}
                onValueChange={(value) => updateParameter('cameraMovement', value as CameraMovement)}
              />
              <ParameterSelect
                label="Composition Technique"
                value={parameters.compositionTechnique}
                options={getParameterOptions('composition_techniques')}
                onValueChange={(value) => updateParameter('compositionTechnique', value as CompositionTechnique)}
              />
            </div>
          </TabsContent>

          <TabsContent value="lighting" className="space-y-4">
            <ParameterSelect
              label="Lighting Style"
              value={parameters.lightingStyle}
              options={lightingOptions}
              onValueChange={(value) => updateParameter('lightingStyle', value as LightingStyle)}
              icon={Lightbulb}
            />
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Time Setting"
                value={parameters.timeSetting}
                options={getParameterOptions('time_settings')}
                onValueChange={(value) => updateParameter('timeSetting', value as TimeSetting)}
                icon={Clock}
              />
              <ParameterSelect
                label="Weather"
                value={parameters.weatherCondition}
                options={getParameterOptions('weather_conditions')}
                onValueChange={(value) => updateParameter('weatherCondition', value as WeatherCondition)}
              />
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <ParameterSelect
              label="Scene Mood"
              value={parameters.sceneMood}
              options={moodOptions}
              onValueChange={(value) => updateParameter('sceneMood', value as SceneMood)}
              icon={Film}
            />
            
            <ParameterSelect
              label="Color Palette"
              value={parameters.colorPalette}
              options={colorOptions}
              onValueChange={(value) => updateParameter('colorPalette', value as ColorPalette)}
              icon={Palette}
            />
            
            <ParameterSelect
              label="Director Style"
              value={parameters.directorStyle}
              options={directorOptions}
              onValueChange={(value) => updateParameter('directorStyle', value as DirectorStyle)}
              icon={Settings}
            />
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Era Emulation"
                value={parameters.eraEmulation}
                options={getParameterOptions('era_emulations')}
                onValueChange={(value) => updateParameter('eraEmulation', value as EraEmulation)}
              />
              <ParameterSelect
                label="Aspect Ratio"
                value={parameters.aspectRatio}
                options={getParameterOptions('aspect_ratios')}
                onValueChange={(value) => updateParameter('aspectRatio', value as any)}
              />
            </div>
          </TabsContent>

          <TabsContent value="environment" className="space-y-4">
            <ParameterSelect
              label="Location Type"
              value={parameters.locationType}
              options={getParameterOptions('location_types')}
              onValueChange={(value) => updateParameter('locationType', value as LocationType)}
              icon={MapPin}
            />
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Foreground Elements"
                value={parameters.foregroundElements as any}
                options={getParameterOptions('foreground_elements')}
                onValueChange={(value) => updateParameter('foregroundElements', value as any)}
              />
              <ParameterSelect
                label="Subject Count"
                value={parameters.subjectCount}
                options={getParameterOptions('subject_counts')}
                onValueChange={(value) => updateParameter('subjectCount', value as any)}
              />
            </div>
            
            <Separator />
            <ParameterSelect
              label="Eye Contact"
              value={parameters.eyeContact}
              options={getParameterOptions('eye_contacts')}
              onValueChange={(value) => updateParameter('eyeContact', value as any)}
            />
            
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Advanced cinematic parameters for fine-tuning your image generation.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Camera Movement"
                value={parameters.cameraMovement}
                options={getParameterOptions('camera_movements')}
                onValueChange={(value) => updateParameter('cameraMovement', value as CameraMovement)}
              />
              <ParameterSelect
                label="Composition Technique"
                value={parameters.compositionTechnique}
                options={getParameterOptions('composition_techniques')}
                onValueChange={(value) => updateParameter('compositionTechnique', value as CompositionTechnique)}
              />
            </div>
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Depth of Field"
                value={parameters.depthOfField}
                options={getParameterOptions('depth_of_field')}
                onValueChange={(value) => updateParameter('depthOfField', value as DepthOfField)}
              />
              <ParameterSelect
                label="Shot Size"
                value={parameters.shotSize}
                options={getParameterOptions('shot_sizes')}
                onValueChange={(value) => updateParameter('shotSize', value as ShotSize)}
              />
            </div>
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Time Setting"
                value={parameters.timeSetting}
                options={getParameterOptions('time_settings')}
                onValueChange={(value) => updateParameter('timeSetting', value as TimeSetting)}
              />
              <ParameterSelect
                label="Weather Condition"
                value={parameters.weatherCondition}
                options={getParameterOptions('weather_conditions')}
                onValueChange={(value) => updateParameter('weatherCondition', value as WeatherCondition)}
              />
            </div>
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Location Type"
                value={parameters.locationType}
                options={getParameterOptions('location_types')}
                onValueChange={(value) => updateParameter('locationType', value as LocationType)}
              />
              <ParameterSelect
                label="Foreground Elements"
                value={parameters.foregroundElements as any}
                options={getParameterOptions('foreground_elements')}
                onValueChange={(value) => updateParameter('foregroundElements', value as any)}
              />
            </div>
            
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <ParameterSelect
                label="Subject Count"
                value={parameters.subjectCount}
                options={getParameterOptions('subject_counts')}
                onValueChange={(value) => updateParameter('subjectCount', value as any)}
              />
              <ParameterSelect
                label="Eye Contact"
                value={parameters.eyeContact}
                options={getParameterOptions('eye_contacts')}
                onValueChange={(value) => updateParameter('eyeContact', value as any)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Active Parameters Summary */}
        <Separator className="my-4" />
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Parameters</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(parameters).map(([key, value]) => {
              if (!value) return null;
              
              // Format parameter names for better display
              const formatParameterName = (paramKey: string) => {
                const nameMap: Record<string, string> = {
                  cameraAngle: 'Camera Angle',
                  lensType: 'Lens Type',
                  shotSize: 'Shot Size',
                  depthOfField: 'Depth of Field',
                  lightingStyle: 'Lighting Style',
                  colorPalette: 'Color Palette',
                  directorStyle: 'Director Style',
                  sceneMood: 'Scene Mood',
                  timeSetting: 'Time Setting',
                  aspectRatio: 'Aspect Ratio',
                  eraEmulation: 'Era Emulation',
                  compositionTechnique: 'Composition'
                };
                return nameMap[paramKey] || paramKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              };

              // Format parameter values for better display
              const formatParameterValue = (paramValue: string) => {
                return paramValue
                  .split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
              };
              
              return (
                <Badge key={key} variant="secondary" className="text-xs">
                  {formatParameterName(key)}: {formatParameterValue(String(value))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearParameter(key as keyof CinematicParameters)}
                    className="h-4 w-4 p-0 ml-1"
                  >
                    ×
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
