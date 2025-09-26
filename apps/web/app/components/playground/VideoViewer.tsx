'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, Download, Heart, Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoViewerProps {
  title?: string
  description?: string
  videos: Array<{
    url: string
    title?: string
    duration?: number
    resolution?: string
    aspectRatio?: string
    generated_at?: string
  }>
  selectedVideo: string | null
  onSelectVideo: (url: string | null) => void
  onSaveToGallery?: (url: string) => Promise<void>
  onDownloadVideo?: (url: string, filename: string) => Promise<void>
  onDeleteVideo?: (url: string) => Promise<void>
  savingVideo?: string | null
  deletingVideo?: string | null
  loading?: boolean
  emptyStateMessage?: string
}

export default function VideoViewer({
  title = "Generated Videos",
  description = "View and manage your generated videos",
  videos,
  selectedVideo,
  onSelectVideo,
  onSaveToGallery,
  onDownloadVideo,
  onDeleteVideo,
  savingVideo,
  deletingVideo,
  loading = false,
  emptyStateMessage = "No videos available. Generate some videos first!"
}: VideoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null)

  const selectedVideoData = videos.find(video => video.url === selectedVideo)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime)
  }

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const convertAspectRatio = (ratio: string): string => {
    switch (ratio) {
      case '1:1': return '1'
      case '16:9': return '16/9'
      case '9:16': return '9/16'
      case '4:3': return '4/3'
      case '3:4': return '3/4'
      case '21:9': return '21/9'
      default: return '16/9' // Default to widescreen
    }
  }

  const handleDownload = async (videoUrl: string) => {
    if (onDownloadVideo) {
      const filename = `generated-video-${Date.now()}.mp4`
      await onDownloadVideo(videoUrl, filename)
    }
  }

  const handleSave = async (videoUrl: string) => {
    if (onSaveToGallery) {
      await onSaveToGallery(videoUrl)
    }
  }

  const handleDeleteClick = (videoUrl: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent video selection
    setVideoToDelete(videoUrl)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (videoToDelete && onDeleteVideo) {
      await onDeleteVideo(videoToDelete)
      setShowDeleteConfirm(false)
      setVideoToDelete(null)
      
      // If the deleted video was selected, clear selection
      if (selectedVideo === videoToDelete) {
        onSelectVideo(null)
      }
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setVideoToDelete(null)
  }

  return (
    <div className="bg-background rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {videos.length} video{videos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading videos...</span>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No Videos Yet</p>
          <p className="text-sm">{emptyStateMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Video Player */}
          {selectedVideo && selectedVideoData ? (
            <div className="space-y-4">
              <div 
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: convertAspectRatio(selectedVideoData.aspectRatio || '16:9') }}
              >
                <video
                  src={selectedVideo}
                  className="w-full h-full object-cover"
                  controls={false}
                  loop
                  ref={(video) => {
                    if (video) {
                      video.muted = isMuted
                      video.volume = volume
                      if (isPlaying) {
                        video.play()
                      } else {
                        video.pause()
                      }
                    }
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Custom Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-backdrop p-4">
                  <div className="flex items-center justify-between text-foreground">
                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary-foreground hover:bg-background/20"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      
                      <span className="text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary-foreground hover:bg-background/20"
                        onClick={handleMuteToggle}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-background/30 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-background/30 rounded-full h-1">
                      <div 
                        className="bg-background h-1 rounded-full transition-all duration-300"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                    onClick={() => {
                      const video = document.querySelector('video')
                      if (video) {
                        video.requestFullscreen()
                      }
                    }}
                    title="Fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  
                  {onSaveToGallery && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={() => handleSave(selectedVideo)}
                      disabled={savingVideo === selectedVideo}
                      title="Save to Gallery"
                    >
                      {savingVideo === selectedVideo ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border-600"></div>
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {onDownloadVideo && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={() => handleDownload(selectedVideo)}
                      title="Download Video"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onDeleteVideo && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0 bg-destructive-500/90 hover:bg-destructive-600 shadow-md"
                      onClick={(e) => handleDeleteClick(selectedVideo, e)}
                      disabled={deletingVideo === selectedVideo}
                      title="Remove Video"
                    >
                      {deletingVideo === selectedVideo ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Video Info */}
              <div className="bg-muted-50 rounded-lg p-4">
                <h4 className="font-medium text-muted-foreground-900 mb-2">
                  {selectedVideoData.title || 'Generated Video'}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground-600">
                  <div>
                    <span className="font-medium">Duration:</span> {selectedVideoData.duration ? `${selectedVideoData.duration}s` : 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Resolution:</span> {selectedVideoData.resolution || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Aspect Ratio:</span> {selectedVideoData.aspectRatio || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Generated:</span> {selectedVideoData.generated_at ? new Date(selectedVideoData.generated_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground-500">
              <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground-400" />
              <p>Select a video to view</p>
            </div>
          )}

          {/* Video Thumbnails */}
          {videos.length > 1 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground-700 mb-3">All Videos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(100px,auto)]">
                {videos.map((video, index) => {
                  const aspectRatio = convertAspectRatio(video.aspectRatio || '16:9')
                  
                  return (
                    <div
                      key={video.url}
                      className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                        selectedVideo === video.url 
                          ? 'border-primary-500 ring-2 ring-primary-primary/30' 
                          : 'border-border-200 hover:border-border-300'
                      }`}
                      style={{ aspectRatio }}
                      onClick={() => onSelectVideo(video.url)}
                    >
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        loop
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-backdrop p-2">
                        <p className="text-foreground text-xs font-medium truncate">
                          {video.title || `Video ${index + 1}`}
                        </p>
                        {video.duration && (
                          <p className="text-foreground text-xs opacity-75">
                            {video.duration}s
                          </p>
                        )}
                      </div>
                      <div className="absolute top-1 left-1">
                        <span className="bg-black/50 text-primary-foreground text-xs px-1 py-0.5 rounded">
                          {video.resolution || 'Unknown'}
                        </span>
                      </div>
                      <div className="absolute top-1 right-1">
                        <span className="bg-black/50 text-primary-foreground text-xs px-1 py-0.5 rounded">
                          {video.aspectRatio || '16:9'}
                        </span>
                      </div>
                      
                      {/* Delete Button */}
                      {onDeleteVideo && (
                        <div className="absolute top-1 right-1 mt-6">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 w-6 p-0 bg-destructive-500/80 hover:bg-destructive-600 shadow-md"
                            onClick={(e) => handleDeleteClick(video.url, e)}
                            disabled={deletingVideo === video.url}
                            title="Remove Video"
                          >
                            {deletingVideo === video.url ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-border"></div>
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove Video Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-muted-foreground-900">Remove Video</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-muted-foreground-600 mb-6">
              Remove this video from your generated videos list? You can always restore it from Past Generations if needed.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deletingVideo === videoToDelete}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deletingVideo === videoToDelete}
              >
                {deletingVideo === videoToDelete ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                    Removing...
                  </>
                ) : (
                  'Remove Video'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
