'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { CONDITIONS, CONDITION_LABELS } from '@/types/marketplace';
import type { ConditionType } from '@/types/marketplace';

interface RequestDetailsFormProps {
  title: string;
  description: string;
  conditionPreference: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (desc: string) => void;
  onConditionChange: (condition: string) => void;
  errors?: {
    title?: string;
    description?: string;
  };
}

export function RequestDetailsForm({
  title,
  description,
  conditionPreference,
  onTitleChange,
  onDescriptionChange,
  onConditionChange,
  errors = {} }: RequestDetailsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Request Details
        </CardTitle>
        <CardDescription>
          Provide a clear title and description of what you need
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <Label htmlFor="title">
            Request Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Sony A7III needed for wedding shoot"
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Write a clear, concise title that describes what you need
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe your project, how you'll use the equipment, and any specific requirements..."
            rows={6}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Include details about your project, usage conditions, and any special requirements. This helps equipment owners understand your needs.
          </p>
        </div>

        {/* Condition Preference */}
        <div>
          <Label htmlFor="condition">Condition Preference</Label>
          <Select value={conditionPreference} onValueChange={onConditionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition preference" />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map(condition => (
                <SelectItem key={condition} value={condition}>
                  {CONDITION_LABELS[condition]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Specify the minimum condition you'll accept for the equipment
          </p>
        </div>

        {/* Helper Tips */}
        <div className="p-3 bg-muted/50 rounded-md border">
          <p className="text-sm font-medium mb-2">💡 Tips for a great request:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Be specific about dates, location, and usage</li>
            <li>• Mention if you have insurance or safety measures</li>
            <li>• Include your experience level with the equipment</li>
            <li>• Explain the project context (e.g., "wedding", "commercial shoot")</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
