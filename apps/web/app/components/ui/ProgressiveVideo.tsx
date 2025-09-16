'use client'

import { useState, useRef, useEffect } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

interface ProgressiveVideoProps {
  src: string
  poster?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  muted?: boolean
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  controls?: boolean
  playsInline?: boolean
}

export default function ProgressiveVideo({
  src,
  poster,
  className = '',
  onLoad,
  onError,
  onPlay,
  onPause,
  onEnded,
  muted = true,
  loop = false,
  preload = 'metadata',
  controls = false,
  playsInline = true
}: ProgressiveVideoProps) {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  })

  const handleVideoLoad = () => {
    setVideoLoaded(true)
    setShowVideo(true)
    onLoad?.()
  }

  const handleVideoError = () => {
    setVideoError(true)
    onError?.()
  }

  const handlePlay = () => {
    onPlay?.()
  }

  const handlePause = () => {
    onPause?.()
  }

  const handleEnded = () => {
    onEnded?.()
  }

  const shouldLoad = hasIntersected

  // Enhanced preloading strategy for videos
  useEffect(() => {
    if (shouldLoad && videoRef.current) {
      const video = videoRef.current
      
      // Preload video metadata immediately when in viewport
      video.preload = 'metadata'
      
      // Add a small delay before loading the full video to prioritize images
      const preloadTimeout = setTimeout(() => {
        if (video.readyState < 1) { // If metadata not loaded yet
          video.preload = 'auto'
        }
      }, 1000) // 1 second delay for videos
      
      return () => clearTimeout(preloadTimeout)
    }
  }, [shouldLoad])

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!videoLoaded && !videoError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {poster ? (
            <img
              src={poster}
              alt=""
              className="w-full h-full object-cover"
              aria-hidden="true"
            />
          ) : (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
          )}
        </div>
      )}

      {/* Main video */}
      {shouldLoad && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          muted={muted}
          loop={loop}
          preload={preload}
          controls={controls}
          playsInline={playsInline}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Error state */}
      {videoError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="w-8 h-8 mx-auto mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  )
}
