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
    features: ['Text-to-image generation', 'Multiple style options', 'Custom resolutions', 'Batch generation'],
    creditCost: '2 credits per image',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-500'
  },
  edit: {
    id: 'edit',
    name: 'Edit',
    icon: Edit3,
    description: 'Transform and enhance your images with advanced AI editing',
    features: ['Inpainting & outpainting', 'Style transfer', 'Object removal', 'Background changes'],
    creditCost: '1-4 credits per edit',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-cyan-500'
  },
  batch: {
    id: 'batch',
    name: 'Batch',
    icon: Layers,
    description: 'Process multiple images simultaneously with consistent edits',
    features: ['Bulk processing', 'Consistent results', 'Time efficient', 'Queue management'],
    creditCost: '3 credits per image',
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500'
  },
  video: {
    id: 'video',
    name: 'Video',
    icon: Video,
    description: 'Bring your images to life with AI-generated video animations',
    features: ['Image-to-video', 'Motion control', 'Duration settings', 'Multiple resolutions'],
    creditCost: '8-10 credits per video',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-500'
  },
  prompts: {
    id: 'prompts',
    name: 'Prompts',
    icon: BookOpen,
    description: 'Create, organize, and manage your custom style prompts',
    features: ['Custom prompt creation', 'Style preset management', 'Search & filter', 'Public sharing'],
    creditCost: 'Free management',
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500'
  },
  history: {
    id: 'history',
    name: 'History',
    icon: History,
    description: 'Access and manage your previous generations and projects',
    features: ['Project history', 'Quick reuse', 'Export options', 'Organization tools'],
    creditCost: 'Free access',
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-slate-500'
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
    if (userCredits >= 50) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (userCredits >= 20) return { status: 'good', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    if (userCredits >= 10) return { status: 'low', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' }
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.6), 0 0 30px rgba(147, 51, 234, 0.4); }
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-6">
      {/* Main Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.1)_90deg,transparent_180deg,rgba(255,255,255,0.1)_270deg,transparent_360deg)] animate-spin-slow"></div>
        </div>
        
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            {/* Left Section - Title and Description */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${currentTabInfo.gradient} shadow-lg animate-float`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Preset Playground
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {currentTabInfo.description}
                  </p>
                </div>
              </div>
              
              {/* Active Tab Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentTabInfo.features.map((feature, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="bg-white/80 text-gray-700 border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200 cursor-default"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Right Section - Credits */}
            <div className="flex flex-col items-end gap-4">
              {/* Credits Display */}
              <Card className={`${creditStatus.bgColor} border-0 shadow-sm hover:shadow-md transition-all duration-300`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/80 ${creditsAnimation ? 'animate-pulse animate-glow' : ''}`}>
                      <Sparkles className={`h-5 w-5 ${creditStatus.color}`} />
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${creditStatus.color}`}>
                        {userCredits}
                      </div>
                      <div className="text-sm text-gray-600">Credits Available</div>
                    </div>
                  </div>
                  
                  {/* Credit Status Indicator */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Credit Level</span>
                      <span className="capitalize font-medium">{creditStatus.status}</span>
                    </div>
                    <Progress 
                      value={(userCredits / 100) * 100} 
                      className="h-2 bg-white/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Tier */}
              <Badge 
                variant="outline" 
                className="bg-white/80 text-gray-700 border-gray-200"
              >
                {userSubscriptionTier} Plan
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tab-Specific Information */}
      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Tab Info */}
            <div className="flex items-center gap-4 hover:scale-105 transition-transform duration-200">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${currentTabInfo.gradient} shadow-md hover:shadow-lg transition-all duration-300`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {currentTabInfo.name} Mode
                </h3>
                <p className="text-sm text-gray-600">
                  {currentTabInfo.creditCost}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 hover:scale-105 transition-transform duration-200">
              <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:shadow-md transition-all duration-300">
                <Zap className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  AI Powered
                </h3>
                <p className="text-sm text-gray-600">
                  Seedream Technology
                </p>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="flex items-center gap-4 hover:scale-105 transition-transform duration-200">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 hover:shadow-md transition-all duration-300">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  High Quality
                </h3>
                <p className="text-sm text-gray-600">
                  Professional Results
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      </div>
    </>
  )
}
