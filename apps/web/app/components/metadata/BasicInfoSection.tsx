'use client';

import { Edit, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface BasicInfoSectionProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function BasicInfoSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  isEditing,
  isSaving,
  canEdit,
  onEdit,
  onSave,
  onCancel,
}: BasicInfoSectionProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">Image Details</span>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 px-2 text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        // Edit mode
        <div className="space-y-3">
          <div>
            <Label htmlFor="image-title" className="text-xs font-medium mb-1.5">
              Title
            </Label>
            <Input
              id="image-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter image title..."
              maxLength={200}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="image-description" className="text-xs font-medium mb-1.5">
              Description
            </Label>
            <Textarea
              id="image-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Enter image description..."
              rows={3}
              maxLength={1000}
              className="text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={onSave} disabled={isSaving} size="sm" className="h-8 px-3">
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1.5" />
                  Save
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} size="sm" className="h-8 px-3">
              <X className="h-3 w-3 mr-1.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // View mode
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-muted-foreground min-w-[70px]">Title:</span>
            <span className="text-sm font-semibold text-foreground flex-1">
              {title || 'Untitled'}
            </span>
          </div>
          {description && (
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground min-w-[70px]">
                Description:
              </span>
              <span className="text-sm text-foreground flex-1">{description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
