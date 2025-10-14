'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertCircle } from 'lucide-react';

interface UrgencyToggleProps {
  urgent: boolean;
  onUrgentChange: (urgent: boolean) => void;
}

export function UrgencyToggle({ urgent, onUrgentChange }: UrgencyToggleProps) {
  return (
    <Card className={urgent ? 'border-orange-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Request Priority
        </CardTitle>
        <CardDescription>
          Mark this request as urgent to get faster responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgent Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md border">
          <div className="flex items-start gap-3 flex-1">
            <Zap className={`h-5 w-5 mt-0.5 ${urgent ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <div>
              <Label htmlFor="urgent" className="text-base font-medium cursor-pointer">
                Mark as Urgent
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Highlight this request to equipment owners and increase visibility
              </p>
              {urgent && (
                <div className="mt-2 space-y-1">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900">
                    <Zap className="h-3 w-3 mr-1" />
                    Urgent Priority
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your request will be featured in urgent listings and highlighted to equipment owners
                  </p>
                </div>
              )}
            </div>
          </div>
          <Switch
            id="urgent"
            checked={urgent}
            onCheckedChange={onUrgentChange}
          />
        </div>

        {/* Benefits */}
        {urgent && (
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md border border-orange-200 dark:border-orange-900">
              <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Urgent Request Benefits
              </h4>
              <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1">
                <li>• Featured at the top of equipment request listings</li>
                <li>• Highlighted badge visible to all equipment owners</li>
                <li>• Priority notifications sent to relevant owners</li>
                <li>• Increased visibility in search results</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Tip:</strong> Use urgent marking for time-sensitive projects or last-minute needs. Equipment owners are often willing to help with urgent requests, but be prepared for potential premium rates.
              </p>
            </div>
          </div>
        )}

        {/* Non-urgent note */}
        {!urgent && (
          <div className="p-3 bg-muted rounded-md border">
            <p className="text-sm text-muted-foreground">
              Standard requests are still visible to all equipment owners. Marking as urgent is optional and recommended only for time-sensitive projects.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
