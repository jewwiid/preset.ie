'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Upload, Search, Sparkles, Save, Loader2, X, Palette, Clock, CheckCircle } from 'lucide-react'
import { extractPaletteFromImages } from '../../lib/color-extractor'
import { extractAIPaletteFromImages } from '../../lib/ai-color-extractor'
import EnhancementModal from './EnhancementModal'
import DraggableMasonryGrid from './DraggableMasonryGrid'
import { optimizeImageForAPI, preloadImages, estimateProcessingTime, compressImageClientSide } from '../../lib/image-optimizer'

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
}

interface MoodboardBuilderProps {
  gigId?: string
  moodboardId?: string
  onSave?: (moodboardId: string) => void
  onCancel?: () => void
  compactMode?: boolean
}

export default function MoodboardBuilder({ gigId, moodboardId, onSave, onCancel, compactMode = false }: MoodboardBuilderProps) {
  const { user } = useAuth()
  
  // Gig data for comprehensive AI analysis
  const [gigData, setGigData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [items, setItems] = useState<MoodboardItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'pexels' | 'url' | 'enhance'>('upload')
  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsResults, setPexelsResults] = useState<any[]>([])
  const [pexelsPage, setPexelsPage] = useState(1)
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0)
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
  
  // Fetch user's subscription tier and credits on mount
  useEffect(() => {
    fetchSubscriptionTier()
    if (user) {
      fetchUserCredits()
    }
  }, [user])

  // Fetch gig data for comprehensive AI analysis
  useEffect(() => {
    const fetchGigData = async () => {
      if (!gigId || !user) return

      try {
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
          per_page: 12,
          ...(pexelsFilters.orientation && { orientation: pexelsFilters.orientation }),
          ...(pexelsFilters.size && { size: pexelsFilters.size }),
          ...(pexelsFilters.color && { color: pexelsFilters.color })
        })
      })
      
      if (!response.ok) throw new Error('Failed to search Pexels')
      
      const data = await response.json()
      
      if (page === 1) {
        setPexelsResults(data.photos || [])
      } else {
        setPexelsResults(prev => [...prev, ...(data.photos || [])])
      }
      
      setPexelsPage(data.page || page)
      setPexelsTotalResults(data.total_results || 0)
    } catch (err: any) {
      console.error('Pexels search error:', err)
      setError('Failed to search images')
    } finally {
      setPexelsLoading(false)
    }
  }
  
  // Load more Pexels results
  const loadMorePexels = () => {
    if (!pexelsLoading && pexelsResults.length < pexelsTotalResults) {
      searchPexels(pexelsPage + 1)
    }
  }
  
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
  const addEnhancementRequest = (imageId: string, enhancementType: string, prompt: string) => {
    const maxEnhancements = limits?.aiEnhancements || 0
    if (enhancementRequests.length >= maxEnhancements) {
      setError(`AI enhancements limit reached: ${maxEnhancements}`)
      return
    }

    const newRequest: EnhancementRequest = { 
      imageId, 
      enhancementType: enhancementType as 'lighting' | 'style' | 'background' | 'mood' | 'custom', 
      prompt 
    }
    setEnhancementRequests(prev => [...prev, newRequest])
  }

  // Remove AI enhancement request
  const removeEnhancementRequest = (index: number) => {
    setEnhancementRequests(prev => prev.filter((_, i) => i !== index))
  }

  // Enhance image with NanoBanana and replace in moodboard
  const enhanceImage = async (itemId: string, enhancementType: string, prompt: string) => {
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
      const USE_MOCK = false; // Using real NanoBanana API
      const apiEndpoint = USE_MOCK ? '/api/enhance-image-mock' : '/api/enhance-image';
      console.log('Calling enhancement API:', apiEndpoint, {
        inputImageUrl: optimizedUrl,
        enhancementType,
        prompt,
        moodboardId
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
          moodboardId
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
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
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
        if (aiData.success && moodboardId) {
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
            updated_at: new Date().toISOString()
          })
          .eq('id', moodboardId)
        
        if (updateError) throw updateError
        console.log('Moodboard updated successfully with enhanced items')
        setHasUnsavedChanges(false)
        onSave?.(moodboardId)
      } else {
        // Create new moodboard
        const { data: newMoodboard, error: createError } = await supabase
          .from('moodboards')
          .insert({
            owner_user_id: profile.id,
            gig_id: gigId,
            title: title || 'Untitled Moodboard',
            summary: description,
            items,
            palette,
            is_public: false
          })
          .select()
          .single()
        
        if (createError) throw createError
        console.log('New moodboard created successfully with enhanced items')
        onSave?.(newMoodboard.id)
      }
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save moodboard')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className={compactMode ? "space-y-4" : "bg-white rounded-lg shadow-lg p-6"}>
      {!compactMode && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {moodboardId ? 'Edit Moodboard' : 'Create Moodboard'}
          </h2>
        </div>
      )}
      
      {error && (
        <div className={`p-3 bg-red-100 border border-red-400 text-red-700 rounded ${compactMode ? 'mb-4' : 'mb-4'}`}>
          {error}
        </div>
      )}
      
      {compactMode ? (
        // Compact mode: Combined sections
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Moodboard Details</h3>
            
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moodboard Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter a title for your moodboard"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Describe the vibe or concept..."
                />
              </div>
            </div>
            
            {/* Vibe & Style Tags Placeholder - for future implementation */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-medium text-gray-900">Vibe & Style Tags</h4>
                  <p className="text-sm text-gray-500">Choose up to 3 vibes to define your aesthetic</p>
                </div>
                <button
                  type="button"
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Add Tags
                </button>
              </div>
              <div className="text-xs text-gray-400">
                No tags selected yet
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Regular mode: Separate sections
        <div className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moodboard Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter a title for your moodboard"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Describe the vibe or concept..."
              />
            </div>
          </div>
        </div>
      )}
      
      {!compactMode && (
        // Subscription Tier Info (only show in non-compact mode)
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1).toLowerCase()} Plan
            </span>
            <span className="text-xs text-blue-600">
              {limits?.userUploads || 0} uploads • {limits?.aiEnhancements || 0} AI enhancements
            </span>
          </div>
          <div className="text-xs text-blue-600">
            {userCredits ? (
              <>
                <span>Credits: {userCredits.current}/{userCredits.monthly}</span>
                {subscriptionTier !== 'free' && userCredits.current < 3 && (
                  <button
                    type="button"
                    onClick={() => window.open('/credits/purchase', '_blank')}
                    className="ml-2 text-xs text-purple-600 hover:text-purple-700 underline"
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
      <div className={compactMode ? "bg-white rounded-lg border border-gray-200 shadow-sm mb-4" : "mb-6"}>
        <div className={compactMode ? "p-5 pb-0" : ""}>
          {compactMode && <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Images</h3>}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1" />
              Search Stock Photos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'url'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                Choose Files
              </button>
              <p className="mt-2 text-sm text-gray-500">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPexelsPage(1)
                      searchPexels(1)
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Search for stock photos..."
                />
                <button
                  type="button"
                  onClick={() => {
                    setPexelsPage(1)
                    searchPexels(1)
                  }}
                  disabled={pexelsLoading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pexelsLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {/* Filter Controls */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <select
                  value={pexelsFilters.orientation}
                  onChange={(e) => {
                    setPexelsFilters(prev => ({ ...prev, orientation: e.target.value }))
                    if (pexelsQuery.trim()) {
                      setPexelsPage(1)
                      searchPexels(1)
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                    if (pexelsQuery.trim()) {
                      setPexelsPage(1)
                      searchPexels(1)
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                    if (pexelsQuery.trim()) {
                      setPexelsPage(1)
                      searchPexels(1)
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
                  {/* Results count */}
                  <div className="mb-4 text-sm text-gray-600">
                    Showing {pexelsResults.length} of {pexelsTotalResults.toLocaleString()} results for "{pexelsQuery}"
                  </div>
                  
                  {/* Photo grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {pexelsResults.map((photo) => (
                      <div key={photo.id} className="relative group cursor-pointer" onClick={() => addPexelsImage(photo)}>
                        <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                          <img
                            src={photo.src.medium}
                            alt={photo.alt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium">+ Add</span>
                          </div>
                        </div>
                        {/* Photographer attribution */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                          <div className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            Photo by {photo.photographer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load more button */}
                  {pexelsResults.length < pexelsTotalResults && (
                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={loadMorePexels}
                        disabled={pexelsLoading}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                      >
                        {pexelsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          `Load more (${(pexelsTotalResults - pexelsResults.length).toLocaleString()} remaining)`
                        )}
                      </button>
                    </div>
                  )}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter image URL..."
              />
              <button
                onClick={addUrlImage}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          )}

          {activeTab === 'enhance' && subscriptionTier !== 'free' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Select images to enhance with AI. Each enhancement costs $0.025.
              </div>
              
              {items.filter(item => item.source !== 'ai-enhanced').map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                  <img
                    src={item.thumbnail_url || item.url}
                    alt={item.caption || ''}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {item.caption || `Image ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.width}x{item.height} • {item.source}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
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
                  <h4 className="font-medium text-gray-900">Enhancement Requests</h4>
                  {enhancementRequests.map((request, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <span className="text-sm text-blue-900">
                        {request.enhancementType}: {request.prompt || 'Default prompt'}
                      </span>
                      <button
                        onClick={() => removeEnhancementRequest(index)}
                        className="text-red-500 hover:text-red-700"
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
        <div className={compactMode ? "bg-white rounded-lg border border-gray-200 shadow-sm mb-4" : "mb-6"}>
          {compactMode && <div className="p-5 pb-2"><h3 className="text-lg font-semibold text-gray-900 mb-4">Your Moodboard</h3></div>}
          {!compactMode && <h3 className="text-lg font-medium text-gray-900 mb-3">Your Moodboard</h3>}
          
          {/* Color Palette */}
          {palette.length > 0 && (
            <div className={compactMode ? "px-5 pb-2" : "mb-4"}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className={compactMode ? "text-base font-medium text-gray-900" : "text-sm text-gray-600"}>Color Palette</h4>
                  {compactMode && <p className="text-sm text-gray-500">Colors extracted from your images</p>}
                </div>
                {subscriptionTier !== 'free' && (
                  <button
                    onClick={() => setUseAIPalette(!useAIPalette)}
                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
                      useAIPalette 
                        ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                    {useAIPalette ? 'AI Analysis' : 'Basic'}
                    {paletteLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                  </button>
                )}
              </div>
              
              {aiAnalysis && (
                <div className="mb-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                  <p className="font-medium">Mood: {aiAnalysis.mood}</p>
                  <p className="text-purple-600">{aiAnalysis.description}</p>
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                {palette.map((color, index) => (
                  <div key={index} className="group relative">
                    <div
                      className={`rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:scale-105 transition-transform ${compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={compactMode ? "px-5 pb-4" : ""}>
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
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isSavingPositions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span>Saving arrangement...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span>Unsaved changes</span>
                </>
              ) : null}
            </div>
          )}
          
          <div className="relative group">
            <button
              onClick={saveMoodboard}
              disabled={loading || items.length === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Moodboard'}
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Save images and layout only
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <button
              onClick={generateMoodboard}
              disabled={isGenerating || items.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
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
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal z-50 w-64">
              <div className="font-semibold mb-1">AI analyzes your moodboard to add:</div>
              <ul className="text-xs space-y-0.5">
                <li>• Vibe summary & aesthetic description</li>
                <li>• Mood descriptors (ethereal, bold, etc.)</li>
                <li>• Searchable style tags</li>
                <li>• Color palette extraction</li>
              </ul>
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs italic">
                No credits used - doesn't modify images
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhancement Modal */}
      {enhancementModal.isOpen && enhancementModal.itemId && (
        <EnhancementModal
          isOpen={enhancementModal.isOpen}
          onClose={() => {
            console.log('Modal close requested')
            setEnhancementModal({ isOpen: false, itemId: null })
          }}
          onEnhance={async (type, prompt) => {
            const itemId = enhancementModal.itemId
            if (itemId) {
              console.log('Starting enhancement for item:', itemId, 'type:', type, 'prompt:', prompt)
              // Start the enhancement - modal will close automatically
              await enhanceImage(itemId, type, prompt)
            }
          }}
          itemUrl={items.find(i => i.id === enhancementModal.itemId)?.original_url || items.find(i => i.id === enhancementModal.itemId)?.url || ''}
          itemCaption={items.find(i => i.id === enhancementModal.itemId)?.caption}
          credits={userCredits?.current || 0}
          enhancedUrl={items.find(i => i.id === enhancementModal.itemId)?.enhanced_url}
          isEnhancing={enhancingItems.has(enhancementModal.itemId)}
        />
      )}

    </div>
  )
}