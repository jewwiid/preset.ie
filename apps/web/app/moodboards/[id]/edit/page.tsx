'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import MoodboardBuilder from '../../../components/MoodboardBuilder'
import { ArrowLeft, ImageIcon, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function EditMoodboardPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [featuredImage, setFeaturedImage] = useState<string | null>(null)
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  const handleSave = (moodboardId: string) => {
    console.log('Moodboard updated:', moodboardId)
    // Redirect to the moodboard view page after save
    setTimeout(() => {
      router.push(`/moodboards/${moodboardId}`)
    }, 1000)
  }

  const handleCancel = () => {
    router.push(`/moodboards/${params.id}`)
  }

  const handleFeaturedImageChange = useCallback((imageUrl: string | null) => {
    setFeaturedImage(imageUrl)
    // Reset position when image changes
    setImagePosition({ x: 50, y: 50 })
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!featuredImage) return
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !bannerRef.current) return

    const rect = bannerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setImagePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to edit moodboards</h2>
          <Button onClick={() => router.push('/auth/login')}>Log In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button - Floating */}
      <div className="fixed top-20 left-4 z-20">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/moodboards/${params.id}`)}
          className="shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Featured Banner Image */}
      <div
        ref={bannerRef}
        className="relative w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 overflow-hidden border-b border-border group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {featuredImage ? (
          <>
            <div className="relative w-full h-full">
              <Image
                src={featuredImage}
                alt="Featured moodboard banner"
                fill
                className="object-cover"
                style={{
                  objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                priority
                draggable={false}
              />
            </div>
            {/* Drag Hint */}
            {!isDragging && (
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Move className="w-4 h-4" />
                Drag to reposition
              </div>
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95 pointer-events-none" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Add images to see your featured banner</p>
            </div>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl mb-1 sm:mb-2">
              Edit Moodboard
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-lg">
              Update your visual inspiration board
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MoodboardBuilder
          moodboardId={params.id as string}
          onSave={handleSave}
          onCancel={handleCancel}
          compactMode={false}
          onFeaturedImageChange={handleFeaturedImageChange}
        />
      </div>
    </div>
  )
}
