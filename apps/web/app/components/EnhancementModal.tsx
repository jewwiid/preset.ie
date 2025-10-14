'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Check, AlertCircle, Zap, Palette, Camera, Sun } from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface EnhancementModalProps {
  isOpen: boolean
  onClose: () => void
  onEnhance: (type: string, prompt: string) => Promise<void>
  itemUrl: string
  itemCaption?: string
  credits: number
  enhancedUrl?: string | null
  isEnhancing?: boolean
}

const enhancementTypes = [
  {
    id: 'lighting',
    label: 'Lighting',
    icon: Sun,
    description: 'Adjust lighting and exposure',
    prompts: ['golden hour', 'dramatic shadows', 'soft natural light', 'moody lighting']
  },
  {
    id: 'style',
    label: 'Style',
    icon: Palette,
    description: 'Apply artistic styles',
    prompts: ['film noir', 'watercolor', 'vintage film', 'modern minimalist']
  },
  {
    id: 'background',
    label: 'Background',
    icon: Camera,
    description: 'Replace or enhance background',
    prompts: ['urban cityscape', 'beach sunset', 'forest', 'studio backdrop']
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: Zap,
    description: 'Change overall atmosphere',
    prompts: ['mysterious', 'uplifting', 'dramatic', 'peaceful']
  }
]

export default function EnhancementModal({
  isOpen,
  onClose,
  onEnhance,
  itemUrl,
  itemCaption,
  credits,
  enhancedUrl = null,
  isEnhancing = false
}: EnhancementModalProps) {
  const [selectedType, setSelectedType] = useState('lighting')
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'polling' | 'completed' | 'failed'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('Enhancement modal opened')
      // If we have an enhanced URL, show completed state
      if (enhancedUrl) {
        setStatus('completed')
        setProgress(100)
      } else if (isEnhancing) {
        setStatus('polling')
        setProgress(50)
      } else {
        setStatus('idle')
        setProgress(0)
      }
      setError(null)
      setIsProcessing(isEnhancing)
    } else {
      console.log('Enhancement modal closed')
    }
  }, [isOpen, enhancedUrl, isEnhancing])

  useEffect(() => {
    if (status === 'processing' || status === 'polling') {
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setProgress(prev => {
          if (status === 'processing' && prev >= 30) return 30
          if (status === 'polling' && prev >= 90) return 90
          return prev + Math.random() * 5
        })
      }, 1000)
      return () => clearInterval(interval)
    } else if (status === 'completed') {
      setProgress(100)
    }
  }, [status])

  if (!isOpen) return null

  const handleEnhance = async () => {
    if (!prompt.trim() || credits < 1) return

    setIsProcessing(true)
    setStatus('processing')
    setError(null)
    setProgress(10)

    // Simulate processing stages
    setTimeout(() => {
      setStatus('polling')
      setProgress(30)
    }, 2000)

    try {
      // Call the enhancement function
      // This will handle the actual API call and polling
      onEnhance(selectedType, prompt).then(() => {
        // Enhancement started successfully
        // The modal will stay open showing progress
        // The parent component will close it when done
      }).catch((err) => {
        setStatus('failed')
        setError(err.message || 'Enhancement failed')
        setIsProcessing(false)
      })
    } catch (err: any) {
      setStatus('failed')
      setError(err.message || 'Enhancement failed')
      setIsProcessing(false)
    }
  }

  const selectedTypeData = enhancementTypes.find(t => t.id === selectedType)
  const Icon = selectedTypeData?.icon || Sparkles

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 modal-backdrop"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden popover-fixed"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-muted-foreground-900">AI Image Enhancement</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-muted-foreground hover-text disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Preview */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground-700 mb-2">Original</p>
              <img
                src={itemUrl}
                alt={itemCaption || 'Original image'}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground-700 mb-2">
                {status === 'completed' ? 'Enhanced' : 'Preview'}
              </p>
              <div className="relative w-full h-48 bg-muted-100 rounded-lg flex items-center justify-center">
                {status === 'idle' && !enhancedUrl && (
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground-500">Enhancement preview</p>
                  </div>
                )}
                
                {/* Show enhanced image when available */}
                {enhancedUrl && (
                  <img
                    src={enhancedUrl}
                    alt="Enhanced"
                    className="w-full h-full object-cover rounded-lg"
                    onClick={() => window.open(enhancedUrl, '_blank')}
                    style={{ cursor: 'pointer' }}
                    title="Click to view full size"
                  />
                )}
                
                {(status === 'processing' || status === 'polling') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <LoadingSpinner size="xl" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground-600">
                      {status === 'processing' ? 'Initializing enhancement...' : 'Processing with AI...'}
                    </p>
                    <div className="w-48 h-2 bg-muted-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {status === 'completed' && (
                  <div className="text-center">
                    <Check className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-primary">Enhancement completed!</p>
                  </div>
                )}

                {status === 'failed' && (
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-destructive-500 mx-auto mb-2" />
                    <p className="text-sm text-destructive-600">{error || 'Enhancement failed'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhancement Type Selection */}
          <div>
            <p className="text-sm font-medium text-muted-foreground-700 mb-3">Enhancement Type</p>
            <div className="grid grid-cols-2 gap-3">
              {enhancementTypes.map((type) => {
                const TypeIcon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedType(type.id)
                    }}
                    disabled={isProcessing}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedType === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover-border'
                    } disabled:opacity-50`}
                  >
                    <TypeIcon className={`w-5 h-5 mb-1 ${
                      selectedType === type.id ? 'text-primary-600' : 'text-muted-foreground-600'
                    }`} />
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground-500 mt-1">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
              Enhancement Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
              placeholder={`Describe the ${selectedType} enhancement you want...`}
              className="w-full px-3 py-2 border border-border-300 rounded-lg focus:ring-2 focus:ring-primary-primary focus:border-transparent disabled:opacity-50"
              rows={3}
            />
            
            {/* Quick prompts */}
            <div className="mt-2 flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground-500 w-full">Quick prompts:</p>
              {selectedTypeData?.prompts.map((quickPrompt) => (
                <button
                  key={quickPrompt}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setPrompt(quickPrompt)
                  }}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-medium btn-secondary rounded-md disabled:opacity-50"
                >
                  {quickPrompt}
                </button>
              ))}
            </div>
          </div>

          {/* Credits Info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-primary-900">Enhancement Cost: 1 credit</span>
              </div>
              <span className="text-sm font-medium text-primary-900">
                Available: {credits} credits
              </span>
            </div>
            {credits < 1 && (
              <p className="text-xs text-destructive-600 mt-2">
                Insufficient credits. Please upgrade your plan or purchase more credits.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-200 flex items-center justify-between">
          <p className="text-xs text-muted-foreground-500">
            Processing time: 30-60 seconds
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onClose()
              }}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium btn-secondary rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleEnhance()
              }}
              disabled={!prompt.trim() || credits < 1 || isProcessing}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Enhance Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}