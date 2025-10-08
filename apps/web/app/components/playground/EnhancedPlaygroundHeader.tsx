'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Wand2, Edit3, Layers, Video, History, Zap, Users, Target, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface EnhancedPlaygroundHeaderProps {
  userCredits: number
  userSubscriptionTier: string
  activeTab: string
  loading: boolean
}

interface TabInfo {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  features: string[]
  creditCost: string
  color: string
  gradient: string
}

const tabInfo: Record<string, TabInfo> = {
  generate: {
    id: 'generate',
    name: 'Generate',
    icon: Wand2,
    description: 'Create stunning AI-generated images from text prompts',
    features: ['AI Image Creation', 'Style Presets', 'Custom Sizes', 'High Quality'],
    creditCost: '1-2 credits per image',
    color: 'text-primary',
    gradient: 'bg-primary'
  },
  edit: {
    id: 'edit',
    name: 'Edit',
    icon: Edit3,
    description: 'Transform and enhance your images with advanced AI editing',
    features: ['Smart Editing', 'Style Transfer', 'Object Removal', 'Background Swap'],
    creditCost: '1-4 credits per edit',
    color: 'text-primary',
    gradient: 'bg-primary'
  },
  batch: {
    id: 'batch',
    name: 'Batch',
    icon: Layers,
    description: 'Process multiple images simultaneously with consistent edits',
    features: ['Bulk Processing', 'Consistent Results', 'Time Efficient', 'Queue Management'],
    creditCost: '3 credits per image',
    color: 'text-primary',
    gradient: 'bg-primary'
  },
  video: {
    id: 'video',
    name: 'Video',
    icon: Video,
    description: 'Bring your images to life with AI-generated video animations',
    features: ['Image to Video', 'Motion Control', 'Duration Settings', 'Multiple Resolutions'],
    creditCost: '8-10 credits per video',
    color: 'text-primary-600',
    gradient: 'bg-primary'
  },
  prompts: {
    id: 'prompts',
    name: 'Prompts',
    icon: BookOpen,
    description: 'Create, organize, and manage your custom style prompts',
    features: ['Custom Prompts', 'Style Presets', 'Search & Filter', 'Public Sharing'],
    creditCost: 'Free management',
    color: 'text-primary',
    gradient: 'bg-primary'
  },
  history: {
    id: 'history',
    name: 'History',
    icon: History,
    description: 'Access and manage your previous generations and projects',
    features: ['Project History', 'Quick Reuse', 'Export Options', 'Organization Tools'],
    creditCost: 'Free access',
    color: 'text-muted-foreground',
    gradient: 'bg-muted'
  }
}

export default function EnhancedPlaygroundHeader({ 
  userCredits, 
  userSubscriptionTier, 
  activeTab, 
  loading 
}: EnhancedPlaygroundHeaderProps) {
  const [creditsAnimation, setCreditsAnimation] = useState(false)
  const [currentTabInfo, setCurrentTabInfo] = useState<TabInfo>(tabInfo[activeTab])

  useEffect(() => {
    setCurrentTabInfo(tabInfo[activeTab])
  }, [activeTab])

  useEffect(() => {
    if (loading) {
      setCreditsAnimation(true)
      const timer = setTimeout(() => setCreditsAnimation(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  const getCreditStatus = () => {
    if (userCredits >= 50) return { status: 'excellent', color: 'text-primary', bgColor: 'bg-primary/5' }
    if (userCredits >= 20) return { status: 'good', color: 'text-primary', bgColor: 'bg-primary/5' }
    if (userCredits >= 10) return { status: 'low', color: 'text-primary', bgColor: 'bg-primary/5' }
    return { status: 'critical', color: 'text-destructive', bgColor: 'bg-destructive/5' }
  }

  const creditStatus = getCreditStatus()
  const IconComponent = currentTabInfo.icon

  return (
    <>
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.6), 0 0 30px rgba(147, 51, 234, 0.4); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-6 mb-8">
      {/* Main Header */}
      <div className="relative overflow-hidden rounded-2xl bg-background border border-border shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-primary animate-pulse"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            {/* Left Section - Title and Description */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${currentTabInfo.gradient} shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Preset Playground
                  </h1>
                  <p className="text-muted-foreground text-lg mb-2">
                    {currentTabInfo.description}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional AI image generation with advanced editing tools, batch processing, and video creation capabilities.
                  </p>
                </div>
              </div>
              
              {/* Active Tab Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentTabInfo.features.map((feature, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="bg-background/80 text-foreground border-border hover:bg-background hover:shadow-md transition-all duration-200 cursor-default"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>

              {/* Quick Tips */}
              <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-primary/10 mt-0.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Quick Tip</p>
                    <p className="text-xs text-muted-foreground">
                      {currentTabInfo.id === 'generate' && "Start with simple prompts and add details gradually for best results."}
                      {currentTabInfo.id === 'edit' && "Upload a base image first, then use the editing tools to transform it."}
                      {currentTabInfo.id === 'batch' && "Select multiple images to process them efficiently in batches."}
                      {currentTabInfo.id === 'video' && "Generate images first, then convert them to videos with motion effects."}
                      {currentTabInfo.id === 'prompts' && "Create and save custom prompts for consistent style across generations."}
                      {currentTabInfo.id === 'history' && "Browse your previous generations and reuse successful prompts."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Credits */}
            <div className="flex flex-col items-end gap-6">
              {/* Credits Display */}
              <Card className={`${creditStatus.bgColor} border-0 shadow-sm hover:shadow-md transition-all duration-300`}>
                <CardContent className="p-4">
                  {/* Main Credits Display */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg bg-background/80 ${creditsAnimation ? 'animate-pulse animate-glow' : ''}`}>
                      <Sparkles className={`h-6 w-6 ${creditStatus.color}`} />
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${creditStatus.color}`}>
                        {userCredits}
                      </div>
                      <div className="text-xs text-muted-foreground">Credits</div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${creditStatus.status === 'critical' ? 'bg-destructive' : creditStatus.status === 'low' ? 'bg-primary-500' : 'bg-primary'}`}></div>
                    <span className="text-xs font-medium text-muted-foreground capitalize">{creditStatus.status}</span>
                  </div>

                  {/* Quick Info */}
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">{currentTabInfo.creditCost}</div>
                    <div className="text-xs font-medium text-foreground">
                      {(() => {
                        if (currentTabInfo.id === 'history' || currentTabInfo.id === 'prompts') {
                          return '∞';
                        }
                        const costPerGeneration = {
                          'generate': 2,
                          'edit': 3,
                          'batch': 3,
                          'video': 9
                        }[currentTabInfo.id] || 0;
                        return Math.floor(userCredits / costPerGeneration);
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Tier */}
              <Badge 
                variant="outline" 
                className="bg-background/80 text-foreground border-border"
              >
                {userSubscriptionTier} Plan
              </Badge>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

