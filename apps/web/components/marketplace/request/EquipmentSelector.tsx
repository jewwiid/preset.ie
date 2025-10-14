'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Camera } from 'lucide-react';
import type { EquipmentType, EquipmentBrand, PredefinedModel } from '@/types/marketplace';
import { getIconEmoji } from '@/utils/iconMapper';

interface EquipmentSelectorProps {
  equipmentTypes: EquipmentType[];
  brands: EquipmentBrand[];
  models: PredefinedModel[];
  selectedCategory: string;
  selectedBrand: string;
  selectedModel: string;
  equipmentType: string;
  onCategoryChange: (category: string) => void;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onEquipmentTypeChange: (equipmentType: string) => void;
  error?: string;
}

export function EquipmentSelector({
  equipmentTypes,
  brands,
  models,
  selectedCategory,
  selectedBrand,
  selectedModel,
  equipmentType,
  onCategoryChange,
  onBrandChange,
  onModelChange,
  onEquipmentTypeChange,
  error}: EquipmentSelectorProps) {
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [filteredEquipment, setFilteredEquipment] = useState<PredefinedModel[]>([]);
  const [availableModels, setAvailableModels] = useState<PredefinedModel[]>([]);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [showCustomBrand, setShowCustomBrand] = useState(false);

  // Filter models based on selected category and brand
  useEffect(() => {
    if (models.length > 0 && selectedCategory) {
      let filtered = models.filter(model =>
        model.equipment_types?.name === selectedCategory
      );

      // If brand is selected, filter by brand
      if (selectedBrand && selectedBrand !== 'custom') {
        filtered = filtered.filter(model =>
          model.brand.toLowerCase() === selectedBrand.toLowerCase()
        );
      }

      setAvailableModels(filtered);
    } else {
      setAvailableModels([]);
    }
  }, [selectedCategory, selectedBrand, models]);

  // Filter equipment based on search term
  useEffect(() => {
    if (models.length > 0) {
      let filtered = models;

      // Filter by category if selected
      if (selectedCategory) {
        const selectedType = equipmentTypes.find(type => type.name === selectedCategory);
        if (selectedType) {
          filtered = filtered.filter(model =>
            model.equipment_type_id === selectedType.id
          );
        }
      }

      // Filter by search term
      if (equipmentSearch) {
        filtered = filtered.filter(model => {
          const fullName = `${model.brand} ${model.model}`.toLowerCase();
          const searchTerm = equipmentSearch.toLowerCase();

          return fullName.includes(searchTerm) ||
                 model.brand.toLowerCase().includes(searchTerm) ||
                 model.model.toLowerCase().includes(searchTerm) ||
                 model.equipment_types?.name.toLowerCase().includes(searchTerm) ||
                 model.equipment_types?.display_name.toLowerCase().includes(searchTerm);
        });
      }

      setFilteredEquipment(filtered);
    } else {
      setFilteredEquipment([]);
    }
  }, [selectedCategory, equipmentSearch, models, equipmentTypes]);

  const handleCategoryChange = (category: string) => {
    onCategoryChange(category);
    onBrandChange('');
    onModelChange('');
    onEquipmentTypeChange('');
    setEquipmentSearch('');
    setCustomBrandInput('');
    setCustomModelInput('');
    setShowCustomBrand(false);
  };

  const handleBrandSelect = (brand: string) => {
    if (brand === 'custom') {
      setShowCustomBrand(true);
      onBrandChange('');
    } else {
      setShowCustomBrand(false);
      onBrandChange(brand);
      onModelChange('');
      onEquipmentTypeChange('');
    }
  };

  const handleModelSelect = (model: string) => {
    onModelChange(model);
    const fullEquipmentName = `${selectedBrand} ${model}`;
    onEquipmentTypeChange(fullEquipmentName);
  };

  const handleEquipmentSelect = (model: PredefinedModel) => {
    const fullEquipmentName = `${model.brand} ${model.model}`;
    onEquipmentTypeChange(fullEquipmentName);
    onBrandChange(model.brand);
    onModelChange(model.model);
    setEquipmentSearch(fullEquipmentName);
  };

  const handleCustomEquipmentSubmit = () => {
    if (customBrandInput && customModelInput) {
      const fullEquipmentName = `${customBrandInput} ${customModelInput}`;
      onBrandChange(customBrandInput);
      onModelChange(customModelInput);
      onEquipmentTypeChange(fullEquipmentName);
      setShowCustomBrand(false);
    }
  };

  const clearSelection = () => {
    onCategoryChange('');
    onBrandChange('');
    onModelChange('');
    onEquipmentTypeChange('');
    setEquipmentSearch('');
    setCustomBrandInput('');
    setCustomModelInput('');
    setShowCustomBrand(false);
  };

  // Get available brands for the selected category
  const getAvailableBrands = () => {
    if (selectedCategory && availableModels.length > 0) {
      return Array.from(new Set(availableModels.map(model => model.brand))).sort();
    }
    return brands.map(b => b.name);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Equipment Details
        </CardTitle>
        <CardDescription>
          Select or search for the equipment you need
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div>
          <Label htmlFor="category">
            Equipment Category <span className="text-destructive">*</span>
          </Label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select equipment category" />
            </SelectTrigger>
            <SelectContent>
              {equipmentTypes.map(type => (
                <SelectItem key={type.id} value={type.name}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getIconEmoji(type.icon)}</span>
                    <span>{type.display_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>

        {/* Equipment Search */}
        {selectedCategory && (
          <div>
            <Label htmlFor="equipment-search">Quick Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="equipment-search"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder="Search equipment..."
                className="pl-10"
              />
            </div>

            {equipmentSearch && filteredEquipment.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredEquipment.slice(0, 10).map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleEquipmentSelect(model)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                  >
                    <div className="font-medium">{model.brand} {model.model}</div>
                    {model.description && (
                      <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brand Selection */}
        {selectedCategory && (
          <div>
            <Label htmlFor="brand">
              Brand <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={selectedBrand} onValueChange={handleBrandSelect}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableBrands().map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand.charAt(0).toUpperCase() + brand.slice(1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Add Custom Brand</SelectItem>
                </SelectContent>
              </Select>
              {selectedBrand && !showCustomBrand && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onBrandChange('');
                    onModelChange('');
                    onEquipmentTypeChange('');
                  }}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Custom Brand Input */}
        {showCustomBrand && (
          <div className="space-y-3 p-3 border rounded-md bg-muted/50">
            <div>
              <Label htmlFor="custom-brand">Custom Brand</Label>
              <Input
                id="custom-brand"
                value={customBrandInput}
                onChange={(e) => setCustomBrandInput(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <Label htmlFor="custom-model">Custom Model</Label>
              <Input
                id="custom-model"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="Enter model name"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleCustomEquipmentSubmit}
                disabled={!customBrandInput || !customModelInput}
              >
                Add Custom Equipment
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCustomBrand(false);
                  setCustomBrandInput('');
                  setCustomModelInput('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Model Selection */}
        {selectedBrand && !showCustomBrand && availableModels.length > 0 && (
          <div>
            <Label htmlFor="model">
              Model <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedModel} onValueChange={handleModelSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels
                  .filter(m => m.brand.toLowerCase() === selectedBrand.toLowerCase())
                  .map(model => (
                    <SelectItem key={model.id} value={model.model}>
                      {model.model}
                      {model.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {model.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Selected Equipment Display */}
        {equipmentType && (
          <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Selected Equipment:</p>
                <p className="text-lg font-bold text-primary">{equipmentType}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
