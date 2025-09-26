'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Upload, Search, Sparkles, Save, Loader2, X, Palette, Clock, CheckCircle, ImageIcon, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { extractPaletteFromImages } from '../../lib/color-extractor'
import { extractAIPaletteFromImages } from '../../lib/ai-color-extractor'
import EnhancedEnhancementModal from './EnhancedEnhancementModal'
import DraggableMasonryGrid from './DraggableMasonryGrid'
import { optimizeImageForAPI, preloadImages, estimateProcessingTime, compressImageClientSide } from '../../lib/image-optimizer'
import { ImageProviderSelector } from './ImageProviderSelector'

interface MoodboardItem {
  id: string
  type: 'image' | 'video' | 'pexels'
  source: 'upload' | 'pexels' | 'url' | 'ai-enhanced'
  url: string
  thumbnail_url?: string
  enhanced_url?: string  // URL of enhanced version if exists
  caption?: string
  width?: number
  height?: number
  photographer?: string
  photographer_url?: string
  position: number
  enhancement_prompt?: string
  original_image_id?: string  // Reference to original if this is enhanced
  original_url?: string  // Store original URL for attribution
  enhancement_task_id?: string  // Track enhancement task
  enhancement_status?: 'pending' | 'processing' | 'completed' | 'failed'
  cost?: number
  showing_original?: boolean  // Track which version is being displayed
}

interface EnhancementRequest {
  imageId: string
  enhancementType: 'lighting' | 'style' | 'background' | 'mood' | 'custom'
  prompt: string
  selectedProvider?: 'nanobanana' | 'seedream'
}

interface MoodboardBuilderProps {
  gigId?: string
  moodboardId?: string
  onSave?: (moodboardId: string) => void
  onCancel?: () => void
  compactMode?: boolean
}

export default function MoodboardBuilder({ gigId, moodboardId, onSave, onCancel, compactMode = false }: MoodboardBuilderProps) {
  const { user, session } = useAuth()
  
  // Gig data for comprehensive AI analysis
  const [gigData, setGigData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [items, setItems] = useState<MoodboardItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'pexels' | 'saved' | 'url' | 'enhance'>('upload')
  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsResults, setPexelsResults] = useState<any[]>([])
  const [pexelsPage, setPexelsPage] = useState(1)
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0)
  const [pexelsCurrentPage, setPexelsCurrentPage] = useState(1)
  const [pexelsTotalPages, setPexelsTotalPages] = useState(0)
  const [pexelsFilters, setPexelsFilters] = useState({
    orientation: '',
    size: '',
    color: ''
  })
  const [urlInput, setUrlInput] = useState('')
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [enhancementRequests, setEnhancementRequests] = useState<EnhancementRequest[]>([])
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'plus' | 'pro'>('free')
  const [isGenerating, setIsGenerating] = useState(false)
  const [palette, setPalette] = useState<string[]>([])
  const [useAIPalette, setUseAIPalette] = useState(false)
  const [paletteLoading, setPaletteLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{ description?: string, mood?: string } | null>(null)
  const [userCredits, setUserCredits] = useState<{ current: number, monthly: number } | null>(null)
  const [enhancingItems, setEnhancingItems] = useState<Set<string>>(new Set())
  const [enhancementModal, setEnhancementModal] = useState<{ isOpen: boolean, itemId: string | null }>({ isOpen: false, itemId: null })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSavingPositions, setIsSavingPositions] = useState(false)
  const [enhancementTasks, setEnhancementTasks] = useState<Map<string, { status: string, progress: number }>>(new Map())
  const [activeEnhancement, setActiveEnhancement] = useState<{ itemId: string, taskId: string, url: string, type: string, prompt: string } | null>(null)
  
  // Provider selection state for enhancements
  const [selectedEnhancementProvider, setSelectedEnhancementProvider] = useState<'nanobanana' | 'seedream'>('seedream')
  const [showEnhancementProviderSelector, setShowEnhancementProviderSelector] = useState(false)
  
  // Vibe & Style Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [existingTemplate, setExistingTemplate] = useState<any>(null)
  const [showTemplateConflict, setShowTemplateConflict] = useState(false)
  
  // Enhanced image upload state
  const [savedImages, setSavedImages] = useState<Array<{
    id: string
    image_url: string
    title: string
    created_at: string
  }>>([])
  const [savedImagesLoading, setSavedImagesLoading] = useState(false)

  // Debug modal state
  useEffect(() => {
    console.log('Enhancement modal state:', enhancementModal)
  }, [enhancementModal])
  
  // Debug active enhancement state
  useEffect(() => {
    console.log('Active enhancement state:', activeEnhancement)
  }, [activeEnhancement])
  
  // Debug items updates
  useEffect(() => {
    const enhancedItems = items.filter(i => i.enhanced_url)
    if (enhancedItems.length > 0) {
      console.log('Enhanced items in moodboard:', enhancedItems)
    }
  }, [items])
  
  // Load existing moodboard data if editing
  useEffect(() => {
    const loadMoodboard = async () => {
      if (!moodboardId || !user) return
      
      console.log('Loading existing moodboard:', moodboardId)
      setLoading(true)
      
      try {
        if (!supabase) {
          console.error('Supabase client not available')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('moodboards')
          .select('*')
          .eq('id', moodboardId)
          .single()
        
        if (error) throw error
        
        if (data) {
          console.log('Loaded moodboard data:', data)
          setTitle(data.title || '')
          setDescription(data.summary || '')
          setPalette(data.palette || [])
          setSelectedTags(data.tags || [])
          
          // Load items with enhanced URLs preserved
          if (data.items && Array.isArray(data.items)) {
            console.log('Loading items from database:', data.items)
            const itemsWithEnhanced = data.items.filter((item: MoodboardItem) => item.enhanced_url)
            console.log('Items with enhanced URLs:', itemsWithEnhanced)
            setItems(data.items)
          }
        }
      } catch (err: any) {
        console.error('Error loading moodboard:', err)
        setError('Failed to load moodboard')
      } finally {
        setLoading(false)
      }
    }
    
    loadMoodboard()
  }, [moodboardId, user])
  
  // Subscription limits - computed based on current tier
  const getSubscriptionLimits = () => {
    const limitsMap: Record<string, { userUploads: number; aiEnhancements: number }> = {
      free: { userUploads: 0, aiEnhancements: 0 },
      FREE: { userUploads: 0, aiEnhancements: 0 },
      plus: { userUploads: 3, aiEnhancements: 2 },
      PLUS: { userUploads: 3, aiEnhancements: 2 },
      pro: { userUploads: 6, aiEnhancements: 4 },
      PRO: { userUploads: 6, aiEnhancements: 4 }
    }
    return limitsMap[subscriptionTier] || limitsMap.free
  }

  const limits = getSubscriptionLimits()
  
  // Predefined vibe options
  const vibeOptions = [
    'Minimalist', 'Vintage', 'Modern', 'Boho', 'Industrial', 'Ethereal',
    'Bold', 'Soft', 'Dark', 'Bright', 'Moody', 'Clean', 'Rustic', 'Elegant',
    'Edgy', 'Romantic', 'Urban', 'Natural', 'Luxurious', 'Playful'
  ]

  // Helper function to get image dimensions
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = url
    })
  }
  
  // Fetch user's subscription tier and credits on mount
  useEffect(() => {
    fetchSubscriptionTier()
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  // Fetch saved images when saved tab is active
  useEffect(() => {
    if (activeTab === 'saved' && user && session?.access_token && savedImages.length === 0) {
      fetchSavedImages()
    }
  }, [activeTab, user, session?.access_token])

  // Fetch gig data for comprehensive AI analysis
  useEffect(() => {
    const fetchGigData = async () => {
      if (!gigId || !user) return

      // Skip fetching if gigId is temporary or not a valid UUID
      if (gigId.startsWith('temp-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gigId)) {
        console.log('Skipping gig data fetch for temporary or invalid gigId:', gigId)
        return
      }

      try {
        if (!supabase) {
          console.error('Supabase client not available')
          return
        }

        const { data, error } = await supabase
          .from('gigs')
          .select('*')
          .eq('id', gigId)
          .single()

        if (error) {
          console.error('Error fetching gig data:', error)
          return
        }

        console.log('Loaded gig data for AI analysis:', data)
        setGigData(data)
      } catch (error) {
        console.error('Failed to fetch gig data:', error)
      }
    }

    fetchGigData()
  }, [gigId, user])

  // Load existing moodboard if moodboardId is provided
  useEffect(() => {
    if (moodboardId && user) {
      fetchExistingMoodboard()
    }
  }, [moodboardId, user])
  
  // Extract colors when items change
  useEffect(() => {
    if (items.length > 0) {
      extractColors()
    } else {
      setPalette([])
      setAiAnalysis(null)
    }
  }, [items, useAIPalette])
  
  // Fetch saved images
  const fetchSavedImages = async () => {
    if (!user || !session?.access_token) return
    
    setSavedImagesLoading(true)
    try {
      const response = await fetch('/api/playground/saved-images', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.images) {
          setSavedImages(data.images)
        }
      }
    } catch (error) {
      console.error('Error fetching saved images:', error)
    } finally {
      setSavedImagesLoading(false)
    }
  }

  // Tag management functions
  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag) && selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, tag])
      setHasUnsavedChanges(true)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove))
    setHasUnsavedChanges(true)
  }

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim()) && selectedTags.length < 3) {
      setSelectedTags(prev => [...prev, customTag.trim()])
      setCustomTag('')
      setShowTagInput(false)
      setHasUnsavedChanges(true)
    }
  }

  // Check for similar existing templates
  const checkForSimilarTemplates = async (name: string) => {
    if (!supabase || !user || !name.trim()) return null

    try {
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) return null

      // Check for templates with similar names or content
      const { data: templates, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('owner_user_id', profile.id)
        .eq('is_template', true)
        .or(`template_name.ilike.%${name}%,template_description.ilike.%${description}%`)
        .limit(5)

      if (error) {
        console.error('Error checking templates:', error)
        return null
      }

      return templates || []
    } catch (error) {
      console.error('Error in checkForSimilarTemplates:', error)
      return null
    }
  }

  // Calculate moodboard similarity score
  const calculateSimilarity = (template: any) => {
    let score = 0
    let factors = []

    // Name similarity
    if (template.template_name && templateName) {
      const nameSimilarity = template.template_name.toLowerCase().includes(templateName.toLowerCase()) ||
                           templateName.toLowerCase().includes(template.template_name.toLowerCase())
      if (nameSimilarity) {
        score += 30
        factors.push('Similar name')
      }
    }

    // Description similarity
    if (template.template_description && description) {
      const descSimilarity = template.template_description.toLowerCase().includes(description.toLowerCase()) ||
                            description.toLowerCase().includes(template.template_description.toLowerCase())
      if (descSimilarity) {
        score += 20
        factors.push('Similar description')
      }
    }

    // Image count similarity
    const templateImageCount = template.items?.length || 0
    const currentImageCount = items.length
    if (Math.abs(templateImageCount - currentImageCount) <= 2) {
      score += 15
      factors.push('Similar image count')
    }

    // Tag similarity
    if (template.tags && selectedTags.length > 0) {
      const commonTags = template.tags.filter((tag: string) => selectedTags.includes(tag))
      if (commonTags.length > 0) {
        score += (commonTags.length / Math.max(template.tags.length, selectedTags.length)) * 25
        factors.push(`${commonTags.length} common tags`)
      }
    }

    // Palette similarity (basic check)
    if (template.palette && palette.length > 0) {
      const commonColors = template.palette.filter((color: string) => palette.includes(color))
      if (commonColors.length > 0) {
        score += (commonColors.length / Math.max(template.palette.length, palette.length)) * 10
        factors.push(`${commonColors.length} common colors`)
      }
    }

    return { score: Math.round(score), factors }
  }

  // Handle template name change with similarity check
  const handleTemplateNameChange = async (name: string) => {
    setTemplateName(name)
    
    if (name.trim().length >= 3) {
      const similarTemplates = await checkForSimilarTemplates(name)
      
      if (similarTemplates && similarTemplates.length > 0) {
        // Find the most similar template
        const templatesWithScores = similarTemplates.map(template => ({
          ...template,
          similarity: calculateSimilarity(template)
        }))
        
        const mostSimilar = templatesWithScores.reduce((prev, current) => 
          current.similarity.score > prev.similarity.score ? current : prev
        )
        
        // If similarity is high (>70%), show conflict warning
        if (mostSimilar.similarity.score > 70) {
          setExistingTemplate(mostSimilar)
          setShowTemplateConflict(true)
        } else {
          setExistingTemplate(null)
          setShowTemplateConflict(false)
        }
      } else {
        setExistingTemplate(null)
        setShowTemplateConflict(false)
      }
    } else {
      setExistingTemplate(null)
      setShowTemplateConflict(false)
    }
  }

  // Select saved image for moodboard
  const selectSavedImage = async (image: { id: string; image_url: string; title: string }) => {
    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(image.image_url)
      
      const newItem: MoodboardItem = {
        id: Date.now().toString(),
        type: 'image',
        source: 'upload',
        url: image.image_url,
        thumbnail_url: image.image_url,
        caption: image.title || 'Saved Image',
        width: dimensions.width,
        height: dimensions.height,
        position: items.length
      }
      
      setItems(prev => [...prev, newItem])
      setHasUnsavedChanges(true)
      
      // Close the tab after selection
      setActiveTab('upload')
    } catch (error) {
      console.error('Error adding saved image:', error)
    }
  }

  const extractColors = async () => {
    const imageUrls = items
      .filter(item => item.type === 'image')
      .map(item => item.thumbnail_url || item.url)
    
    if (imageUrls.length === 0) return
    
    setPaletteLoading(true)
    
    try {
      if (useAIPalette && subscriptionTier !== 'free') {
        // Use AI for Pro/Plus users
        const analysis = await extractAIPaletteFromImages(imageUrls, title || 'fashion moodboard', gigData)
        setPalette(analysis.palette)
        setAiAnalysis({
          description: analysis.description,
          mood: analysis.mood
        })
      } else {
        // Use basic extraction for Free users or when AI is disabled
        const colors = await extractPaletteFromImages(imageUrls)
        setPalette(colors)
        setAiAnalysis(null)
      }
    } catch (error) {
      console.error('Color extraction failed:', error)
      // Fallback to basic extraction
      const colors = await extractPaletteFromImages(imageUrls)
      setPalette(colors)
    } finally {
      setPaletteLoading(false)
    }
  }
  
  const fetchSubscriptionTier = async () => {
    if (!user) return
    
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()
    
    if (profile?.subscription_tier) {
      setSubscriptionTier(profile.subscription_tier as 'free' | 'plus' | 'pro')
    }
  }

  const fetchUserCredits = async () => {
    if (!user) return
    
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    const { data: credits } = await supabase
      .from('user_credits')
      .select('current_balance, monthly_allowance')
      .eq('user_id', user.id)
      .single()
    
    if (credits) {
      setUserCredits({
        current: credits.current_balance,
        monthly: credits.monthly_allowance
      })
    }
  }

  const fetchExistingMoodboard = async () => {
    if (!moodboardId) return
    
    console.log('Fetching moodboard with ID:', moodboardId)
    setLoading(true)
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        setLoading(false)
        return
      }

      const { data: moodboard, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('id', moodboardId)
        .single()
      
      if (error) {
        console.error('Error fetching moodboard:', error)
        setError('Failed to load moodboard')
        return
      }
      
      if (moodboard) {
        console.log('Moodboard data loaded:', {
          title: moodboard.title,
          itemsCount: moodboard.items?.length || 0,
          hasItems: !!moodboard.items
        })
        
        // Set the moodboard data
        setTitle(moodboard.title || '')
        setDescription(moodboard.description || '')
        
        // Load items if they exist
        if (moodboard.items && Array.isArray(moodboard.items)) {
          // Sort items by position
          const sortedItems = moodboard.items.sort((a: any, b: any) => 
            (a.position || 0) - (b.position || 0)
          )
          console.log('Loading items:', sortedItems.length, 'items')
          setItems(sortedItems)
        } else {
          console.log('No items found in moodboard')
        }
        
        // Load palette if it exists
        if (moodboard.palette && Array.isArray(moodboard.palette)) {
          setPalette(moodboard.palette)
        }
        
        // Load AI analysis if it exists
        if (moodboard.vibe_summary) {
          setAiAnalysis({
            description: moodboard.vibe_summary,
            mood: moodboard.mood || ''
          })
        }
      }
    } catch (err: any) {
      console.error('Error loading moodboard:', err)
      setError('Failed to load moodboard')
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !user) return
    
    setLoading(true)
    setError(null)
    
    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.')
        setLoading(false)
        return
      }

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        setError('You must be logged in to upload files')
        return
      }
      
      for (const file of Array.from(files)) {
        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          setError('Please upload only images or videos')
          continue
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB')
          continue
        }
        
        // Compress image before upload for faster processing
        let fileToUpload: File | Blob = file
        if (file.type.startsWith('image/')) {
          try {
            console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
            const compressed = await compressImageClientSide(file, {
              maxWidth: 2048,  // Keep reasonable quality for display
              maxHeight: 2048,
              quality: 0.9,     // High quality for uploads
              format: 'jpeg'
            })
            console.log(`Compressed to: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`)
            fileToUpload = compressed
          } catch (err) {
            console.warn('Could not compress image, using original:', err)
          }
        }
        
        // Generate a simpler file path (avoid nested folders that might cause issues)
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileExt = file.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}-${timestamp}-${randomStr}.${fileExt}`
        
        // Try moodboard-media bucket first, fallback to user-media
        const bucketName = 'user-media'; // Change to 'moodboard-media' if you create the new bucket
        console.log('Uploading file:', fileName, 'to bucket:', bucketName)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            contentType: fileToUpload.type || 'image/jpeg'
          })
        
        if (uploadError) {
          console.error('Upload error details:', uploadError)
          console.error('Error code:', uploadError.message)
          console.error('Make sure to run the storage policy fixes in Supabase Dashboard')
          throw uploadError
        }
        
        console.log('File uploaded successfully:', fileName)
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)
        
        // Add to items
        const newItem: MoodboardItem = {
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : 'video',
          source: 'upload',
          url: publicUrl,
          thumbnail_url: publicUrl,
          caption: file.name,
          position: items.length
        }
        
        setItems(prev => [...prev, newItem])
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload file')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  // Search Pexels
  const searchPexels = async (page = 1) => {
    if (!pexelsQuery.trim()) return
    
    setPexelsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: pexelsQuery,
          page,
          per_page: 18, // 3 rows of 6 images
          ...(pexelsFilters.orientation && { orientation: pexelsFilters.orientation }),
          ...(pexelsFilters.size && { size: pexelsFilters.size }),
          ...(pexelsFilters.color && { color: pexelsFilters.color })
        })
      })
      
      if (!response.ok) throw new Error('Failed to search Pexels')
      
      const data = await response.json()
      
      // Always replace results for pagination (no appending)
      setPexelsResults(data.photos || [])
      setPexelsCurrentPage(data.page || page)
      setPexelsTotalResults(data.total_results || 0)
      
      // Calculate total pages (18 images per page)
      const totalPages = Math.ceil((data.total_results || 0) / 18)
      setPexelsTotalPages(totalPages)
      
    } catch (err: any) {
      console.error('Pexels search error:', err)
      setError('Failed to search images')
    } finally {
      setPexelsLoading(false)
    }
  }
  
  // Pagination functions
  const goToPreviousPage = () => {
    if (pexelsCurrentPage > 1 && !pexelsLoading) {
      searchPexels(pexelsCurrentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (pexelsCurrentPage < pexelsTotalPages && !pexelsLoading) {
      searchPexels(pexelsCurrentPage + 1)
    }
  }

  // Debounced search effect for Pexels
  useEffect(() => {
    if (!pexelsQuery.trim()) {
      setPexelsResults([])
      setPexelsTotalResults(0)
      setPexelsCurrentPage(1)
      setPexelsTotalPages(0)
      return
    }

    const timeoutId = setTimeout(() => {
      searchPexels(1)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [pexelsQuery, pexelsFilters])
  
  // Add Pexels image
  const addPexelsImage = (photo: any) => {
    const newItem: MoodboardItem = {
      id: crypto.randomUUID(),
      type: 'image',
      source: 'pexels',
      url: photo.src.large2x,
      thumbnail_url: photo.src.medium,
      caption: photo.alt || '',
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      position: items.length
    }
    
    setItems(prev => [...prev, newItem])
  }
  
  // Add URL
  const addUrlImage = () => {
    if (!urlInput.trim()) return
    
    const newItem: MoodboardItem = {
      id: crypto.randomUUID(),
      type: 'image',
      source: 'url',
      url: urlInput,
      thumbnail_url: urlInput,
      position: items.length
    }
    
    setItems(prev => [...prev, newItem])
    setUrlInput('')
  }
  
  // Remove item
  const removeItem = (itemId: string) => {
    setItems(prev => prev
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, position: index }))
    )
  }

  // Handle saving enhanced image to gallery
  const handleSaveToGallery = async (imageUrl: string, caption?: string) => {
    if (!supabase || !user) {
      throw new Error('Authentication required')
    }

    try {
      // Save to playground gallery
      const { data, error } = await supabase
        .from('playground_gallery')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          thumbnail_url: imageUrl, // Use same URL for thumbnail
          title: caption || 'Enhanced Image',
          media_type: 'image',
          source: 'enhancement'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving to gallery:', error)
        throw error
      }

      console.log('Image saved to gallery:', data)
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to save to gallery:', error)
      throw error
    }
  }
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null) return
    
    const draggedItemContent = items[draggedItem]
    const newItems = [...items]
    
    // Remove dragged item
    newItems.splice(draggedItem, 1)
    
    // Insert at new position
    if (draggedItemContent) {
      newItems.splice(dropIndex, 0, draggedItemContent)
    }
    
    // Update positions
    setItems(newItems.map((item, index) => ({ ...item, position: index })))
    setDraggedItem(null)
  }
  
  // Add AI enhancement request
  const addEnhancementRequest = (imageId: string, enhancementType: string, prompt: string, provider?: 'nanobanana' | 'seedream') => {
    const maxEnhancements = limits?.aiEnhancements || 0
    if (enhancementRequests.length >= maxEnhancements) {
      setError(`AI enhancements limit reached: ${maxEnhancements}`)
      return
    }

    const newRequest: EnhancementRequest = { 
      imageId, 
      enhancementType: enhancementType as 'lighting' | 'style' | 'background' | 'mood' | 'custom', 
      prompt,
      selectedProvider: provider || selectedEnhancementProvider
    }
    setEnhancementRequests(prev => [...prev, newRequest])
  }

  // Remove AI enhancement request
  const removeEnhancementRequest = (index: number) => {
    setEnhancementRequests(prev => prev.filter((_, i) => i !== index))
  }

  // Enhance image with selected provider and replace in moodboard
  const enhanceImage = async (itemId: string, enhancementType: string, prompt: string, provider?: 'nanobanana' | 'seedream') => {
    console.log('enhanceImage called:', { itemId, enhancementType, prompt })
    const item = items.find(i => i.id === itemId)
    if (!item || !user) {
      console.log('No item or user:', { hasItem: !!item, hasUser: !!user })
      return
    }

    // Check credits
    if (!userCredits || userCredits.current < 1) {
      setError('Insufficient credits for enhancement. Please upgrade your plan.')
      return
    }

    setEnhancingItems(prev => new Set(prev).add(itemId))
    setEnhancementTasks(prev => new Map(prev).set(itemId, { status: 'processing', progress: 10 }))
    
    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.')
        return
      }

      const session = await supabase.auth.getSession()
      if (!session.data.session) {
        throw new Error('No active session. Please sign in again.')
      }

      // Optimize image before sending to API
      let optimizedUrl = item.url
      try {
        const result = await optimizeImageForAPI(item.url, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.85,
          format: 'jpeg'
        })
        optimizedUrl = result.optimizedUrl
      } catch (err) {
        console.warn('Could not optimize image, using original:', err)
      }

      console.log('Enhancing image:', {
        itemId,
        originalUrl: item.url,
        optimizedUrl,
        enhancementType,
        prompt
      })

      // Preload the original image for smoother preview
      await preloadImages([item.url]).catch(err => console.log('Preload failed:', err))

      // Call enhancement API (production-ready)
      const USE_MOCK = false; // Using real API
      const selectedProviderForEnhancement = provider || selectedEnhancementProvider
      const apiEndpoint = USE_MOCK ? '/api/enhance-image-mock' : '/api/enhance-image';
      console.log('Calling enhancement API:', apiEndpoint, {
        inputImageUrl: optimizedUrl,
        enhancementType,
        prompt,
        moodboardId,
        selectedProvider: selectedProviderForEnhancement
      })
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          inputImageUrl: optimizedUrl,  // Use optimized URL
          enhancementType,
          prompt: prompt || `Enhance this ${enhancementType} for a fashion moodboard`,
          strength: 0.8,
          moodboardId,
          selectedProvider: selectedProviderForEnhancement
        })
      }).catch(err => {
        console.error('Fetch error details:', err)
        throw new Error(`Network error: ${err.message}`)
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response error:', response.status, errorText)
        throw new Error(`API Error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log('Enhancement API response:', data)
      
      if (!data.success) {
        console.error('Enhancement API error:', data)
        
        // Handle specific error codes for better user feedback
        if (data.code === 'DATA_URL_NOT_SUPPORTED') {
          throw new Error('Please use a direct image URL instead of pasted/uploaded images for enhancement')
        } else if (data.code === 'IMAGE_URL_INACCESSIBLE') {
          throw new Error('The image URL is not accessible. Please ensure it\'s publicly available')
        } else if (data.code === 'INSUFFICIENT_CREDITS') {
          throw new Error(data.error || 'Insufficient credits for enhancement')
        } else if (data.code === 'INVALID_IMAGE_FORMAT') {
          throw new Error('Invalid image format. Please use JPEG, PNG, or WebP images')
        } else if (data.code === 'NETWORK_ERROR') {
          throw new Error('Network error. Please check your connection and try again')
        }
        
        throw new Error(data.error || 'Enhancement failed')
      }

      // Update item to show pending status with animation
      setItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, enhancement_status: 'processing', enhancement_task_id: data.taskId }
          : i
      ))

      // Set active enhancement to show preview
      console.log('Setting active enhancement:', {
        itemId,
        taskId: data.taskId,
        url: item.url,
        type: enhancementType,
        prompt
      })
      setActiveEnhancement({
        itemId,
        taskId: data.taskId,
        url: item.url,
        type: enhancementType,
        prompt
      })

      // Keep the modal open but update status
      // setEnhancementModal({ isOpen: false, itemId: null }) // Don't close yet

      // Update progress
      setEnhancementTasks(prev => new Map(prev).set(itemId, { status: 'polling', progress: 30 }))

      let pollCount = 0
      const maxPolls = 20 // 60 seconds max

      // Poll for completion with progress updates
      const pollInterval = setInterval(async () => {
        pollCount++
        
        // Update progress simulation
        const currentProgress = 30 + (pollCount * 3.5) // Progress from 30 to ~100
        setEnhancementTasks(prev => new Map(prev).set(itemId, { 
          status: 'polling', 
          progress: Math.min(currentProgress, 95) 
        }))

        const statusResponse = await fetch(`${apiEndpoint}?taskId=${data.taskId}`, {
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token || ''}`
          }
        })
        
        const statusData = await statusResponse.json()
        console.log(`Poll ${pollCount}: Task status:`, statusData.task?.status, 'Result URL:', statusData.task?.resultUrl)
        
        if (statusData.success && statusData.task) {
          if (statusData.task.status === 'completed' && statusData.task.resultUrl) {
            // Update progress to 100%
            setEnhancementTasks(prev => new Map(prev).set(itemId, { status: 'completed', progress: 100 }))
            
            // Update item with enhanced version - REPLACES the original
            console.log('Updating item with enhanced URL:', statusData.task.resultUrl)
            setItems(prev => {
              const updated: MoodboardItem[] = prev.map(i => 
                i.id === itemId 
                  ? {
                      ...i,
                      enhanced_url: statusData.task.resultUrl,
                      original_url: i.original_url || i.url,  // Keep original for attribution
                      url: statusData.task.resultUrl,  // REPLACE display URL with enhanced
                      enhancement_status: 'completed' as const,
                      source: 'ai-enhanced' as const,
                      showing_original: false  // Ensure we show enhanced version
                    }
                  : i
              )
              console.log('Items after enhancement:', updated.find(i => i.id === itemId))
              return updated
            })
            
            // Don't update credits here - already deducted on server
            // Just refresh the credit display if needed
            fetchUserCredits()
            
            clearInterval(pollInterval)
            
            // Clean up after showing success and close modal
            setTimeout(() => {
              setEnhancingItems(prev => {
                const newSet = new Set(prev)
                newSet.delete(itemId)
                return newSet
              })
              setEnhancementTasks(prev => {
                const newMap = new Map(prev)
                newMap.delete(itemId)
                return newMap
              })
              // Close the enhancement modal after showing the result
              setEnhancementModal({ isOpen: false, itemId: null })
            }, 2000)
          } else if (statusData.task.status === 'failed') {
            setError(statusData.task.errorMessage || 'Enhancement failed')
            setEnhancementTasks(prev => new Map(prev).set(itemId, { status: 'failed', progress: 0 }))
            clearInterval(pollInterval)
            
            setTimeout(() => {
              setEnhancingItems(prev => {
                const newSet = new Set(prev)
                newSet.delete(itemId)
                return newSet
              })
              setEnhancementTasks(prev => {
                const newMap = new Map(prev)
                newMap.delete(itemId)
                return newMap
              })
            }, 3000)
            
            // Reset item status
            setItems(prev => prev.map(i => 
              i.id === itemId 
                ? { ...i, enhancement_status: 'failed' }
                : i
            ))
          }
        }

        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval)
          setError('Enhancement timed out. Please try again.')
          setEnhancingItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(itemId)
            return newSet
          })
          setEnhancementTasks(prev => {
            const newMap = new Map(prev)
            newMap.delete(itemId)
            return newMap
          })
        }
      }, 3000) // Poll every 3 seconds
      
    } catch (error: any) {
      console.error('Enhancement error details:', {
        error: error,
        message: error.message,
        stack: error.stack,
        itemId,
        enhancementType,
        prompt
      })
      
      // Handle specific error cases
      let errorMessage = error.message || 'Failed to enhance image'
      
      // Check if it's a JSON error response with specific error codes
      try {
        const errorData = JSON.parse(error.message.split(': ')[1] || '{}')
        if (errorData.code === 'ENHANCEMENT_SERVICE_CREDITS') {
          errorMessage = 'Enhancement service has insufficient credits. Please contact support to add credits to your enhancement service account.'
        } else if (errorData.code === 'PLATFORM_CREDITS_LOW') {
          errorMessage = 'Enhancement service is temporarily unavailable due to low platform credits. Please try again later or contact support.'
        } else if (errorData.details) {
          errorMessage = errorData.details
        }
      } catch (parseError) {
        // If parsing fails, use the original error message
      }
      
      setError(errorMessage)
      setEnhancingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
      setEnhancementTasks(prev => {
        const newMap = new Map(prev)
        newMap.delete(itemId)
        return newMap
      })
    }
  }

  // Generate moodboard with AI analysis and enhancements
  const generateMoodboard = async () => {
    if (!user) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      // First save the basic moodboard
      await saveMoodboard()
      
      if (!moodboardId && !gigId) {
        throw new Error('No moodboard or gig ID available')
      }
      
      // Generate AI analysis for the moodboard
      console.log('Generating AI analysis for moodboard...')
      
      // Call AI to analyze the vibe and generate summary
      const aiAnalysisResponse = await fetch('/api/analyze-moodboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase ? (await supabase.auth.getSession()).data.session?.access_token : ''}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            url: item.enhanced_url || item.url,
            caption: item.caption,
            type: item.type,
            source: item.source
          })),
          title: title || 'Untitled Moodboard',
          description: description
        })
      })

      if (!aiAnalysisResponse.ok) {
        console.warn('AI analysis failed, saving without AI features')
      } else {
        const aiData = await aiAnalysisResponse.json()
        
        // Update moodboard with AI-generated data
        if (aiData.success && moodboardId && supabase) {
          const { error: updateError } = await supabase
            .from('moodboards')
            .update({
              vibe_summary: aiData.vibeSummary,
              palette: aiData.palette || palette,
              tags: aiData.tags,
              mood_descriptors: aiData.moodDescriptors,
              updated_at: new Date().toISOString()
            })
            .eq('id', moodboardId)
          
          if (updateError) {
            console.error('Failed to update with AI analysis:', updateError)
          } else {
            console.log('Moodboard enhanced with AI analysis')
            // Update local state
            setAiAnalysis({
              description: aiData.vibeSummary,
              mood: aiData.moodDescriptors?.join(', ')
            })
            if (aiData.palette) {
              setPalette(aiData.palette)
            }
          }
        }
      }
      
      if (moodboardId) {
        onSave?.(moodboardId)
      }
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate AI analysis')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save only the positions of moodboard items (for auto-save during reordering)
  const saveMoodboardPositions = async (reorderedItems: MoodboardItem[]) => {
    if (!user || !moodboardId) return
    
    setIsSavingPositions(true)
    try {
      console.log('Auto-saving item positions...')
      if (!supabase) {
        console.error('Supabase client not available')
        setIsSavingPositions(false)
        return
      }
      
      const { error: updateError } = await supabase
        .from('moodboards')
        .update({
          items: reorderedItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', moodboardId)
      
      if (updateError) {
        console.error('Failed to save positions:', updateError)
        setError('Failed to save arrangement')
      } else {
        console.log('Positions saved successfully')
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      console.error('Error saving positions:', err)
      setError('Failed to save arrangement')
    } finally {
      setIsSavingPositions(false)
    }
  }

  // Save moodboard (legacy method for simple saves)
  const saveMoodboard = async () => {
    if (!user) {
      setError('Please sign in to save your moodboard')
      return
    }
    
    console.log('Saving moodboard with items:', items)
    const enhancedItems = items.filter(i => i.enhanced_url)
    console.log('Enhanced items being saved:', enhancedItems)
    
    setLoading(true)
    setError(null)
    
    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.')
        setLoading(false)
        return
      }
      
      // Get user profile ID
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) throw new Error('Profile not found')
      
      if (moodboardId) {
        // Update existing moodboard
        const { error: updateError } = await supabase
          .from('moodboards')
          .update({
            title: title || 'Untitled Moodboard',
            summary: description,
            items,
            palette,
            tags: selectedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', moodboardId)
        
        if (updateError) throw updateError
        console.log('Moodboard updated successfully with enhanced items')
        setHasUnsavedChanges(false)
        onSave?.(moodboardId)
      } else {
        // Handle template saving with deduplication
        if (saveAsTemplate && existingTemplate?.shouldUpdate) {
          // Update existing similar template
          const { error: updateError } = await supabase
            .from('moodboards')
            .update({
              title: title || 'Untitled Moodboard',
              summary: description,
              items,
              palette,
              tags: selectedTags,
              template_name: templateName || title || 'Untitled Template',
              template_description: description,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTemplate.id)
          
          if (updateError) throw updateError
          console.log('Existing template updated successfully')
          setSuccess('Template updated successfully!')
          onSave?.(existingTemplate.id)
        } else {
          // Create new moodboard/template
          const moodboardData: any = {
            owner_user_id: profile.id,
            title: title || 'Untitled Moodboard',
            summary: description,
            items,
            palette,
            tags: selectedTags,
            is_template: saveAsTemplate,
            template_name: saveAsTemplate ? (templateName || title || 'Untitled Template') : null,
            template_description: saveAsTemplate ? description : null
          }
          
          // Only include gig_id if it's a valid UUID (not a temporary ID) and not saving as template
          if (!saveAsTemplate && gigId && !gigId.startsWith('temp-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gigId)) {
            moodboardData.gig_id = gigId
          }
          
          const { data: newMoodboard, error: createError } = await supabase
            .from('moodboards')
            .insert(moodboardData)
            .select()
            .single()
          
          if (createError) throw createError
          console.log(saveAsTemplate ? 'New template created successfully' : 'New moodboard created successfully')
          setSuccess(saveAsTemplate ? 'Template saved successfully!' : 'Moodboard saved successfully!')
          onSave?.(newMoodboard.id)
        }
      }
    } catch (err: any) {
      console.error('Save error:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      })
      setError(err.message || 'Failed to save moodboard')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className={compactMode ? "space-y-4" : "bg-card rounded-lg shadow-lg p-6"}>
      {!compactMode && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {moodboardId ? 'Edit Moodboard' : 'Create Moodboard'}
          </h2>
        </div>
      )}
      
      {error && (
        <div className={`p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded ${compactMode ? 'mb-4' : 'mb-4'}`}>
          {error}
        </div>
      )}
      
      {compactMode ? (
        // Compact mode: Combined sections
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">Moodboard Details</h3>
            
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Moodboard Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  placeholder="Enter a title for your moodboard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
                  placeholder="Describe the vibe or concept..."
                />
              </div>
            </div>
            
            {/* Vibe & Style Tags */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-medium text-foreground">Vibe & Style Tags</h4>
                  <p className="text-sm text-muted-foreground">Choose up to 3 vibes to define your aesthetic</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  {showTagInput ? 'Cancel' : 'Add Tags'}
                </button>
              </div>
              
              {/* Selected Tags */}
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mb-3">
                  No tags selected yet
                </div>
              )}

              {/* Tag Input/Selection */}
              {showTagInput && (
                <div className="space-y-3">
                  {/* Custom Tag Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Add custom tag..."
                      className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTag()
                        }
                      }}
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={addCustomTag}
                      disabled={!customTag.trim() || selectedTags.includes(customTag.trim()) || selectedTags.length >= 3}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
                    >
                      Add
                    </button>
                  </div>

                  {/* Predefined Options */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Popular vibes (click to add):</p>
                    <div className="flex flex-wrap gap-2">
                      {vibeOptions
                        .filter(vibe => !selectedTags.includes(vibe))
                        .slice(0, 12) // Show first 12 options
                        .map((vibe) => (
                        <button
                          key={vibe}
                          type="button"
                          onClick={() => addTag(vibe)}
                          disabled={selectedTags.length >= 3}
                          className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                        >
                          {vibe}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTags.length >= 3 && (
                    <p className="text-xs text-muted-foreground">
                      Maximum of 3 tags reached. Remove a tag to add more.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Regular mode: Separate sections
        <div className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Moodboard Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring"
                placeholder="Enter a title for your moodboard"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring resize-none"
                placeholder="Describe the vibe or concept..."
              />
            </div>
          </div>
        </div>
      )}
      
      {!compactMode && (
        // Subscription Tier Info (only show in non-compact mode)
        <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1).toLowerCase()} Plan
            </span>
            <span className="text-xs text-primary-600/80 dark:text-primary-400/80">
              {limits?.userUploads || 0} uploads • {limits?.aiEnhancements || 0} AI enhancements
            </span>
          </div>
          <div className="text-xs text-primary-600/80 dark:text-primary-400/80">
            {userCredits ? (
              <>
                <span>Credits: {userCredits.current}/{userCredits.monthly}</span>
                {subscriptionTier !== 'free' && userCredits.current < 3 && (
                  <button
                    type="button"
                    onClick={() => window.open('/credits/purchase', '_blank')}
                    className="ml-2 text-xs text-primary hover:text-primary/80 underline"
                  >
                    Buy more
                  </button>
                )}
                <span> • </span>
              </>
            ) : null}
            {enhancementRequests.length}/{limits?.aiEnhancements || 0} enhancements used
          </div>
        </div>
        </div>
      )}

      {/* Add Media Tabs */}
      <div className={compactMode ? "bg-card rounded-lg border border-border shadow-sm mb-4" : "mb-6"}>
        <div className={compactMode ? "p-5 pb-0" : ""}>
          {compactMode && <h3 className="text-lg font-semibold text-foreground mb-4">Add Images</h3>}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover-text hover-border'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-1" />
              Upload Files
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pexels')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pexels'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover-text hover-border'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search Stock Photos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover-text hover-border'
              }`}
            >
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Saved Images
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'url'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover-text hover-border'
              }`}
            >
              Add from URL
            </button>
            {subscriptionTier !== 'free' && items.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('enhance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'enhance'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover-text hover-border'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                AI Enhance ({enhancementRequests.length}/{limits?.aiEnhancements || 0})
              </button>
            )}
          </nav>
        </div>
        
        <div className="mt-4">
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Choose Files
              </button>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload images or videos (max 10MB each)
              </p>
            </div>
          )}
          
          {activeTab === 'pexels' && (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pexelsQuery}
                  onChange={(e) => setPexelsQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring"
                  placeholder="Search for stock photos... (searches as you type)"
                />
                {pexelsLoading && (
                  <div className="flex items-center px-3 py-2 text-sm text-primary">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Searching...
                  </div>
                )}
              </div>
              
              {/* Filter Controls */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <select
                  value={pexelsFilters.orientation}
                  onChange={(e) => {
                    setPexelsFilters(prev => ({ ...prev, orientation: e.target.value }))
                  }}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
                >
                  <option value="">All orientations</option>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="square">Square</option>
                </select>
                
                <select
                  value={pexelsFilters.size}
                  onChange={(e) => {
                    setPexelsFilters(prev => ({ ...prev, size: e.target.value }))
                  }}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
                >
                  <option value="">All sizes</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                
                <select
                  value={pexelsFilters.color}
                  onChange={(e) => {
                    setPexelsFilters(prev => ({ ...prev, color: e.target.value }))
                  }}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
                >
                  <option value="">All colors</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="turquoise">Turquoise</option>
                  <option value="blue">Blue</option>
                  <option value="violet">Violet</option>
                  <option value="pink">Pink</option>
                  <option value="brown">Brown</option>
                  <option value="black">Black</option>
                  <option value="gray">Gray</option>
                  <option value="white">White</option>
                </select>
              </div>
              
              {pexelsResults.length > 0 && (
                <div className="mt-4">
                  {/* Results count and pagination */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {pexelsResults.length} of {pexelsTotalResults.toLocaleString()} results for "{pexelsQuery}"
                    </div>
                    
                    {/* Pagination controls */}
                    {pexelsTotalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={goToPreviousPage}
                          disabled={pexelsCurrentPage === 1 || pexelsLoading}
                          className="p-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                          {pexelsCurrentPage} of {pexelsTotalPages}
                        </span>
                        
                        <button
                          type="button"
                          onClick={goToNextPage}
                          disabled={pexelsCurrentPage === pexelsTotalPages || pexelsLoading}
                          className="p-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Photo grid - expandable to show more rows */}
                  <div className="grid grid-cols-6 gap-3">
                    {pexelsResults.map((photo) => (
                      <div key={photo.id} className="relative group cursor-pointer" onClick={() => addPexelsImage(photo)}>
                        <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                          <img
                            src={photo.src.medium}
                            alt={photo.alt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground opacity-0 group-hover:opacity-100 font-medium">+ Add</span>
                          </div>
                        </div>
                        {/* Photographer attribution */}
                        <div className="absolute bottom-0 left-0 right-0 bg-backdrop p-2 rounded-b-lg">
                          <div className="text-xs text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            Photo by {photo.photographer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Loading indicator */}
                  {pexelsLoading && (
                    <div className="mt-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading images...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'saved' && (
            <div>
              {savedImagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Loading saved images...</span>
                </div>
              ) : savedImages.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No saved images available</p>
                  <p className="text-sm text-muted-foreground">
                    Generate some images in the playground to see them here
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Select from your saved images
                  </div>
                  
                  {/* Saved images grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                    {savedImages.map((image) => (
                      <div 
                        key={image.id} 
                        className="relative group cursor-pointer" 
                        onClick={() => selectSavedImage(image)}
                      >
                        <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                          <img
                            src={image.image_url}
                            alt={image.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-backdrop opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-foreground opacity-0 group-hover:opacity-100 font-medium">+ Add</span>
                          </div>
                        </div>
                        {/* Image title */}
                        <div className="absolute bottom-0 left-0 right-0 bg-backdrop p-2 rounded-b-lg">
                          <div className="text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            {image.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'url' && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUrlImage()}
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring"
                placeholder="Enter image URL..."
              />
              <button
                onClick={addUrlImage}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}

          {activeTab === 'enhance' && subscriptionTier !== 'free' && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground-600">
                Select images to enhance with AI. Each enhancement costs $0.025.
              </div>

              {/* Provider Selection for Enhancements */}
              <div className="p-4 border border-border-200 rounded-lg bg-muted-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground-900">AI Enhancement Provider</h3>
                    <p className="text-xs text-muted-foreground-600">Choose your preferred AI provider for enhancements</p>
                  </div>
                  <button
                    onClick={() => setShowEnhancementProviderSelector(!showEnhancementProviderSelector)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {showEnhancementProviderSelector ? 'Hide' : 'Change'} Provider
                  </button>
                </div>
                
                {/* Current Provider Display */}
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium">
                      Using: {selectedEnhancementProvider === 'nanobanana' ? '🍌 NanoBanana' : '🌟 Seedream V4'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground-600">
                    {selectedEnhancementProvider === 'seedream' ? '2 credits' : '1 credit'} per enhancement
                  </div>
                </div>

                {/* Provider Selection */}
                {showEnhancementProviderSelector && (
                  <div className="mt-3 p-3 bg-background rounded border">
                    <ImageProviderSelector
                      selectedProvider={selectedEnhancementProvider}
                      onProviderChange={(provider) => {
                        setSelectedEnhancementProvider(provider)
                        setShowEnhancementProviderSelector(false)
                      }}
                      userCredits={userCredits?.current || 0}
                    />
                  </div>
                )}
              </div>
              
              {items.filter(item => item.source !== 'ai-enhanced').map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border border-border-200 rounded-lg">
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={item.caption || ''}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-muted-foreground-900">
                      {item.caption || `Image ${index + 1}`}
                    </div>
                    <div className="text-xs text-muted-foreground-500">
                      {item.width}x{item.height} • {item.source}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-2 py-1 border border-border-300 rounded text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          addEnhancementRequest(item.id, e.target.value, '')
                        }
                      }}
                    >
                      <option value="">Select enhancement...</option>
                      <option value="lighting">Lighting</option>
                      <option value="style">Style</option>
                      <option value="background">Background</option>
                      <option value="mood">Mood</option>
                    </select>
                  </div>
                </div>
              ))}

              {enhancementRequests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground-900">Enhancement Requests</h4>
                  {enhancementRequests.map((request, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-primary-50 rounded">
                      <span className="text-sm text-primary-900">
                        {request.enhancementType}: {request.prompt || 'Default prompt'}
                      </span>
                      <button
                        onClick={() => removeEnhancementRequest(index)}
                        className="text-destructive-500 hover:text-destructive-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
      
      {/* Moodboard Grid */}
      {items.length > 0 && (
        <div className={compactMode ? "bg-card rounded-lg border border-border shadow-sm mb-4" : "mb-6"}>
          {compactMode && <div className="p-5 pb-2"><h3 className="text-lg font-semibold text-foreground mb-4">Your Moodboard</h3></div>}
          {!compactMode && <h3 className="text-lg font-medium text-foreground mb-3">Your Moodboard</h3>}
          
          {/* Color Palette */}
          {palette.length > 0 && (
            <div className={compactMode ? "px-5 pb-2" : "mb-4"}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className={compactMode ? "text-base font-medium text-foreground" : "text-sm text-muted-foreground"}>Color Palette</h4>
                  {compactMode && <p className="text-sm text-muted-foreground">Colors extracted from your images</p>}
                </div>
                {subscriptionTier !== 'free' && (
                  <Button
                    variant={useAIPalette ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseAIPalette(!useAIPalette)}
                    className="text-xs px-2 py-1 h-auto rounded-full"
                  >
                    <Palette className="w-3 h-3" />
                    {useAIPalette ? 'AI Analysis' : 'Basic'}
                    {paletteLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  </Button>
                )}
              </div>
              
              {aiAnalysis && (
                <div className="mb-2 p-2 bg-primary/10 rounded text-xs text-primary border border-primary/20">
                  <p className="font-medium">Mood: {aiAnalysis.mood}</p>
                  <p className="text-primary/80">{aiAnalysis.description}</p>
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                {palette.map((color, index) => (
                  <div key={index} className="group relative">
                    <div
                      className={`rounded-lg shadow-sm border border-border cursor-pointer hover:scale-105 transition-transform ${compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={compactMode ? "px-5 pb-4 mt-8" : "mt-8"}>
            <DraggableMasonryGrid
            items={items}
            onRemove={removeItem}
            onEnhance={(itemId: string) => {
              console.log('Opening enhancement modal for item:', itemId)
              setEnhancementModal({ isOpen: true, itemId })
            }}
            onToggleOriginal={(itemId: string) => {
              setItems(prev => prev.map(i => 
                i.id === itemId 
                  ? { ...i, showing_original: !i.showing_original }
                  : i
              ))
            }}
            onRedoEnhancement={(itemId: string) => {
              // Reset to original and open enhancement modal again
              setItems(prev => prev.map(i => 
                i.id === itemId 
                  ? { 
                      ...i, 
                      url: i.original_url || i.url,
                      enhanced_url: undefined,
                      enhancement_status: undefined,
                      showing_original: false
                    }
                  : i
              ))
              setEnhancementModal({ isOpen: true, itemId })
            }}
            onReorder={(reorderedItems: MoodboardItem[]) => {
              console.log('Items reordered, updating positions')
              setItems(reorderedItems)
              setHasUnsavedChanges(true)
              
              // Auto-save after a short delay to avoid too many saves during rapid reordering
              if (moodboardId) {
                clearTimeout((window as any).reorderSaveTimeout)
                ;(window as any).reorderSaveTimeout = setTimeout(() => {
                  console.log('Auto-saving reordered positions...')
                  saveMoodboardPositions(reorderedItems)
                }, 1500) // Save 1.5 seconds after last reorder
              }
            }}
            enhancingItems={enhancingItems}
            enhancementTasks={enhancementTasks}
            subscriptionTier={subscriptionTier}
            editable={true}
          />
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-end">
        <div className="flex gap-2 items-center">
          {/* Auto-save indicator */}
          {(hasUnsavedChanges || isSavingPositions) && moodboardId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isSavingPositions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Saving arrangement...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="h-2 w-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                  <span>Unsaved changes</span>
                </>
              ) : null}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Button
                variant="outline"
                onClick={saveMoodboard}
                disabled={loading || items.length === 0}
                className="px-4 py-2"
              >
                {loading ? 'Saving...' : 'Save Moodboard'}
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground border border-border text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                Save images and layout only
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-4 border-transparent border-t-popover"></div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => setSaveAsTemplate(!saveAsTemplate)}
              disabled={loading || items.length === 0}
              className={`px-3 py-2 ${saveAsTemplate ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Palette className="w-4 h-4 mr-2" />
              {saveAsTemplate ? 'Template' : 'Save as Template'}
            </Button>
          </div>
          
          {saveAsTemplate && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => handleTemplateNameChange(e.target.value)}
                placeholder="Enter template name..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Save this moodboard as a reusable template for future gigs
              </p>
              
              {/* Template Conflict Warning */}
              {showTemplateConflict && existingTemplate && (
                <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-warning rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning-foreground text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-warning-foreground mb-1">
                        Similar Template Found
                      </p>
                      <p className="text-xs text-warning-foreground/80 mb-2">
                        You have an existing template "{existingTemplate.template_name}" that's {existingTemplate.similarity.score}% similar.
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {existingTemplate.similarity.factors.map((factor: string, index: number) => (
                          <span key={index} className="text-xs bg-warning/20 text-warning-foreground px-2 py-1 rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateName(existingTemplate.template_name + ' (Copy)')
                            setShowTemplateConflict(false)
                          }}
                          className="text-xs h-7"
                        >
                          Rename Current
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Update existing template instead
                            setExistingTemplate((prev: any) => ({ ...prev, shouldUpdate: true }))
                            setShowTemplateConflict(false)
                          }}
                          className="text-xs h-7"
                        >
                          Update Existing
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTemplateConflict(false)}
                          className="text-xs h-7"
                        >
                          Continue Anyway
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Button
                onClick={saveMoodboard}
                disabled={loading || items.length === 0 || !templateName.trim()}
                className="w-full"
              >
                {loading ? 'Saving Template...' : 'Save Template'}
              </Button>
            </div>
          )}
          
          <div className="relative group">
            <Button
              onClick={generateMoodboard}
              disabled={isGenerating || items.length === 0}
              className="px-4 py-2 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Add AI Analysis
                </>
              )}
            </Button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground border border-border text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-50 w-64 shadow-md">
              <div className="font-semibold mb-1">AI analyzes your moodboard to add:</div>
              <ul className="text-xs space-y-0.5">
                <li>• Vibe summary & aesthetic description</li>
                <li>• Mood descriptors (ethereal, bold, etc.)</li>
                <li>• Searchable style tags</li>
                <li>• Color palette extraction</li>
              </ul>
              <div className="mt-2 pt-2 border-t border-border text-xs italic">
                No credits used - doesn't modify images
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-popover"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhancement Modal */}
      {enhancementModal.isOpen && enhancementModal.itemId && (
        <EnhancedEnhancementModal
          isOpen={enhancementModal.isOpen}
          onClose={() => {
            console.log('Modal close requested')
            setEnhancementModal({ isOpen: false, itemId: null })
          }}
          onEnhance={async (type, prompt, provider) => {
            const itemId = enhancementModal.itemId
            if (itemId) {
              console.log('Starting enhancement for item:', itemId, 'type:', type, 'prompt:', prompt, 'provider:', provider)
              // Start the enhancement - modal will close automatically
              await enhanceImage(itemId, type, prompt, provider)
            }
          }}
          onSaveToGallery={handleSaveToGallery}
          itemUrl={items.find(i => i.id === enhancementModal.itemId)?.original_url || items.find(i => i.id === enhancementModal.itemId)?.url || ''}
          itemCaption={items.find(i => i.id === enhancementModal.itemId)?.caption}
          credits={userCredits?.current || 0}
          enhancedUrl={items.find(i => i.id === enhancementModal.itemId)?.enhanced_url}
          isEnhancing={enhancingItems.has(enhancementModal.itemId)}
          userProviderPreference={selectedEnhancementProvider}
        />
      )}

    </div>
  )
}