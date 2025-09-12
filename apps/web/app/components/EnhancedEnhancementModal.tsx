'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Check, AlertCircle, Zap, Palette, Camera, Sun, Settings, Info } from 'lucide-react'
import { ImageProviderSelector } from '@/app/components/ImageProviderSelector'

interface EnhancedEnhancementModalProps {
  isOpen: boolean
  onClose: () => void
  onEnhance: (type: string, prompt: string, provider: 'nanobanana' | 'seedream') => Promise<void>
  itemUrl: string
  itemCaption?: string
  credits: number
  enhancedUrl?: string | null
  isEnhancing?: boolean
  userProviderPreference?: 'nanobanana' | 'seedream'
}

const enhancementTypes = [
  {
    id: 'lighting',
    label: 'Lighting',
    icon: Sun,
    description: 'Adjust lighting and exposure',
    prompts: ['golden hour', 'dramatic shadows', 'soft natural light', 'moody lighting'],
    bestFor: ['nanobanana', 'seedream'] // Both providers good for lighting
  },
  {
    id: 'style',
    label: 'Style',
    icon: Palette,
    description: 'Apply artistic styles',
    prompts: ['film noir', 'watercolor', 'vintage film', 'modern minimalist'],
    bestFor: ['seedream'] // Seedream better for complex styles
  },
  {
    id: 'background',
    label: 'Background',
    icon: Camera,
    description: 'Replace or enhance background',
    prompts: ['urban cityscape', 'beach sunset', 'forest', 'studio backdrop'],
    bestFor: ['seedream'] // Seedream better for background replacement
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: Zap,
    description: 'Change overall atmosphere',
    prompts: ['mysterious', 'uplifting', 'dramatic', 'peaceful'],
    bestFor: ['nanobanana', 'seedream'] // Both providers good for mood
  }
]

export default function EnhancedEnhancementModal({
  isOpen,
  onClose,
  onEnhance,
  itemUrl,
  itemCaption,
  credits,
  enhancedUrl = null,
  isEnhancing = false,
  userProviderPreference = 'nanobanana'
}: EnhancedEnhancementModalProps) {
  const [selectedType, setSelectedType] = useState('lighting')
  const [prompt, setPrompt] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<'nanobanana' | 'seedream'>(userProviderPreference)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'polling' | 'completed' | 'failed'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showProviderSelector, setShowProviderSelector] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('Enhanced enhancement modal opened')
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
      setSelectedProvider(userProviderPreference)
    }
  }, [isOpen, enhancedUrl, isEnhancing, userProviderPreference])

  useEffect(() => {
    if (status === 'processing' || status === 'polling') {
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

  // Auto-select best provider for enhancement type
  useEffect(() => {
    const selectedTypeData = enhancementTypes.find(t => t.id === selectedType)
    if (selectedTypeData?.bestFor.length === 1) {
      setSelectedProvider(selectedTypeData.bestFor[0] as 'nanobanana' | 'seedream')
    }
  }, [selectedType])

  if (!isOpen) return null

  const handleEnhance = async () => {
    if (!prompt.trim() || credits < 1) return

    setIsProcessing(true)
    setStatus('processing')
    setError(null)
    setProgress(10)

    setTimeout(() => {
      setStatus('polling')
      setProgress(30)
    }, 2000)

    try {
      onEnhance(selectedType, prompt, selectedProvider).then(() => {
        // Enhancement started successfully
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

  // Calculate cost based on provider
  const costPerEnhancement = selectedProvider === 'seedream' ? 2 : 1
  const canAfford = credits >= costPerEnhancement

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Image Enhancement</h2>
            <button
              onClick={() => setShowProviderSelector(!showProviderSelector)}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              title="Provider Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Provider Selection */}
          {showProviderSelector && (
            <div className="bg-gray-50 rounded-lg p-4">
              <ImageProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                userCredits={credits}
              />
            </div>
          )}

          {/* Preview */}
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-2">Original</p>
              <img
                src={itemUrl}
                alt={itemCaption || 'Original image'}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {status === 'completed' ? 'Enhanced' : 'Preview'}
              </p>
              <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                {status === 'idle' && !enhancedUrl && (
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Enhancement preview</p>
                  </div>
                )}
                
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
                      <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      {status === 'processing' ? 'Initializing enhancement...' : 'Processing with AI...'}
                    </p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {status === 'completed' && (
                  <div className="text-center">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-green-600">Enhancement completed!</p>
                  </div>
                )}

                {status === 'failed' && (
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">{error || 'Enhancement failed'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhancement Type Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Enhancement Type</p>
            <div className="grid grid-cols-2 gap-3">
              {enhancementTypes.map((type) => {
                const TypeIcon = type.icon
                const isRecommended = type.bestFor.includes(selectedProvider)
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
                    className={`p-3 rounded-lg border-2 transition-all relative ${
                      selectedType === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Best
                      </div>
                    )}
                    <TypeIcon className={`w-5 h-5 mb-1 ${
                      selectedType === type.id ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enhancement Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
              placeholder={`Describe the ${selectedType} enhancement you want...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              rows={3}
            />
            
            {/* Quick prompts */}
            <div className="mt-2 flex flex-wrap gap-2">
              <p className="text-xs text-gray-500 w-full">Quick prompts:</p>
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
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors disabled:opacity-50"
                >
                  {quickPrompt}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Info and Credits */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">
                  Using: {selectedProvider === 'seedream' ? 'Seedream V4' : 'NanoBanana'}
                </span>
              </div>
              <span className="text-sm font-medium text-blue-900">
                Cost: {costPerEnhancement} credit{costPerEnhancement !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Available: {credits} credits
              </span>
              {selectedProvider === 'seedream' && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Info className="w-3 h-3" />
                  Higher quality, 2-5s processing
                </div>
              )}
            </div>
            {!canAfford && (
              <p className="text-xs text-red-600 mt-2">
                Insufficient credits. Need {costPerEnhancement} credit{costPerEnhancement !== 1 ? 's' : ''} for this provider.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Processing time: {selectedProvider === 'seedream' ? '2-5 seconds' : '30-60 seconds'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onClose()
              }}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleEnhance()
              }}
              disabled={!prompt.trim() || !canAfford || isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
