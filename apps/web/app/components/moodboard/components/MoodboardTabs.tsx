/**
 * MoodboardTabs Component
 * Tab navigation for different image sources (upload, pexels, url, etc.)
 */

'use client'

import { Upload, Search, ImageIcon, Sparkles, Link as LinkIcon } from 'lucide-react'
import { TabType } from '../lib/moodboardTypes'

interface MoodboardTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  uploadCount?: number
  enhancementCount?: number
}

export const MoodboardTabs = ({
  activeTab,
  onTabChange,
  uploadCount = 0,
  enhancementCount = 0
}: MoodboardTabsProps) => {
  const tabs: Array<{
    id: TabType
    label: string
    icon: React.ComponentType<{ className?: string }>
    description: string
  }> = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      description: 'Upload your own images'
    },
    {
      id: 'pexels',
      label: 'Stock Photos',
      icon: Search,
      description: 'Search free stock photos'
    },
    {
      id: 'saved',
      label: 'My Images',
      icon: ImageIcon,
      description: 'Use your saved images'
    },
    {
      id: 'url',
      label: 'From URL',
      icon: LinkIcon,
      description: 'Import from web URL'
    },
    {
      id: 'enhance',
      label: 'Enhance',
      icon: Sparkles,
      description: 'AI-enhance your images'
    }
  ]

  return (
    <div className="border-b border-border mb-6">
      {/* Mobile-optimized tab layout */}
      <div className="block sm:hidden">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${
                    isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{tab.label}</span>

                {/* Show count badges for upload and enhancement */}
                {tab.id === 'upload' && uploadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] text-center">
                    {uploadCount}
                  </span>
                )}
                {tab.id === 'enhance' && enhancementCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] text-center">
                    {enhancementCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop tab layout */}
      <div className="hidden sm:block">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap
                  ${
                    isActive
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>

                {/* Show count badges for upload and enhancement */}
                {tab.id === 'upload' && uploadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {uploadCount}
                  </span>
                )}
                {tab.id === 'enhance' && enhancementCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {enhancementCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab description */}
      <div className="py-2">
        <p className="text-xs text-muted-foreground">
          {tabs.find((t) => t.id === activeTab)?.description}
        </p>
      </div>
    </div>
  )
}
