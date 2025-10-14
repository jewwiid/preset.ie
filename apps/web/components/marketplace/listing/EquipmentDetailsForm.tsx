'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { Info, X } from 'lucide-react';
import { getIconEmoji } from '@/utils/iconMapper';
import { formatBrandName } from '@/utils/formatters';

interface EquipmentType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sort_order: number;
}

interface PredefinedModel {
  id: string;
  equipment_type_id: string;
  brand: string;
  model: string;
  description: string;
  sort_order: number;
  equipment_types?: {
    name: string;
    display_name: string;
  };
}

interface EquipmentDetailsFormProps {
  title: string;
  description: string;
  selectedCategory: string;
  selectedBrand: string;
  selectedModel: string;
  customBrandInput: string;
  customModelInput: string;
  condition: string;
  quantity: string;
  equipmentTypes: EquipmentType[];
  availableModels: PredefinedModel[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onCustomBrandChange: (value: string) => void;
  onCustomModelChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
}

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export function EquipmentDetailsForm({
  title,
  description,
  selectedCategory,
  selectedBrand,
  selectedModel,
  customBrandInput,
  customModelInput,
  condition,
  quantity,
  equipmentTypes,
  availableModels,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onBrandChange,
  onModelChange,
  onCustomBrandChange,
  onCustomModelChange,
  onConditionChange,
  onQuantityChange}: EquipmentDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Canon EOS R5 Camera"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your equipment..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="category">Equipment Type *</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select equipment type">
                {selectedCategory && (
                  <div className="flex items-center gap-2">
                    <span>{getIconEmoji(selectedCategory)}</span>
                    <span>
                      {equipmentTypes.find((t) => t.name === selectedCategory)?.display_name}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {equipmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  <div className="flex items-center gap-2">
                    <span>{getIconEmoji(type.name)}</span>
                    <span>{type.display_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <div className="flex gap-2">
                  <Select value={selectedBrand} onValueChange={onBrandChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(availableModels.map((model) => model.brand))].map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {formatBrandName(brand)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBrand && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onBrandChange('')}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <div className="flex gap-2">
                  <Select value={selectedModel} onValueChange={onModelChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels
                        .filter((model) => !selectedBrand || model.brand === selectedBrand)
                        .map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.model}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedModel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onModelChange('')}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Don't see your equipment? Add it below and it will be available for others.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customBrand" className="text-sm font-medium">
                    Custom Brand
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="customBrand"
                      value={customBrandInput}
                      onChange={(e) => onCustomBrandChange(e.target.value)}
                      placeholder="Enter brand name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customBrandInput.trim()) {
                          const formattedBrand = formatBrandName(customBrandInput.trim());
                          onBrandChange(formattedBrand);
                          onCustomBrandChange('');
                        }
                      }}
                      disabled={!customBrandInput.trim()}
                    >
                      Add Brand
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="customModel" className="text-sm font-medium">
                    Custom Model
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="customModel"
                      value={customModelInput}
                      onChange={(e) => onCustomModelChange(e.target.value)}
                      placeholder="Enter model name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customModelInput.trim()) {
                          onModelChange(customModelInput.trim());
                          onCustomModelChange('');
                        }
                      }}
                      disabled={!customModelInput.trim()}
                    >
                      Add Model
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select value={condition} onValueChange={onConditionChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <NumberInput
            value={Number(quantity)}
            onChange={onQuantityChange}
            min={1}
            max={100}
            step={1}
          />
        </div>
      </CardContent>
    </Card>
  );
}
