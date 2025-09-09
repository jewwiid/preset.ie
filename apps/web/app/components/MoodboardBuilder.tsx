'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Upload, Search, Sparkles, Save, Loader2, X, Palette, Clock, CheckCircle } from 'lucide-react'
import { extractPaletteFromImages } from '../../lib/color-extractor'
import { extractAIPaletteFromImages } from '../../lib/ai-color-extractor'
import EnhancementModal from './EnhancementModal'
import EnhancementPreview from './EnhancementPreview'
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
}

export default function MoodboardBuilder({ gigId, moodboardId, onSave, onCancel }: MoodboardBuilderProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [items, setItems] = useState<MoodboardItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'pexels' | 'url' | 'enhance'>('upload')
  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsResults, setPexelsResults] = useState<any[]>([])
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
          setDescription(data.description || '')
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
        const analysis = await extractAIPaletteFromImages(imageUrls, title || 'fashion moodboard')
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
  const searchPexels = async () => {
    if (!pexelsQuery.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: pexelsQuery })
      })
      
      if (!response.ok) throw new Error('Failed to search Pexels')
      
      const data = await response.json()
      setPexelsResults(data.photos || [])
    } catch (err: any) {
      console.error('Pexels search error:', err)
      setError('Failed to search images')
    } finally {
      setLoading(false)
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

      // Close the enhancement modal
      setEnhancementModal({ isOpen: false, itemId: null })

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
            
            // Clean up after showing success
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

  // Generate moodboard with AI enhancements
  const generateMoodboard = async () => {
    if (!user || !gigId) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-moodboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          gigId,
          title: title || 'Untitled Moodboard',
          pexelsQuery: pexelsQuery || undefined,
          userUploadIds: items.filter(item => item.source === 'upload').map(item => item.id),
          enhancementRequests,
          palette
        })
      })

      const data = await response.json()

      if (data.success) {
        onSave?.(data.moodboard.id)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate moodboard')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save moodboard (legacy method for simple saves)
  const saveMoodboard = async () => {
    if (!user) return
    
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
            description,
            items,
            palette,
            updated_at: new Date().toISOString()
          })
          .eq('id', moodboardId)
        
        if (updateError) throw updateError
        console.log('Moodboard updated successfully with enhanced items')
        onSave?.(moodboardId)
      } else {
        // Create new moodboard
        const { data: newMoodboard, error: createError } = await supabase
          .from('moodboards')
          .insert({
            owner_user_id: profile.id,
            gig_id: gigId,
            title: title || 'Untitled Moodboard',
            description,
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {moodboardId ? 'Edit Moodboard' : 'Create Moodboard'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe the vibe or concept..."
            />
          </div>
        </div>
      </div>
      
      {/* Subscription Tier Info */}
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

      {/* Add Media Tabs */}
      <div className="mb-6">
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
                  onKeyDown={(e) => e.key === 'Enter' && searchPexels()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Search for stock photos..."
                />
                <button
                  type="button"
                  onClick={searchPexels}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  Search
                </button>
              </div>
              
              {pexelsResults.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pexelsResults.map((photo) => (
                    <div key={photo.id} className="relative group cursor-pointer" onClick={() => addPexelsImage(photo)}>
                      <img
                        src={photo.src.medium}
                        alt={photo.alt}
                        className="w-full h-40 object-contain rounded bg-gray-100"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100">+ Add</span>
                      </div>
                    </div>
                  ))}
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
      
      {/* Moodboard Grid */}
      {items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Your Moodboard</h3>
          
          {/* Color Palette */}
          {palette.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Extracted Color Palette:</p>
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
              
              <div className="flex gap-2">
                {palette.map((color, index) => (
                  <div key={index} className="group relative">
                    <div
                      className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable={!enhancingItems.has(item.id)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="relative group cursor-move"
              >
                {item.type === 'image' ? (
                  <img
                    src={
                      item.showing_original && item.original_url 
                        ? item.original_url 
                        : item.enhanced_url  // Always show enhanced if available
                        ? item.enhanced_url
                        : (item.thumbnail_url || item.url)
                    }
                    alt={item.caption || ''}
                    className={`w-full h-48 object-contain rounded bg-gray-100 ${
                      enhancingItems.has(item.id) ? 'opacity-50' : ''
                    }`}
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-48 object-contain rounded bg-gray-100"
                    muted
                  />
                )}
                
                {/* Enhancement status indicator with progress */}
                {enhancingItems.has(item.id) && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded flex flex-col items-center justify-center">
                    {(() => {
                      const task = enhancementTasks.get(item.id)
                      if (task?.status === 'completed') {
                        return (
                          <>
                            <CheckCircle className="w-8 h-8 text-green-400 mb-1" />
                            <span className="text-xs text-white">Enhanced!</span>
                          </>
                        )
                      } else if (task?.status === 'failed') {
                        return (
                          <>
                            <X className="w-8 h-8 text-red-400 mb-1" />
                            <span className="text-xs text-white">Failed</span>
                          </>
                        )
                      } else {
                        return (
                          <>
                            <div className="relative">
                              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                              {task && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">
                                    {Math.round(task.progress)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="w-20 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-purple-400 transition-all duration-500"
                                style={{ width: `${task?.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-300 mt-1">
                              {task?.status === 'processing' ? 'Initializing...' : 'Enhancing...'}
                            </span>
                          </>
                        )
                      }
                    })()}
                  </div>
                )}
                
                {item.enhancement_status === 'completed' && !enhancingItems.has(item.id) && (
                  <>
                    <div className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {item.showing_original ? 'Original' : 'Enhanced'}
                    </div>
                    
                    {/* Before/After Toggle */}
                    {item.original_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setItems(prev => prev.map(i => 
                            i.id === item.id 
                              ? { ...i, showing_original: !i.showing_original }
                              : i
                          ))
                        }}
                        className="absolute top-1 right-1 bg-white bg-opacity-90 text-gray-700 rounded px-2 py-0.5 text-xs hover:bg-opacity-100 transition-all whitespace-nowrap"
                        title={item.showing_original ? "Show Enhanced" : "Show Original"}
                      >
                        {item.showing_original ? "Enhanced" : "Original"}
                      </button>
                    )}
                    
                    {/* Redo Enhancement */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        // Reset to original and open enhancement modal again
                        setItems(prev => prev.map(i => 
                          i.id === item.id 
                            ? { 
                                ...i, 
                                url: i.original_url || i.url,
                                enhanced_url: undefined,
                                enhancement_status: undefined,
                                showing_original: false
                              }
                            : i
                        ))
                        setEnhancementModal({ isOpen: true, itemId: item.id })
                      }}
                      className="absolute bottom-1 right-1 bg-orange-500 text-white rounded px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-600 whitespace-nowrap"
                      title="Redo Enhancement"
                    >
                      Redo
                    </button>
                  </>
                )}
                
                {/* Enhancement button for Plus/Pro users */}
                {subscriptionTier !== 'free' && item.type === 'image' && !item.enhanced_url && !enhancingItems.has(item.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      console.log('Opening enhancement modal for item:', item.id)
                      setEnhancementModal({ isOpen: true, itemId: item.id })
                    }}
                    className="absolute bottom-1 left-1 bg-purple-500 text-white rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 whitespace-nowrap"
                    title="Enhance with AI"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Enhance
                  </button>
                )}
                
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                
                {/* Attribution for Pexels or original source */}
                {(item.photographer || item.original_url) && (
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                    📷 {item.photographer || 'Original'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex gap-2">
          <button
            onClick={saveMoodboard}
            disabled={loading || items.length === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Simple'}
          </button>
          <button
            onClick={generateMoodboard}
            disabled={isGenerating || items.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </button>
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
          itemUrl={items.find(i => i.id === enhancementModal.itemId)?.url || ''}
          itemCaption={items.find(i => i.id === enhancementModal.itemId)?.caption}
          credits={userCredits?.current || 0}
        />
      )}

      {/* Enhancement Preview - Full Screen Loading */}
      {activeEnhancement && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            <EnhancementPreview
              originalImage={activeEnhancement.url}
              taskId={activeEnhancement.taskId}
              enhancementType={activeEnhancement.type}
              prompt={activeEnhancement.prompt}
              onComplete={async (resultUrl) => {
                console.log('Enhancement completed with URL:', resultUrl)
                // Update the item with the enhanced URL but KEEP original
                setItems(prev => prev.map(i => 
                  i.id === activeEnhancement.itemId 
                    ? { 
                        ...i, 
                        enhanced_url: resultUrl,
                        original_url: i.original_url || i.url,  // Store original if not already stored
                        url: resultUrl, // Display enhanced version by default
                        enhancement_status: 'completed',
                        source: 'ai-enhanced' as const,
                        showing_original: false  // Track which version is showing
                      }
                    : i
                ))
                setEnhancingItems(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(activeEnhancement.itemId)
                  return newSet
                })
                setEnhancementTasks(prev => {
                  const newMap = new Map(prev)
                  newMap.delete(activeEnhancement.itemId)
                  return newMap
                })
                // Refresh credits display
                fetchUserCredits()
                // Save the updated moodboard to database
                if (moodboardId) {
                  saveMoodboard()
                }
                // Close preview after a short delay
                setTimeout(() => {
                  setActiveEnhancement(null)
                }, 2000)
              }}
              onError={(error) => {
                console.error('Enhancement error:', error)
                setError(`Enhancement failed: ${error}`)
                setEnhancingItems(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(activeEnhancement.itemId)
                  return newSet
                })
                setEnhancementTasks(prev => {
                  const newMap = new Map(prev)
                  newMap.delete(activeEnhancement.itemId)
                  return newMap
                })
                setActiveEnhancement(null)
              }}
            />
            
            {/* Close button */}
            <button
              onClick={() => setActiveEnhancement(null)}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel Enhancement
            </button>
          </div>
        </div>
      )}
    </div>
  )
}