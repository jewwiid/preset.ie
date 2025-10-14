'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface VisualAidsManagerProps {
  presets: any[];
  presetVisualAids: any[];
  onAddVisualAid: (preset: any) => void;
}

export default function VisualAidsManager({
  presets,
  presetVisualAids,
  onAddVisualAid}: VisualAidsManagerProps) {
  const [showVisualAids, setShowVisualAids] = useState(false);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Style Visual Aids</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload reference images, thumbnails, and examples for each style/preset
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowVisualAids(!showVisualAids)}
        >
          {showVisualAids ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Expand ({presets.length} presets)
            </>
          )}
        </Button>
      </CardHeader>

      {showVisualAids && (
        <CardContent className="space-y-6">
          {presets.slice(0, 10).map((preset) => {
            const visualAids = presetVisualAids.filter(
              (aid) => aid.preset_key === preset.name || aid.preset_key === preset.id
            );
            const primaryAid = visualAids.find((aid) => aid.is_primary);

            return (
              <div
                key={preset.id}
                className="border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Primary Preview */}
                  <div className="w-32 h-32 relative bg-muted rounded-lg border flex-shrink-0 overflow-hidden">
                    {primaryAid?.platform_image?.image_url ? (
                      <Image
                        src={primaryAid.platform_image.image_url}
                        alt={primaryAid.platform_image.alt_text || preset.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Preset Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{preset.name}</h3>
                        {preset.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {preset.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {preset.category && (
                            <Badge variant="outline">{preset.category}</Badge>
                          )}
                          {visualAids.length > 0 && (
                            <Badge variant="secondary">
                              {visualAids.length} {visualAids.length === 1 ? 'image' : 'images'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => onAddVisualAid(preset)}
                        size="sm"
                        variant={visualAids.length === 0 ? 'default' : 'outline'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {visualAids.length === 0 ? 'Add Visual Aid' : 'Add Another'}
                      </Button>
                    </div>

                    {/* Existing Visual Aids */}
                    {visualAids.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Current Visual Aids:</p>
                        <div className="flex gap-2 flex-wrap">
                          {visualAids.map((aid) => (
                            <div
                              key={aid.id}
                              className="relative w-20 h-20 border rounded-md overflow-hidden group"
                            >
                              {aid.platform_image?.image_url && (
                                <Image
                                  src={aid.platform_image.image_url}
                                  alt={aid.platform_image.alt_text || 'Visual aid'}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              )}
                              {aid.is_primary && (
                                <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>
                              )}
                              <div className="absolute bottom-1 right-1">
                                <Badge variant="secondary" className="text-xs">
                                  {aid.visual_aid_type || 'reference'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {presets.length > 10 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing first 10 presets. {presets.length - 10} more available.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
