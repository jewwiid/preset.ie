/**
 * MoodboardBuilder Component (REFACTORED)
 * Main orchestrator for the moodboard creation system
 * Reduced from 2,623 lines to ~300 lines by extracting hooks and components
 */

'use client'

import { useEffect, useState } from 'react'
import { MoodboardBuilderProps, TabType, SavedImage } from './lib/moodboardTypes'
import {
  useMoodboardData,
  useMoodboardItems,
  useStockPhotoSearch,
  useImageUpload,
  useImageEnhancement,
  useColorPalette,
  useUserCredits
} from './hooks'
import {
  MoodboardHeader,
  MoodboardTabs,
  ImageUploadPanel,
  StockPhotoSearchPanel,
  URLImportPanel,
  SavedImagesPanel,
  PaletteDisplay
} from './components'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { parsePexelsPhoto, getSubscriptionLimits, generateItemId } from './lib/moodboardHelpers'
import DraggableMasonryGrid from '../DraggableMasonryGrid'
import EnhancementModal from '../EnhancementModal'
import { downloadAndSaveEnhancedImageToGallery } from '@/lib/enhanced-image-storage'
import { useAuth } from '@/lib/auth-context'

export default function MoodboardBuilder({
  gigId,
  moodboardId,
  onSave,
  onCancel,
  compactMode = false,
  onFeaturedImageChange
}: MoodboardBuilderProps) {
  // ============================================================================
  // HOOKS
  // ============================================================================

  // User authentication
  const { user } = useAuth()

  // Moodboard data (CRUD operations)
  const moodboardData = useMoodboardData({ moodboardId, gigId })

  // Items management
  const itemsManager = useMoodboardItems({
    initialItems: moodboardData.moodboard?.items || [],
    moodboardId,
    onFeaturedImageChange
  })

  // Stock photo search
  const stockPhoto = useStockPhotoSearch()

  // Image upload
  const upload = useImageUpload()

  // Image enhancement
  const enhancement = useImageEnhancement({
    moodboardId,
    onCreditsUpdate: () => credits.refetchAll()
  })

  // Color palette
  const palette = useColorPalette({
    moodboardTitle: moodboardData.moodboard?.title || 'fashion moodboard'
  })

  // User credits
  const credits = useUserCredits()

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [savedImages, setSavedImages] = useState<SavedImage[]>([])
  const [savedImagesLoading, setSavedImagesLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const limits = getSubscriptionLimits(credits.tier)
  const uploadedItemsCount = itemsManager.items.filter(i => i.source === 'upload').length
  const enhancedItemsCount = itemsManager.items.filter(i => i.enhanced_url).length

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Sync items when moodboard loads
  useEffect(() => {
    if (moodboardData.moodboard?.items) {
      itemsManager.setItems(moodboardData.moodboard.items)
    }
  }, [moodboardData.moodboard?.items])

  // Sync featured image ID when moodboard loads
  useEffect(() => {
    if (moodboardData.moodboard?.featured_image_id) {
      // Check if the featured_image_id is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(moodboardData.moodboard.featured_image_id)) {
        itemsManager.setFeaturedImage(moodboardData.moodboard.featured_image_id)
      } else {
        // Clear featured image if it's not a valid UUID (e.g., timestamp)
        console.log('Clearing invalid featured_image_id:', moodboardData.moodboard.featured_image_id)
        itemsManager.setFeaturedImage(null)
        // Also clear it in the database
        moodboardData.setFeaturedImageId(null)
      }
    }
  }, [moodboardData.moodboard?.featured_image_id])

  // Sync palette when moodboard loads
  useEffect(() => {
    if (moodboardData.moodboard?.palette && moodboardData.moodboard.palette.length > 0) {
      palette.setPalette(moodboardData.moodboard.palette)
    }
  }, [moodboardData.moodboard?.palette])

  // Sync tags when moodboard loads
  useEffect(() => {
    if (moodboardData.moodboard?.tags) {
      setSelectedTags(moodboardData.moodboard.tags)
    }
  }, [moodboardData.moodboard?.tags])

  // Fetch saved images when tab opens
  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedImages()
    }
  }, [activeTab])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Fetch user's saved images
   */
  const fetchSavedImages = async () => {
    setSavedImagesLoading(true)
    try {
      const response = await fetch('/api/playground/saved-images')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.images) {
          setSavedImages(data.images)
        }
      }
    } catch (err) {
      console.error('Error fetching saved images:', err)
    } finally {
      setSavedImagesLoading(false)
    }
  }

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const uploadedItems = await upload.uploadFiles(files)
    uploadedItems.forEach(item => itemsManager.addItem(item))
  }

  /**
   * Handle URL import
   */
  const handleUrlImport = async (url: string) => {
    const item = await upload.importFromUrl(url)
    if (item) {
      itemsManager.addItem(item)
    }
  }

  /**
   * Handle stock photo selection - automatically download and save to user storage
   */
  const handleStockPhotoSelect = async (photo: any) => {
    if (!user?.id) {
      console.error('No user ID available for stock photo download')
      return
    }

    try {
      // First add the item to the moodboard with external URL
      const item = {
        id: generateItemId(),
        type: 'image' as const,
        source: photo.provider,
        url: photo.url,
        thumbnail_url: photo.src.medium,
        caption: photo.alt,
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        position: itemsManager.items.length,
        // Mark as pending download
        downloadStatus: 'pending'
      }
      
      itemsManager.addItem(item)
      
      // Download the stock photo in the background
      const downloadResponse = await fetch('/api/moodboard/download-stock-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockPhotos: [photo],
          userId: user.id,
          purpose: 'moodboard'
        })
      })
      
      if (downloadResponse.ok) {
        const downloadResult = await downloadResponse.json()
        if (downloadResult.success && downloadResult.results.length > 0) {
          const downloadedPhoto = downloadResult.results[0]
          
          // Update the item with the permanent URL and media ID
          itemsManager.updateItem(item.id, {
            url: downloadedPhoto.permanentUrl,
            thumbnail_url: downloadedPhoto.permanentUrl,
            mediaId: downloadedPhoto.mediaId,
            downloadStatus: 'completed',
            permanentlyStored: true,
            // Preserve all attribution
            photographer: downloadedPhoto.photographer,
            photographer_url: photo.photographer_url,
            attribution: downloadedPhoto.attribution
          })
          
          console.log(`✅ Stock photo downloaded and saved: ${downloadedPhoto.permanentUrl}`)
        } else {
          console.warn('⚠️ Failed to download stock photo:', downloadResult.errors)
          // Update status to failed but keep the item
          itemsManager.updateItem(item.id, {
            downloadStatus: 'failed',
            downloadError: downloadResult.errors?.[0] || 'Download failed'
          })
        }
      } else {
        console.error('❌ Stock photo download API error:', downloadResponse.status)
        itemsManager.updateItem(item.id, {
          downloadStatus: 'failed',
          downloadError: 'Download service unavailable'
        })
      }
      
    } catch (error) {
      console.error('❌ Error handling stock photo selection:', error)
      // The item was already added, just mark it as failed
      const lastItem = itemsManager.items[itemsManager.items.length - 1]
      if (lastItem && lastItem.downloadStatus === 'pending') {
        itemsManager.updateItem(lastItem.id, {
          downloadStatus: 'failed',
          downloadError: 'Network error'
        })
      }
    }
  }

  /**
   * Handle saved image selection
   */
  const handleSavedImageSelect = async (image: SavedImage) => {
    try {
      const dimensions = await import('./lib/moodboardHelpers').then(m =>
        m.getImageDimensions(image.image_url)
      )

      itemsManager.addItem({
        id: generateItemId(),
        type: 'image',
        source: 'upload',
        url: image.image_url,
        thumbnail_url: image.image_url,
        caption: image.title,
        width: dimensions.width,
        height: dimensions.height
      })
    } catch (err) {
      console.error('Error adding saved image:', err)
    }
  }

  /**
   * Handle enhancement request
   */
  const handleEnhanceImage = async (
    itemId: string,
    enhancementType: string,
    prompt: string,
    provider?: 'nanobanana' | 'seedream'
  ) => {
    const item = itemsManager.items.find(i => i.id === itemId)
    if (!item) return

    const result = await enhancement.enhanceImage(item, enhancementType, prompt, provider)

    if (result.success && result.enhancedUrl) {
      // Update item with enhanced URL
      itemsManager.updateItem(itemId, {
        enhanced_url: result.enhancedUrl,
        original_url: item.original_url || item.url,
        enhancement_status: 'completed',
        source: 'ai-enhanced',
        showing_original: false
      })
    }
  }

  /**
   * Handle palette extraction
   */
  const handleExtractPalette = () => {
    palette.extractPalette(itemsManager.items)
  }

  /**
   * Handle save
   */
  const handleSave = async () => {
    // Update the palette in moodboardData before saving
    moodboardData.setPalette(palette.palette)
    
    const savedId = await moodboardData.saveMoodboard(itemsManager.items, itemsManager.featuredImageId)
    
    if (savedId && onSave) {
      // Download all stock photos and ensure featured image is stored
      try {
        console.log('🔄 Downloading stock photos for saved moodboard...')
        
        const downloadResponse = await fetch('/api/moodboard/download-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moodboardId: savedId,
            userId: user?.id,
            featuredImageId: itemsManager.featuredImageId
          })
        })
        
        if (downloadResponse.ok) {
          const downloadResult = await downloadResponse.json()
          console.log(`✅ Downloaded ${downloadResult.stockPhotos.downloaded} stock photos`)
          
          if (downloadResult.stockPhotos.failed > 0) {
            console.warn(`⚠️ Failed to download ${downloadResult.stockPhotos.failed} stock photos:`, downloadResult.stockPhotos.errors)
          }
          
          if (downloadResult.featuredImage?.success) {
            console.log('✅ Featured image downloaded and stored')
          }
        } else {
          console.warn('⚠️ Failed to download stock photos, but moodboard was saved')
        }
      } catch (error) {
        console.warn('⚠️ Error downloading stock photos:', error)
        // Don't fail the save operation for download issues
      }
      
      onSave(savedId)
    }
  }

  /**
   * Handle tag management
   */
  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 3) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      moodboardData.setTags(newTags)
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove)
    setSelectedTags(newTags)
    moodboardData.setTags(newTags)
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const error =
    moodboardData.error ||
    upload.error ||
    stockPhoto.error ||
    enhancement.error ||
    palette.error ||
    credits.error

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={compactMode ? 'space-y-4' : 'bg-card rounded-lg shadow-lg p-6'}>
      {/* Header */}
      <MoodboardHeader
        title={moodboardData.moodboard?.title || ''}
        description={moodboardData.moodboard?.summary || moodboardData.moodboard?.description || ''}
        moodboardId={moodboardId}
        loading={moodboardData.loading}
        hasUnsavedChanges={moodboardData.hasUnsavedChanges}
        compactMode={compactMode}
        userSubscriptionTier={credits.tier}
        onTitleChange={moodboardData.setTitle}
        onDescriptionChange={moodboardData.setDescription}
        onSave={handleSave}
        onCancel={onCancel}
      />

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded mb-4">
          {error}
        </div>
      )}

      {/* Success Message */}
      {moodboardData.success && (
        <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded mb-4">
          {moodboardData.success}
        </div>
      )}

      {/* Tabs */}
      <MoodboardTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        uploadCount={uploadedItemsCount}
        enhancementCount={enhancedItemsCount}
      />

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'upload' && (
          <ImageUploadPanel
            uploading={upload.uploading}
            uploadProgress={upload.uploadProgress}
            fileInputRef={upload.fileInputRef}
            onFileSelect={handleFileUpload}
          />
        )}

        {activeTab === 'pexels' && (
          <StockPhotoSearchPanel
            query={stockPhoto.query}
            results={stockPhoto.results}
            loading={stockPhoto.loading}
            currentPage={stockPhoto.currentPage}
            totalPages={stockPhoto.totalPages}
            totalResults={stockPhoto.totalResults}
            filters={stockPhoto.filters}
            provider={stockPhoto.provider}
            onQueryChange={stockPhoto.setQuery}
            onFiltersChange={stockPhoto.setFilters}
            onProviderChange={stockPhoto.setProvider}
            onSelectPhoto={handleStockPhotoSelect}
            onPreviousPage={stockPhoto.goToPreviousPage}
            onNextPage={stockPhoto.goToNextPage}
          />
        )}

        {activeTab === 'url' && (
          <URLImportPanel onImport={handleUrlImport} loading={upload.uploading} />
        )}

        {activeTab === 'saved' && (
          <SavedImagesPanel
            images={savedImages}
            loading={savedImagesLoading}
            onSelectImage={handleSavedImageSelect}
          />
        )}

        {activeTab === 'enhance' && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Select an image from your moodboard below to enhance it
            </p>
          </div>
        )}
      </div>

      {/* Moodboard Grid and Palette with Resizable Panels */}
      {itemsManager.items.length > 0 && (
        <div className="mb-6">
          {/* Mobile Layout - Stacked */}
          <div className="block lg:hidden space-y-4">
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Your Moodboard</h3>
              <div className="h-[calc(100%-2rem)] overflow-auto">
                <DraggableMasonryGrid
                  items={itemsManager.items.map(item => ({
                    ...item,
                    // Map source to match MasonryItem type
                    source: (item.source === 'unsplash' || item.source === 'pixabay') ? 'url' : item.source
                  }))}
                  onReorder={itemsManager.reorderItems}
                  onRemove={itemsManager.removeItem}
                  onSetFeatured={itemsManager.setFeaturedImage}
                  featuredImageId={itemsManager.featuredImageId}
                  onEnhance={(itemId: string) => {
                    enhancement.openEnhancementModal(itemId)
                  }}
                  enhancingItems={enhancement.enhancingItems}
                  enhancementTasks={enhancement.enhancementTasks}
                />
              </div>
            </div>
            <div className="h-[300px]">
              <PaletteDisplay
                palette={palette.palette}
                loading={palette.loading}
                useAI={palette.useAI}
                aiDescription={palette.aiAnalysis?.description}
                aiMood={palette.aiAnalysis?.mood}
                onToggleAI={palette.setUseAI}
                onExtract={handleExtractPalette}
                disabled={itemsManager.items.length === 0}
              />
            </div>
          </div>

          {/* Desktop Layout - Resizable Panels */}
          <div className="hidden lg:block h-[600px]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={70} minSize={40}>
                <div className="h-full">
                  <h3 className="text-lg font-semibold mb-4">Your Moodboard</h3>
                  <div className="h-[calc(100%-2rem)] overflow-auto">
                    <DraggableMasonryGrid
                      items={itemsManager.items.map(item => ({
                        ...item,
                        // Map source to match MasonryItem type
                        source: (item.source === 'unsplash' || item.source === 'pixabay') ? 'url' : item.source
                      }))}
                      onReorder={itemsManager.reorderItems}
                      onRemove={itemsManager.removeItem}
                      onSetFeatured={itemsManager.setFeaturedImage}
                      featuredImageId={itemsManager.featuredImageId}
                      onEnhance={(itemId: string) => {
                        enhancement.openEnhancementModal(itemId)
                      }}
                      enhancingItems={enhancement.enhancingItems}
                      enhancementTasks={enhancement.enhancementTasks}
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full pl-4">
                  <PaletteDisplay
                    palette={palette.palette}
                    loading={palette.loading}
                    useAI={palette.useAI}
                    aiDescription={palette.aiAnalysis?.description}
                    aiMood={palette.aiAnalysis?.mood}
                    onToggleAI={palette.setUseAI}
                    onExtract={handleExtractPalette}
                    disabled={itemsManager.items.length === 0}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      )}

      {/* Credits Display */}
      {credits.credits && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Credits: {credits.credits.current} / {credits.credits.monthly} monthly
        </div>
      )}

      {/* Enhancement Modal */}
      {enhancement.enhancementModal.isOpen && (
        <EnhancementModal
          isOpen={enhancement.enhancementModal.isOpen}
          onClose={enhancement.closeEnhancementModal}
          onEnhance={async (type: string, prompt: string) => {
            const item = itemsManager.items.find(i => i.id === enhancement.enhancementModal.itemId)
            if (!item) return

            const result = await enhancement.enhanceImage(item, type, prompt, enhancement.selectedProvider)
            if (result.success && result.enhancedUrl) {
              // Update item with enhanced URL
              itemsManager.updateItem(enhancement.enhancementModal.itemId!, {
                enhanced_url: result.enhancedUrl,
                original_url: item.original_url || item.url,
                enhancement_status: 'completed',
                source: 'ai-enhanced',
                showing_original: false
              })

              // Save enhanced image to user gallery
              try {
                const savedImage = await downloadAndSaveEnhancedImageToGallery(
                  result.enhancedUrl,
                  user?.id || '',
                  item.id,
                  type
                )
                if (savedImage.success) {
                  console.log('Enhanced image saved to gallery:', savedImage.permanentUrl)

                  // Update item with permanent URL
                  itemsManager.updateItem(enhancement.enhancementModal.itemId!, {
                    enhanced_url: savedImage.permanentUrl
                  })
                } else {
                  console.error('Failed to save enhanced image to gallery:', savedImage.error)
                }
              } catch (saveError) {
                console.error('Error saving enhanced image to gallery:', saveError)
              }
            }
          }}
          itemUrl={itemsManager.items.find(i => i.id === enhancement.enhancementModal.itemId)?.url || ''}
          itemCaption={itemsManager.items.find(i => i.id === enhancement.enhancementModal.itemId)?.caption}
          credits={credits.credits?.current || 0}
          enhancedUrl={enhancement.activeEnhancement ? enhancement.activeEnhancement.url : undefined}
          isEnhancing={enhancement.enhancingItems.has(enhancement.enhancementModal.itemId || '')}
        />
      )}
    </div>
  )
}
