'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Check, AlertCircle, Zap, Copy, Save, RefreshCw, Camera, Users, ShoppingBag, Palette, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '../../../lib/auth-context'

interface PromptAnalysis {
  promptAnalysis: string
  styleAlignment: string
  aspectRatioConsiderations: string
  cinematicAnalysis?: string
  baseImageInsights: string
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  alternativePrompts: string[]
  technicalSuggestions: string[]
  professionalInsights?: string[]
  recommendedPrompt: string
  confidence: number
  estimatedImprovement: string
}

interface AnalysisPersona {
  id: string
  name: string
  description: string
  specialization: string[]
  targetAudience: string[]
  analysisFocus: string[]
  icon: string
}

interface PromptAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl?: string // Optional - for base image analysis
  originalPrompt: string
  style: string
  resolution: string
  aspectRatio: string
  generationMode: 'text-to-image' | 'image-to-image'
  customStylePreset?: any
  cinematicParameters?: any // Cinematic parameters for enhanced analysis
  onApplyPrompt: (improvedPrompt: string) => void
  onSaveAsPreset: (analysis: PromptAnalysis) => void
  subscriptionTier: 'free' | 'plus' | 'pro'
}

// Define analysis personas
const ANALYSIS_PERSONAS: AnalysisPersona[] = [
  {
    id: 'photographer',
    name: 'Professional Photographer',
    description: 'Senior Commercial Photographer with 15+ years experience',
    specialization: ['Commercial Photography', 'Lighting Techniques', 'Composition', 'Technical Excellence'],
    targetAudience: ['Commercial Clients', 'Brands', 'Agencies'],
    analysisFocus: ['Technical Quality', 'Commercial Viability', 'Client Presentation', 'Professional Standards'],
    icon: '📸'
  },
  {
    id: 'creative-director',
    name: 'Creative Director',
    description: 'Creative Director at top advertising agency',
    specialization: ['Brand Storytelling', 'Visual Narrative', 'Campaign Concepts', 'Market Positioning'],
    targetAudience: ['Brands', 'Marketing Teams', 'Campaign Managers'],
    analysisFocus: ['Brand Alignment', 'Emotional Impact', 'Market Positioning', 'Campaign Effectiveness'],
    icon: '🎨'
  },
  {
    id: 'social-media',
    name: 'Social Media Strategist',
    description: 'Social Media Manager at major brands',
    specialization: ['Platform Optimization', 'Engagement Tactics', 'Viral Content', 'Audience Psychology'],
    targetAudience: ['Social Media Managers', 'Content Creators', 'Influencers'],
    analysisFocus: ['Platform Optimization', 'Engagement Potential', 'Viral Potential', 'Audience Appeal'],
    icon: '📱'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Specialist',
    description: 'E-commerce Visual Specialist',
    specialization: ['Product Photography', 'Conversion Optimization', 'Sales Psychology', 'Category Analysis'],
    targetAudience: ['E-commerce Brands', 'Product Managers', 'Sales Teams'],
    analysisFocus: ['Conversion Optimization', 'Product Appeal', 'Sales Performance', 'Category Standards'],
    icon: '🛍️'
  },
  {
    id: 'art-director',
    name: 'Art Director',
    description: 'Art Director for magazines and brands',
    specialization: ['Editorial Design', 'Artistic Vision', 'Trend Analysis', 'Visual Excellence'],
    targetAudience: ['Magazines', 'Editorial Teams', 'Art Collectors'],
    analysisFocus: ['Artistic Excellence', 'Trend Alignment', 'Editorial Quality', 'Visual Impact'],
    icon: '🎭'
  }
]

export default function PromptAnalysisModal({
  isOpen,
  onClose,
  imageUrl,
  originalPrompt,
  style,
  resolution,
  aspectRatio,
  generationMode,
  customStylePreset,
  cinematicParameters,
  onApplyPrompt,
  onSaveAsPreset,
  subscriptionTier
}: PromptAnalysisModalProps) {
  // Debug logging
  console.log('PromptAnalysisModal props:', {
    imageUrl,
    originalPrompt,
    style,
    resolution,
    aspectRatio,
    generationMode,
    hasImageUrl: !!imageUrl,
    imageUrlType: typeof imageUrl,
    hasCinematicParameters: !!cinematicParameters,
    cinematicParameters
  })
  const { showSuccess, showError } = useToast()
  const { session } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<string>('')
  const [selectedPersona, setSelectedPersona] = useState<AnalysisPersona>(ANALYSIS_PERSONAS[0])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAnalysis(null)
      setError(null)
      setSelectedPrompt('')
    }
  }, [isOpen])

  // Validation function to check if all required fields are present
  const validateInputs = () => {
    const validationErrors = []
    
    if (!originalPrompt || originalPrompt.trim().length < 3) {
      validationErrors.push('Prompt must be at least 3 characters long')
    }
    
    if (!style || style.trim().length === 0) {
      validationErrors.push('Style must be selected')
    }
    
    if (!resolution || resolution.trim().length === 0) {
      validationErrors.push('Resolution must be selected')
    }
    
    if (!aspectRatio || aspectRatio.trim().length === 0) {
      validationErrors.push('Aspect ratio must be selected')
    }
    
    if (!generationMode || generationMode.trim().length === 0) {
      validationErrors.push('Generation mode must be selected')
    }

    // For image-to-image mode, require a base image
    if (generationMode === 'image-to-image' && !imageUrl) {
      validationErrors.push('Base image is required for image-to-image generation')
    }

    // Check if prompt is too short for meaningful analysis
    if (originalPrompt && originalPrompt.trim().length < 10) {
      validationErrors.push('Prompt is too short for meaningful analysis. Please provide more details.')
    }

    // Check if prompt is too long (might be inefficient)
    if (originalPrompt && originalPrompt.trim().length > 2000) {
      validationErrors.push('Prompt is too long. Please keep it under 2000 characters for optimal analysis.')
    }

    return validationErrors
  }

  // Check if inputs are valid for button state
  const isInputValid = () => {
    const errors = validateInputs()
    return errors.length === 0
  }

  const handleAnalyze = async () => {
    if (subscriptionTier === 'free') {
      showError('Prompt analysis is only available for Plus and Pro subscribers')
      return
    }

    if (!session?.access_token) {
      showError('Authentication required. Please sign in again.')
      return
    }

    // Validate input data before making API call
    const validationErrors = validateInputs()

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. ') + '.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/playground/analyze-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          baseImageUrl: imageUrl, // Use baseImageUrl for pre-generation analysis
          originalPrompt,
          style,
          resolution,
          aspectRatio,
          generationMode,
          customStylePreset,
          cinematicParameters, // Include cinematic parameters for enhanced analysis
          analysisPersona: selectedPersona
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresUpgrade) {
          setError('Prompt analysis requires Plus or Pro subscription')
        } else {
          setError(result.error || 'Analysis failed')
        }
        return
      }

      setAnalysis(result.analysis)
      setSelectedPrompt(result.analysis.recommendedPrompt)
      showSuccess('Image analysis completed successfully!')
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
      showError('Failed to analyze image')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    showSuccess('Prompt copied to clipboard!')
  }

  const handleApplyPrompt = () => {
    if (selectedPrompt) {
      onApplyPrompt(selectedPrompt)
      onClose()
      showSuccess('Improved prompt applied!')
    }
  }

  const handleSaveAsPreset = () => {
    if (analysis) {
      onSaveAsPreset(analysis)
      showSuccess('Analysis saved as custom preset!')
    }
  }

  if (!isOpen) return null

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
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Prompt Optimizer</h2>
              <p className="text-sm text-gray-600">Professional prompt analysis and optimization</p>
            </div>
            {subscriptionTier !== 'free' && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                {subscriptionTier === 'plus' ? 'Plus' : 'Pro'} Feature
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Top Row - Only show when no base image */}
          {!imageUrl && (
            <div className="w-full">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Prompt</p>
              <div className="relative w-full bg-gray-50 rounded-lg border border-gray-200 p-4" style={{ minHeight: '120px' }}>
                {!analysis && !isAnalyzing && !error && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Prompt to Analyze</span>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {originalPrompt || 'No prompt provided'}
                          </p>
                        </div>
                      </div>
                      <div className="text-center text-gray-500">
                        <p className="text-xs">Ready for AI analysis</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {isAnalyzing && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Analyzing prompt...</p>
                      <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
                    </div>
                  </div>
                )}

                {analysis && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">Analysis Complete!</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(analysis.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {originalPrompt}
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-600 font-medium mb-2">Analysis Failed</p>
                      <p className="text-xs text-red-500">{error}</p>
                      {error.includes('required') && (
                        <p className="text-xs text-gray-500 mt-2">
                          Please fill in all required fields before analyzing.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content Row - Base Image + Generation Context */}
          <div className="flex gap-6">
            {/* Base Image */}
            {imageUrl && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">Base Image</p>
                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: aspectRatio ? aspectRatio.replace(':', '/') : '1/1' }}>
                  <img
                    src={imageUrl}
                    alt="Base image"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Generation Context */}
            <div className={imageUrl ? "flex-1" : "w-full"}>
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Generation Context
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Current settings and parameters for your image generation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prompt Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Original Prompt</span>
                      {originalPrompt && originalPrompt.trim().length < 10 && (
                        <Badge variant="destructive" className="text-xs">Too Short</Badge>
                      )}
                    </div>
                    <div className="bg-white rounded-lg border border-blue-200 p-3">
                      <p className={`text-sm leading-relaxed ${!originalPrompt || originalPrompt.trim().length < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                        {originalPrompt || 'No prompt provided'}
                      </p>
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Style</span>
                        {!style && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <div className={`text-sm font-medium ${!style ? 'text-red-500' : 'text-gray-800'}`}>
                        {style || 'Not selected'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Resolution</span>
                        {!resolution && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <div className={`text-sm font-medium ${!resolution ? 'text-red-500' : 'text-gray-800'}`}>
                        {resolution || 'Not selected'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Aspect Ratio</span>
                        {!aspectRatio && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <div className={`text-sm font-medium ${!aspectRatio ? 'text-red-500' : 'text-gray-800'}`}>
                        {aspectRatio || 'Not selected'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Mode</span>
                        {!generationMode && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <div className={`text-sm font-medium ${!generationMode ? 'text-red-500' : 'text-gray-800'}`}>
                        {generationMode || 'Not selected'}
                      </div>
                    </div>
                  </div>

                  {/* Custom Preset */}
                  {customStylePreset && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-600">Custom Preset</span>
                      <div className="bg-white rounded-lg border border-blue-200 p-2">
                        <div className="text-sm font-medium text-gray-800">{customStylePreset.name}</div>
                      </div>
                    </div>
                  )}

                  {/* Cinematic Parameters */}
                  {cinematicParameters && Object.keys(cinematicParameters).length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-600">Cinematic Parameters</span>
                      <div className="bg-white rounded-lg border border-blue-200 p-2">
                        <div className="space-y-1">
                          {Object.entries(cinematicParameters).map(([key, value]) => {
                            if (value && typeof value === 'string') {
                              return (
                                <div key={key} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    {value.split('-').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                  </span>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analysis Expert */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Analysis Expert
              </CardTitle>
              <CardDescription className="text-sm">
                Choose an expert persona to analyze your prompt from their professional perspective
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPersona.id} onValueChange={(value) => {
                const persona = ANALYSIS_PERSONAS.find(p => p.id === value)
                if (persona) setSelectedPersona(persona)
              }}>
                <SelectTrigger className="bg-white border-purple-200 focus:border-purple-400">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedPersona.icon}</span>
                      <span className="font-medium">{selectedPersona.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ANALYSIS_PERSONAS.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{persona.icon}</span>
                        <div>
                          <div className="font-medium">{persona.name}</div>
                          <div className="text-xs text-gray-500">{persona.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3 h-3 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Specialization</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPersona.specialization.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-3 h-3 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Analysis Focus</span>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {selectedPersona.analysisFocus.join(' • ')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              {/* Prompt Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Prompt Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{analysis.promptAnalysis}</p>
                </CardContent>
              </Card>

              {/* Style Alignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Style Alignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{analysis.styleAlignment}</p>
                </CardContent>
              </Card>

              {/* Aspect Ratio Considerations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Aspect Ratio Considerations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{analysis.aspectRatioConsiderations}</p>
                </CardContent>
              </Card>

              {/* Cinematic Analysis */}
              {analysis.cinematicAnalysis && analysis.cinematicAnalysis !== 'N/A - no cinematic parameters provided' && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-purple-800">Cinematic Analysis</CardTitle>
                    <CardDescription className="text-purple-600">
                      Analysis of cinematic parameters and their impact on the visual narrative
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{analysis.cinematicAnalysis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Base Image Insights */}
              {analysis.baseImageInsights && analysis.baseImageInsights !== 'N/A - no base image provided' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Base Image Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{analysis.baseImageInsights}</p>
                  </CardContent>
                </Card>
              )}

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-green-700">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-700">Areas for Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-500 mt-1">⚠</span>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Improvements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Specific Improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">💡</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Technical Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Technical Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.technicalSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-purple-500 mt-1">🔧</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Professional Insights */}
              {analysis.professionalInsights && analysis.professionalInsights.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-blue-800">
                      {selectedPersona.icon} Professional Insights
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Expert recommendations from {selectedPersona.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.professionalInsights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">💡</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Alternative Prompts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Alternative Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.alternativePrompts.map((prompt, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{prompt}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyPrompt(prompt)}
                        className="flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recommended Prompt */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-sm text-purple-800">Recommended Improved Prompt</CardTitle>
                  <CardDescription className="text-purple-600">
                    Estimated improvement: {analysis.estimatedImprovement}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <textarea
                      value={selectedPrompt}
                      onChange={(e) => setSelectedPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyPrompt(selectedPrompt)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplyPrompt}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Apply & Regenerate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Validation Notice */}
          {subscriptionTier !== 'free' && !isInputValid() && (
            <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-800">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-lg">Missing Required Information</span>
                    <p className="text-sm text-red-700 mt-1">
                      Please fill in all required fields before analyzing your prompt
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {validateInputs().map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Notice */}
          {subscriptionTier === 'free' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-800">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Premium Feature</span>
                </div>
                <p className="text-sm text-orange-700 mt-2">
                  Prompt analysis is only available for Plus and Pro subscribers. 
                  Upgrade to get AI-powered insights for better image generation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {analysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAsPreset}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Preset
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAnalyzing}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            {subscriptionTier !== 'free' && (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !isInputValid()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Optimize Prompt
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
