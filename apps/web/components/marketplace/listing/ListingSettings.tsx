'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

interface ListingSettingsProps {
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
}

export function ListingSettings({
  verifiedOnly,
  onVerifiedOnlyChange}: ListingSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="verified_only"
            checked={verifiedOnly}
            onCheckedChange={onVerifiedOnlyChange}
          />
          <Label htmlFor="verified_only">Only verified users can book</Label>
        </div>
      </CardContent>
    </Card>
  );
}
