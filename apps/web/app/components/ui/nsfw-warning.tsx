import React, { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentModeration } from '@/hooks/useContentModeration';

interface NSFWWarningProps {
  content: {
    is_nsfw?: boolean;
    moderation_status?: string;
    type_label?: string;
    description?: string;
  };
  onAccept?: () => void;
  onReject?: () => void;
  showSettings?: boolean;
  children?: React.ReactNode;
}

export function NSFWWarning({ 
  content, 
  onAccept, 
  onReject, 
  showSettings = false,
  children 
}: NSFWWarningProps) {
  const { preferences, updatePreferences, shouldHideContent, shouldShowWarning } = useContentModeration();
  const [showContent, setShowContent] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Don't show warning if content should be hidden
  if (shouldHideContent(content)) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Content Hidden</h3>
              <p className="text-sm text-muted-foreground">
                This content has been hidden based on your content preferences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show warning if content is safe or user has already accepted
  if (!shouldShowWarning(content) && !showContent) {
    return <>{children}</>;
  }

  const handleAccept = () => {
    setShowContent(true);
    onAccept?.();
  };

  const handleReject = () => {
    onReject?.();
  };

  const handleToggleNSFW = async (allow: boolean) => {
    await updatePreferences({ allow_nsfw_content: allow });
  };

  const handleToggleWarnings = async (show: boolean) => {
    await updatePreferences({ show_nsfw_warnings: show });
  };

  const handleFilterLevelChange = async (level: string) => {
    await updatePreferences({ content_filter_level: level as 'strict' | 'moderate' | 'lenient' });
  };

  if (showContent) {
    return <>{children}</>;
  }

  return (
    <Card className="border-destructive/20 bg-destructive/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <CardTitle className="text-destructive">
              Content Warning
            </CardTitle>
            <CardDescription className="text-destructive/80">
              This content may contain material that some users find inappropriate.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {content.type_label && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-destructive/30">
              {content.type_label}
            </Badge>
            {content.is_nsfw && (
              <Badge variant="destructive">NSFW</Badge>
            )}
            {content.moderation_status === 'flagged' && (
              <Badge variant="secondary">Flagged</Badge>
            )}
          </div>
        )}

        {content.description && (
          <p className="text-sm text-muted-foreground">
            {content.description}
          </p>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleAccept}
            variant="destructive"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show Content
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleReject}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Hide Content
          </Button>

          {showSettings && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showSettingsPanel && preferences && (
          <Card className="mt-4 border-orange-200 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg">Content Preferences</CardTitle>
              <CardDescription>
                Adjust your content filtering settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-nsfw">Allow NSFW Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Show content marked as NSFW
                  </p>
                </div>
                <Switch
                  id="allow-nsfw"
                  checked={preferences.allow_nsfw_content}
                  onCheckedChange={handleToggleNSFW}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-warnings">Show NSFW Warnings</Label>
                  <p className="text-sm text-muted-foreground">
                    Display warnings before showing NSFW content
                  </p>
                </div>
                <Switch
                  id="show-warnings"
                  checked={preferences.show_nsfw_warnings}
                  onCheckedChange={handleToggleWarnings}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-level">Content Filter Level</Label>
                <Select
                  value={preferences.content_filter_level}
                  onValueChange={handleFilterLevelChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict - Hide all potentially inappropriate content</SelectItem>
                    <SelectItem value="moderate">Moderate - Show warnings for NSFW content</SelectItem>
                    <SelectItem value="lenient">Lenient - Minimal filtering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

interface NSFWBadgeProps {
  isNsfw: boolean;
  moderationStatus?: string;
  className?: string;
}

export function NSFWBadge({ isNsfw, moderationStatus, className }: NSFWBadgeProps) {
  if (!isNsfw && moderationStatus !== 'flagged') return null;

  return (
    <div className={`flex gap-1 ${className}`}>
      {isNsfw && (
        <Badge variant="destructive" className="text-xs">
          NSFW
        </Badge>
      )}
      {moderationStatus === 'flagged' && (
        <Badge variant="secondary" className="text-xs">
          Flagged
        </Badge>
      )}
      {moderationStatus === 'pending' && (
        <Badge variant="outline" className="text-xs">
          Pending
        </Badge>
      )}
    </div>
  );
}
