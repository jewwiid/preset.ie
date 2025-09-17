'use client'

import { useState } from 'react'
import { Plus, Grid, List } from 'lucide-react'
import ShowcaseFeed from '../components/ShowcaseFeed'
import CreateShowcaseModal from '../components/CreateShowcaseModal'

export default function ShowcasesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'moodboard' | 'individual_image'>('all')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Showcases</h1>
              <p className="text-gray-600">Discover amazing creative work from our community</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Filter Buttons */}
              <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filterType === 'all' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('moodboard')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filterType === 'moodboard' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Moodboards
                </button>
                <button
                  onClick={() => setFilterType('individual_image')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filterType === 'individual_image' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Images
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              {/* Create Showcase Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Showcase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Showcase Feed */}
        <ShowcaseFeed 
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''} 
          showcaseType={filterType}
          showCinematicFilters={true}
        />

        {/* Create Showcase Modal */}
        {showCreateModal && (
          <CreateShowcaseModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              // Refresh the feed
              window.location.reload()
            }}
          />
        )}
      </div>
    </div>
  )
}