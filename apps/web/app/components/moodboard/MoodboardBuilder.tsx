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
  usePexelsSearch,
  useImageUpload,
  useImageEnhancement,
  useColorPalette,
  useUserCredits
} from './hooks'
import {
  MoodboardHeader,
  MoodboardTabs,
  ImageUploadPanel,
  PexelsSearchPanel,
  URLImportPanel,
  SavedImagesPanel,
  PaletteDisplay
} from './components'
import { parsePexelsPhoto, getSubscriptionLimits } from './lib/moodboardHelpers'
import DraggableMasonryGrid from '../DraggableMasonryGrid'

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

  // Moodboard data (CRUD operations)
  const moodboardData = useMoodboardData({ moodboardId, gigId })

  // Items management
  const itemsManager = useMoodboardItems({
    initialItems: moodboardData.moodboard?.items || [],
    moodboardId,
    onFeaturedImageChange
  })

  // Pexels search
  const pexels = usePexelsSearch()

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
   * Handle Pexels photo selection
   */
  const handlePexelsSelect = (photo: any) => {
    const item = parsePexelsPhoto(photo)
    itemsManager.addItem(item)
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
        id: Date.now().toString(),
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
    const savedId = await moodboardData.saveMoodboard(itemsManager.items)
    if (savedId && onSave) {
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
    pexels.error ||
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
          <PexelsSearchPanel
            query={pexels.query}
            results={pexels.results}
            loading={pexels.loading}
            currentPage={pexels.currentPage}
            totalPages={pexels.totalPages}
            totalResults={pexels.totalResults}
            filters={pexels.filters}
            onQueryChange={pexels.setQuery}
            onFiltersChange={pexels.setFilters}
            onSelectPhoto={handlePexelsSelect}
            onPreviousPage={pexels.goToPreviousPage}
            onNextPage={pexels.goToNextPage}
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

      {/* Moodboard Grid */}
      {itemsManager.items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Moodboard</h3>
          <DraggableMasonryGrid
            items={itemsManager.items}
            onReorder={itemsManager.reorderItems}
            onRemove={itemsManager.removeItem}
            onSetFeatured={itemsManager.setFeaturedImage}
            featuredImageId={itemsManager.featuredImageId}
            {/* @ts-ignore */}
            onEnhance={(itemId, type, prompt, provider) => {
              handleEnhanceImage(itemId, type, prompt, provider)
            }}
            enhancingItems={enhancement.enhancingItems}
            enhancementTasks={enhancement.enhancementTasks}
          />
        </div>
      )}

      {/* Color Palette */}
      {itemsManager.items.length > 0 && (
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
      )}

      {/* Credits Display */}
      {credits.credits && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Credits: {credits.credits.current} / {credits.credits.monthly} monthly
        </div>
      )}
    </div>
  )
}
