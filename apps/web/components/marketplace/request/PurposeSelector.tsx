'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Link as LinkIcon } from 'lucide-react';
import type { Purpose } from '@/types/marketplace';
import { getIconEmoji } from '@/utils/iconMapper';

interface PurposeSelectorProps {
  purposes: Purpose[];
  selectedPurposeId: string;
  selectedPurposeCategory: string;
  referenceType: string;
  referenceTitle: string;
  referenceUrl: string;
  referenceDescription: string;
  referenceThumbnailUrl: string;
  onPurposeChange: (purposeId: string, category: string) => void;
  onReferenceChange: (field: string, value: string) => void;
}

export function PurposeSelector({
  purposes,
  selectedPurposeId,
  selectedPurposeCategory,
  referenceType,
  referenceTitle,
  referenceUrl,
  referenceDescription,
  referenceThumbnailUrl,
  onPurposeChange,
  onReferenceChange}: PurposeSelectorProps) {
  // Get unique purpose categories
  const categories = Array.from(new Set(purposes.map(p => p.category)));

  // Get selected purpose details
  const selectedPurpose = purposes.find(p => p.id === selectedPurposeId);

  const handleCategoryChange = (category: string) => {
    onPurposeChange('', category);
  };

  const handlePurposeChange = (purposeId: string) => {
    const purpose = purposes.find(p => p.id === purposeId);
    if (purpose) {
      onPurposeChange(purposeId, purpose.category);
    }
  };

  const getReferenceEmoji = (type: string) => {
    switch (type) {
      case 'moodboard': return '🎨';
      case 'treatment': return '📋';
      case 'showcase': return '🎭';
      case 'external_link': return '🔗';
      default: return '📄';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Project Purpose & References
        </CardTitle>
        <CardDescription>
          Help equipment owners understand your project context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Purpose Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="purpose_category">Purpose Category</Label>
            <Select value={selectedPurposeCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              What type of project are you working on?
            </p>
          </div>

          {selectedPurposeCategory && (
            <div>
              <Label htmlFor="purpose">Specific Purpose</Label>
              <Select value={selectedPurposeId} onValueChange={handlePurposeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specific purpose" />
                </SelectTrigger>
                <SelectContent>
                  {purposes
                    .filter(p => p.category === selectedPurposeCategory)
                    .map(purpose => (
                      <SelectItem key={purpose.id} value={purpose.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getIconEmoji(purpose.icon)}</span>
                          <span>{purpose.display_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedPurpose && (
            <div className="p-3 bg-muted rounded-md border">
              <p className="text-sm text-muted-foreground">{selectedPurpose.description}</p>
            </div>
          )}
        </div>

        {/* Reference Material Section */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Reference Material (Optional)</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Link to moodboards, treatments, showcases, or other reference materials to help equipment owners understand your project vision
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference_type">Reference Type</Label>
              <Select value={referenceType} onValueChange={(value) => onReferenceChange('reference_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reference type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moodboard">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎨</span>
                      <span>Moodboard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="treatment">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      <span>Treatment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="showcase">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎭</span>
                      <span>Showcase</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="external_link">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔗</span>
                      <span>External Link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      <span>Other</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference_title">Reference Title</Label>
              <Input
                id="reference_title"
                value={referenceTitle}
                onChange={(e) => onReferenceChange('reference_title', e.target.value)}
                placeholder="Enter reference title"
                disabled={!referenceType}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reference_url">Reference URL</Label>
            <Input
              id="reference_url"
              type="url"
              value={referenceUrl}
              onChange={(e) => onReferenceChange('reference_url', e.target.value)}
              placeholder="https://example.com/reference"
              disabled={!referenceType}
            />
            {referenceType && ['moodboard', 'treatment', 'showcase'].includes(referenceType) && (
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ You can only reference {referenceType}s that you own
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reference_description">Reference Description</Label>
            <Textarea
              id="reference_description"
              value={referenceDescription}
              onChange={(e) => onReferenceChange('reference_description', e.target.value)}
              placeholder="Describe what this reference shows or how it relates to your project"
              disabled={!referenceType}
              rows={3}
            />
          </div>

          {referenceUrl && referenceType && (
            <div className="p-3 bg-background rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getReferenceEmoji(referenceType)}</span>
                <span className="font-medium">{referenceTitle || 'Reference Material'}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {referenceType}
                </Badge>
              </div>
              {referenceDescription && (
                <p className="text-sm text-muted-foreground mb-2">{referenceDescription}</p>
              )}
              <a
                href={referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View Reference
                <LinkIcon className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Helper Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> Sharing your project context and references helps equipment owners understand your vision and builds trust. They're more likely to approve requests when they know how their equipment will be used.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
