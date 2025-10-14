'use client'

import { useState, useRef } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  loading?: 'lazy' | 'eager'
  sizes?: string
  quality?: number
}

export default function ProgressiveImage({
  src,
  alt,
  className = '',
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  loading = 'lazy',
  sizes,
  quality = 75
}: ProgressiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showImage, setShowImage] = useState(false)
  
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  })

  // Generate optimized image URL with quality parameter
  const getOptimizedSrc = (originalSrc: string | null | undefined) => {
    if (!originalSrc || typeof originalSrc !== 'string') {
      console.warn('ProgressiveImage received non-string src:', originalSrc, typeof originalSrc)
      return originalSrc || ''
    }
    
    // If it's already an optimized URL or external URL, return as is
    if (originalSrc.includes('?') || originalSrc.startsWith('http')) {
      return originalSrc
    }
    
    // For Supabase storage URLs, add quality parameter
    if (originalSrc.includes('supabase')) {
      const separator = originalSrc.includes('?') ? '&' : '?'
      return `${originalSrc}${separator}quality=${quality}&format=webp`
    }
    
    return originalSrc
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setShowImage(true)
    onLoad?.()
  }

  const handleImageError = () => {
    setImageError(true)
    onError?.()
  }

  const optimizedSrc = getOptimizedSrc(src)
  const shouldLoad = hasIntersected || loading === 'eager'

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`relative overflow-hidden ${className}`}>
      {/* Blur placeholder */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-muted-200 animate-pulse flex items-center justify-center">
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
              aria-hidden="true"
            />
          ) : (
            <div className="w-8 h-8 border-2 border-border-300 border-t-primary-primary rounded-full animate-spin"></div>
          )}
        </div>
      )}

      {/* Main image */}
      {shouldLoad && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            showImage ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
          sizes={sizes}
        />
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-muted-100 flex items-center justify-center">
          <div className="text-muted-foreground-400 text-center">
            <div className="w-8 h-8 mx-auto mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </div>
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  )
}
