'use client'

import Image from 'next/image';
import { useState } from 'react';

interface FeaturedImage {
  id: string;
  title?: string;
  result_image_url?: string;
  video_url?: string;
  media_type?: string;
  width?: number;
  height?: number;
  users_profile?: {
    display_name?: string;
    handle?: string;
  };
}

interface FeaturedWorkSectionProps {
  featuredImages: FeaturedImage[];
}

export default function FeaturedWorkSection({ featuredImages }: FeaturedWorkSectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; title: string; creator: string } | null>(null);
  const [failedVideos, setFailedVideos] = useState<Set<string>>(new Set());

  // Helper function to calculate image dimensions maintaining aspect ratio
  const getImageStyle = (image: FeaturedImage) => {
    const BASE_WIDTH = 320;

    if (image.width && image.height) {
      const aspectRatio = image.width / image.height;
      const height = Math.round(BASE_WIDTH / aspectRatio);

      return {
        width: `${BASE_WIDTH}px`,
        height: `${height}px`
      };
    }

    // Fallback to 4:3 aspect ratio
    return {
      width: `${BASE_WIDTH}px`,
      height: `${Math.round(BASE_WIDTH * 0.75)}px`
    };
  };

  const handleVideoError = (videoUrl: string) => {
    setFailedVideos(prev => new Set(prev).add(videoUrl));
  };

  return (
    <>
      <section className="py-20 bg-background overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-4">FEATURED WORK</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover amazing creative work from our community of talented professionals
            </p>
          </div>

          <div className="relative w-full">
            <div className="overflow-hidden">
              <div className="flex gap-4 animate-scroll-left">
                {(() => {
                  // Filter valid images (only show videos stored in Supabase)
                  const validImages = featuredImages.filter(image => {
                    if (image.media_type === 'video') {
                      return image.video_url?.includes('supabase.co/storage');
                    }
                    return true;
                  });

                  // If no images, show placeholders
                  if (validImages.length === 0) {
                    const placeholderStyle = { width: '320px', height: '240px' };
                    const placeholders = Array.from({ length: 10 }, (_, index) => (
                      <div key={`placeholder-${index}`} className="relative rounded-lg overflow-hidden bg-accent flex-shrink-0 group cursor-pointer" style={placeholderStyle}>
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Coming Soon</span>
                        </div>
                      </div>
                    ));
                    const duplicatePlaceholders = Array.from({ length: 10 }, (_, index) => (
                      <div key={`placeholder-duplicate-${index}`} className="relative rounded-lg overflow-hidden bg-accent flex-shrink-0 group cursor-pointer" style={placeholderStyle}>
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Coming Soon</span>
                        </div>
                      </div>
                    ));
                    return [...placeholders, ...duplicatePlaceholders];
                  }

                  // Create image item component
                  const createImageItem = (image: FeaturedImage, index: number, keyPrefix = '') => {
                    const isVideo = image.media_type === 'video' && image.video_url;
                    const mediaUrl = isVideo ? image.video_url : image.result_image_url;
                    const imageStyle = getImageStyle(image);

                    return (
                      <div
                        key={`${keyPrefix}${image.id}-${index}`}
                        className="relative rounded-lg overflow-hidden bg-accent flex-shrink-0 group cursor-pointer"
                        style={imageStyle}
                        onClick={() => setLightboxMedia({
                          url: mediaUrl || '',
                          type: isVideo ? 'video' : 'image',
                          title: image.title || 'Creative Project',
                          creator: image.users_profile?.display_name || image.users_profile?.handle || 'Platform User'
                        })}
                      >
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <Image
                            src={mediaUrl || ''}
                            alt={image.title || `Featured work ${index + 1}`}
                            fill
                            sizes="320px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            quality={80}
                            placeholder="blur"
                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
                            onError={(e) => {
                              const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/presetie_logo.png';
                              if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                                (e.target as HTMLImageElement).src = fallbackUrl;
                              }
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="text-primary-foreground">
                            <p className="text-sm font-medium truncate">{image.title || 'Creative Project'}</p>
                            <p className="text-xs text-primary-foreground/70 truncate">
                              by {image.users_profile?.display_name || image.users_profile?.handle || 'Platform User'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  // Create original and duplicate arrays for seamless scrolling
                  const originalItems = validImages.map((image, index) => createImageItem(image, index));
                  const duplicateItems = validImages.map((image, index) => createImageItem(image, index, 'duplicate-'));

                  return [...originalItems, ...duplicateItems];
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Media content */}
            <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {lightboxMedia.type === 'video' ? (
                <video
                  src={lightboxMedia.url}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <Image
                  src={lightboxMedia.url}
                  alt={lightboxMedia.title}
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  quality={90}
                />
              )}

              {/* Media info */}
              <div className="mt-6 text-center text-white">
                <h3 className="text-xl font-semibold mb-1">{lightboxMedia.title}</h3>
                <p className="text-sm text-white/70">by {lightboxMedia.creator}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
