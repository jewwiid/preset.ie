'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { IconBadge } from '@/components/ui/icon-badge';
import { useUnifiedMediaMetadata } from '@/hooks/useUnifiedMediaMetadata';
import {
  Image as ImageIcon,
  Film,
  Sparkles,
  Link2,
  X,
  Copy,
  Download,
  ExternalLink,
  Calendar,
  CreditCard,
  Camera,
  Lightbulb,
  Palette,
  Save
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface UnifiedMediaMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string | null;
  mediaSource?: 'gallery' | 'project' | 'showcase';
}

export default function UnifiedMediaMetadataModal({
  isOpen,
  onClose,
  mediaId,
  mediaSource = 'gallery'
}: UnifiedMediaMetadataModalProps) {
  const { metadata, loading, error } = useUnifiedMediaMetadata(mediaId, mediaSource);
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getIconForParameter = (param: string) => {
    switch (param) {
      case 'cameraAngle':
      case 'lensType':
      case 'shotSize':
      case 'cameraMovement':
        return <Camera className="h-4 w-4" />;
      case 'lightingStyle':
        return <Lightbulb className="h-4 w-4" />;
      case 'colorPalette':
        return <Palette className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getColorForParameter = (param: string) => {
    switch (param) {
      case 'cameraAngle':
      case 'lensType':
      case 'shotSize':
      case 'cameraMovement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lightingStyle':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'colorPalette':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Loading Media Metadata</DialogTitle>
            <DialogDescription>Please wait while we fetch the media information</DialogDescription>
          </DialogHeader>
          <LoadingSpinner size="lg" text="Loading metadata..." className="py-12" />
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !metadata) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Error Loading Metadata</DialogTitle>
            <DialogDescription>Unable to retrieve media information</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12 text-red-500">
            <X className="h-8 w-8" />
            <span className="ml-2">Failed to load metadata: {error}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden" aria-describedby="media-metadata-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {metadata.type === 'video' ? (
                <Film className="h-5 w-5" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
              Media Metadata
              {metadata.generation_metadata?.generation_mode === 'stitch' && (
                <Badge variant="secondary" className="ml-2">
                  Stitch Generation
                </Badge>
              )}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription id="media-metadata-description" className="sr-only">
            View and manage metadata for this {metadata.type === 'video' ? 'video' : 'image'} including prompts, generation settings, and technical details
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Left Column - Media Preview */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
              {metadata.type === 'video' ? (
                <video
                  src={metadata.url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={metadata.url}
                  alt={metadata.title || 'Media preview'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(metadata.url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => copyToClipboard(metadata.url, 'Media URL')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </div>

          {/* Right Column - Metadata Tabs */}
          <div className="space-y-4 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="cinematic">Cinematic</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
              </TabsList>

              <div className="overflow-y-auto max-h-[60vh]">
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {metadata.title && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Title:</span>
                          <p className="text-sm">{metadata.title}</p>
                        </div>
                      )}
                      {metadata.description && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Description:</span>
                          <p className="text-sm">{metadata.description}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Dimensions:</span>
                        <p className="text-sm">{metadata.width} × {metadata.height}</p>
                      </div>
                      {metadata.tags && metadata.tags.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {metadata.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {metadata.generation_metadata && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Generation Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {metadata.generation_metadata.provider && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Provider:</span>
                            <p className="text-sm">{metadata.generation_metadata.provider}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Mode:</span>
                          <p className="text-sm">
                            {metadata.type === 'video'
                              ? 'Video Generation'
                              : metadata.generation_metadata.generation_mode || 'Image Generation'}
                          </p>
                        </div>
                        {metadata.generation_metadata.credits_used && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Credits Used:</span>
                            <p className="text-sm">{metadata.generation_metadata.credits_used}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                  {metadata.generation_metadata?.prompt && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Prompt</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(metadata.generation_metadata.prompt, 'Prompt')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {metadata.generation_metadata.prompt}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {metadata.generation_metadata?.enhanced_prompt && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Enhanced Prompt</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(metadata.generation_metadata.enhanced_prompt, 'Enhanced Prompt')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {metadata.generation_metadata.enhanced_prompt}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {metadata.generation_metadata?.style_prompt && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Style Prompt</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(metadata.generation_metadata.style_prompt, 'Style Prompt')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {metadata.generation_metadata.style_prompt}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {!metadata.generation_metadata?.prompt && !metadata.generation_metadata?.enhanced_prompt && !metadata.generation_metadata?.style_prompt && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Copy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No prompt information available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cinematic" className="space-y-4">
                  {metadata.generation_metadata?.cinematic_parameters ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(metadata.generation_metadata.cinematic_parameters).map(([key, value]) => (
                        <Card key={key}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded ${getColorForParameter(key)}`}>
                                {getIconForParameter(key)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(value as string, `${key} parameter`)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <span className="text-sm font-medium">
                                  {value as string}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No cinematic parameters available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="technical" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metadata.generation_metadata?.resolution && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Resolution</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metadata.generation_metadata.resolution}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {metadata.generation_metadata?.aspect_ratio && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Aspect Ratio</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metadata.generation_metadata.aspect_ratio}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {metadata.generation_metadata?.provider && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">AI Provider</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metadata.generation_metadata.provider}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {metadata.generation_metadata?.credits_used && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Credits Used</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metadata.generation_metadata.credits_used}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="sources" className="space-y-4">
                  {metadata.source_images && metadata.source_images.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Source Images ({metadata.source_images.length})</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {metadata.source_images.map((source, index) => (
                          <Card key={source.id}>
                            <CardContent className="p-3">
                              <div className="aspect-square rounded overflow-hidden bg-muted mb-2">
                                <img
                                  src={source.thumbnail_url || source.url}
                                  alt={`Source ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">
                                    {source.type || 'Unknown'}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(source.url, '_blank')}
                                    className="h-6 w-6 p-0"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                                {source.custom_label && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {source.custom_label}
                                  </p>
                                )}
                                {source.width && source.height && (
                                  <p className="text-xs text-muted-foreground">
                                    {source.width} × {source.height}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No source images available</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
