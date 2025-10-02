'use client'

import { Video as VideoIcon, Download, Heart, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DraggableImagePreview from './DraggableImagePreview'

interface VideoPreviewAreaProps {
  // Source image props
  sourceImage: string | null
  aspectRatio: string
  resolution: string
  onPositionChange?: (yPosition: number) => void

  // Prompt for text-to-video mode
  prompt?: string

  // Generated videos props
  videos: Array<{
    id: string
    url: string
    title: string
    duration?: number
    resolution?: string
    aspectRatio?: string
    generated_at: string
    is_saved: boolean
    source: string
  }>
  selectedVideo: string | null
  onSelectVideo: (url: string | null) => void
  onSaveToGallery: (url: string) => Promise<void>
  onDeleteVideo: (url: string) => Promise<void>
  savingVideo: string | null
  deletingVideo: string | null
  loading?: boolean
  fullWidth?: boolean
}

export default function VideoPreviewArea({
  sourceImage,
  aspectRatio,
  resolution,
  onPositionChange,
  prompt,
  videos,
  selectedVideo,
  onSelectVideo,
  onSaveToGallery,
  onDeleteVideo,
  savingVideo,
  deletingVideo,
  loading = false,
  fullWidth = false
}: VideoPreviewAreaProps) {
  const previewAspectRatio = aspectRatio.replace(':', '/')
  const selectedVideoData = videos.find(v => v.url === selectedVideo)

  return (
    <Card className={fullWidth ? 'w-full' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Generated Content</CardTitle>
            <CardDescription>Preview source image and generated videos</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Source and Current Video Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Source Image or Prompt Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{sourceImage ? 'Source Image' : 'Current Prompt'}</p>
                  {sourceImage && (
                    <Badge variant="secondary" className="text-xs">
                      {aspectRatio}
                    </Badge>
                  )}
                </div>
                {sourceImage ? (
                  <DraggableImagePreview
                    imageUrl={sourceImage}
                    aspectRatio={aspectRatio}
                    resolution={resolution}
                    onPositionChange={onPositionChange || (() => {})}
                    onSaveFraming={() => {}}
                    className="w-full"
                  />
                ) : (
                  <div
                    className="w-full rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center text-muted-foreground"
                    style={{ aspectRatio: previewAspectRatio }}
                  >
                    <div className="text-center p-8">
                      <VideoIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium mb-2">Current prompt for generation</p>
                      {prompt ? (
                        <p className="text-sm italic text-foreground px-4">"{prompt}"</p>
                      ) : (
                        <p className="text-xs">Enter a prompt to generate a video</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Video Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Current Video</p>
                  {(selectedVideoData || selectedVideo) && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedVideoData?.aspectRatio || aspectRatio}
                    </Badge>
                  )}
                </div>
                {selectedVideo ? (
                  <div className="space-y-2">
                    <video
                      src={selectedVideo}
                      controls
                      className="w-full rounded-lg border"
                      style={{ aspectRatio: previewAspectRatio }}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSaveToGallery(selectedVideo)}
                          disabled={savingVideo === selectedVideo || selectedVideoData?.is_saved}
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          {selectedVideoData?.is_saved ? 'Saved' : savingVideo === selectedVideo ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const a = document.createElement('a')
                            a.href = selectedVideo
                            a.download = `video-${Date.now()}.mp4`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectVideo(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full rounded-lg border-2 ${
                      loading ? 'border-primary/50 bg-primary/5' : 'border-dashed border-border bg-muted'
                    } flex items-center justify-center text-muted-foreground relative overflow-hidden`}
                    style={{ aspectRatio: previewAspectRatio }}
                  >
                    {loading && (
                      <>
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent animate-pulse" />
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
                      </>
                    )}
                    <div className="text-center p-8 relative z-10">
                      {loading ? (
                        <>
                          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Generating your video...</p>
                            <p className="text-xs text-muted-foreground">
                              This may take a few moments. Your video will appear here when ready.
                            </p>
                          </div>
                          {/* Progress dots animation */}
                          <div className="flex items-center justify-center gap-1 mt-4">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <VideoIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No video generated yet</p>
                          <p className="text-xs mt-1">Create your first video!</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

        {/* Generated Videos Grid */}
        {videos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">All Generated Videos</p>
              <Badge variant="secondary" className="text-xs">
                {videos.length} total
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedVideo === video.url
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onSelectVideo(video.url)}
                >
                  <video
                    src={video.url}
                    className="w-full aspect-video object-cover"
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause()
                      e.currentTarget.currentTime = 0
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">{video.title}</p>
                    {video.duration && (
                      <p className="text-white/70 text-xs">{video.duration}s</p>
                    )}
                  </div>
                  {selectedVideo === video.url && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Selected
                    </div>
                  )}
                  {video.is_saved && (
                    <div className="absolute top-2 right-2">
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
