'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon, Upload, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import MoodboardBuilder from '../MoodboardBuilder'
import Image from 'next/image'

interface MoodboardStepProps {
  gigId: string
  moodboardId?: string
  onMoodboardSave: (newMoodboardId: string) => void
  onNext: () => void
  onBack: () => void
}

interface SavedMoodboard {
  id: string
  title: string
  summary?: string
  items: any[]
  created_at: string
  updated_at: string
}

export default function MoodboardStep({
  gigId,
  moodboardId,
  onMoodboardSave,
  onNext,
  onBack
}: MoodboardStepProps) {
  const { user } = useAuth()
  const [showImport, setShowImport] = useState(false)
  const [savedMoodboards, setSavedMoodboards] = useState<SavedMoodboard[]>([])
  const [loadingMoodboards, setLoadingMoodboards] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    if (showImport && user) {
      fetchSavedMoodboards()
    }
  }, [showImport, user])

  const fetchSavedMoodboards = async () => {
    try {
      setLoadingMoodboards(true)
      // Fetch moodboards that are NOT attached to this gig
      const { data, error } = await supabase
        .from('moodboards')
        .select('id, title, summary, items, created_at, updated_at')
        .eq('owner_user_id', user?.id)
        .neq('gig_id', gigId)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setSavedMoodboards(data || [])
    } catch (error) {
      console.error('Error fetching saved moodboards:', error)
    } finally {
      setLoadingMoodboards(false)
    }
  }

  const handleImportMoodboard = async (sourceMoodboardId: string) => {
    try {
      setImporting(sourceMoodboardId)

      // Fetch the source moodboard
      const { data: sourceMoodboard, error: fetchError } = await supabase
        .from('moodboards')
        .select('*')
        .eq('id', sourceMoodboardId)
        .single()

      if (fetchError) throw fetchError

      // Create a duplicate moodboard for this gig
      const newMoodboard = {
        title: sourceMoodboard.title,
        summary: sourceMoodboard.summary,
        items: sourceMoodboard.items,
        palette: sourceMoodboard.palette,
        owner_user_id: user?.id,
        gig_id: gigId,
        is_template: false
      }

      const { data: createdMoodboard, error: createError } = await supabase
        .from('moodboards')
        .insert(newMoodboard)
        .select()
        .single()

      if (createError) throw createError

      // Update the gig with the new moodboard ID
      onMoodboardSave(createdMoodboard.id)
      setShowImport(false)
    } catch (error) {
      console.error('Error importing moodboard:', error)
      alert('Failed to import moodboard')
    } finally {
      setImporting(null)
    }
  }

  const getThumbnailUrl = (moodboard: SavedMoodboard) => {
    if (!moodboard.items || moodboard.items.length === 0) return null
    return moodboard.items[0]?.url || moodboard.items[0]?.thumbnail_url
  }

  const getItemCount = (moodboard: SavedMoodboard) => {
    return Array.isArray(moodboard.items) ? moodboard.items.length : 0
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Visual Moodboard</h2>
              <p className="text-muted-foreground text-sm">Add visual inspiration to help talent understand your vision</p>
            </div>
          </div>
          {!moodboardId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(!showImport)}
            >
              <Upload className="w-4 h-4 mr-2" />
              {showImport ? 'Create New' : 'Import Existing'}
            </Button>
          )}
        </div>
      </div>

      {/* Import Existing Moodboards */}
      {showImport && !moodboardId && (
        <div className="bg-card rounded-lg border border-border shadow-sm p-4">
          <h3 className="font-semibold mb-3">Import from Your Moodboards</h3>
          {loadingMoodboards ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : savedMoodboards.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No saved moodboards available to import
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open('/moodboards/create', '_blank')}
                className="mt-2"
              >
                Create a moodboard first
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {savedMoodboards.map((moodboard) => (
                <div
                  key={moodboard.id}
                  className="bg-muted/50 rounded-lg border border-border overflow-hidden hover:border-primary transition-colors"
                >
                  <div className="aspect-[4/3] bg-muted relative">
                    {getThumbnailUrl(moodboard) ? (
                      <Image
                        src={getThumbnailUrl(moodboard)!}
                        alt={moodboard.title || 'Moodboard'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm mb-1 truncate">
                      {moodboard.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {getItemCount(moodboard)} images
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleImportMoodboard(moodboard.id)}
                      disabled={importing !== null}
                    >
                      {importing === moodboard.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Moodboard Builder */}
      {!showImport && (
        <MoodboardBuilder
          gigId={gigId}
          moodboardId={moodboardId}
          onSave={onMoodboardSave}
          compactMode={true}
        />
      )}

      {/* Navigation */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            size="lg"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Requirements
          </Button>
          
          <Button
            type="button"
            onClick={onNext}
            size="lg"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Continue to Review
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}