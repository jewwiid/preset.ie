'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Button } from '@/components/ui/button'
import { Plus, Grid, List, Image as ImageIcon, Calendar, Loader2, Trash2, Edit, Eye, Palette } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/PageHeader'
import { usePageHeaderImage } from '@/hooks/usePageHeaderImage'

interface Moodboard {
  id: string
  title: string
  summary?: string
  created_at: string
  updated_at: string
  items: any[]
  palette?: string[]
  tags?: string[]
  is_template: boolean
  template_name?: string
  gig_id?: string
  is_public?: boolean
}

export default function MoodboardsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { headerImage } = usePageHeaderImage('moodboards-header')
  const [profile, setProfile] = useState<any>(null)
  const [moodboards, setMoodboards] = useState<Moodboard[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleting, setDeleting] = useState<string | null>(null)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user])

  useEffect(() => {
    if (user && profile) {
      fetchMoodboards()
    }
  }, [user, profile])

  const fetchMoodboards = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('owner_user_id', profile?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setMoodboards(data || [])
    } catch (error) {
      console.error('Error fetching moodboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this moodboard?')) return

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('moodboards')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMoodboards(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting moodboard:', error)
      alert('Failed to delete moodboard')
    } finally {
      setDeleting(null)
    }
  }

  const getThumbnailUrl = (moodboard: Moodboard) => {
    if (!moodboard.items || moodboard.items.length === 0) return null
    return moodboard.items[0]?.url || moodboard.items[0]?.thumbnail_url
  }

  const getItemCount = (moodboard: Moodboard) => {
    return Array.isArray(moodboard.items) ? moodboard.items.length : 0
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view moodboards</h2>
          <Button onClick={() => router.push('/auth/login')}>Log In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          title="Moodboards"
          subtitle="Create and manage visual inspiration boards"
          icon={Palette}
          stats={[
            { icon: ImageIcon, label: `${moodboards.length} Moodboards` }
          ]}
          actions={
            <>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 mr-3">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={() => router.push('/moodboards/create')} size="lg" className="px-8 py-3 text-base font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
                <Plus className="w-5 h-5" />
                Create Moodboard
              </Button>
            </>
          }
          backgroundImage={headerImage}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : moodboards.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No moodboards yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first moodboard to collect visual inspiration
            </p>
            <Button onClick={() => router.push('/moodboards/create')} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Moodboard
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {moodboards.map((moodboard) => (
              <Link
                key={moodboard.id}
                href={`/moodboards/${moodboard.id}`}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300 group"
              >
                {/* Multi-Image Mosaic Thumbnail */}
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                  {getItemCount(moodboard) > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {moodboard.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className={`relative overflow-hidden ${
                            getItemCount(moodboard) === 1 ? 'col-span-2 row-span-2' :
                            getItemCount(moodboard) === 2 ? 'col-span-1 row-span-2' :
                            getItemCount(moodboard) === 3 && idx === 0 ? 'col-span-2' : ''
                          }`}
                        >
                          <Image
                            src={item.url || item.thumbnail_url}
                            alt={item.caption || `Image ${idx + 1}`}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      ))}
                      {getItemCount(moodboard) > 4 && (
                        <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                          +{getItemCount(moodboard) - 4} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {moodboard.is_template && (
                      <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Template
                      </div>
                    )}
                    {moodboard.is_public && (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        Public
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {moodboard.title || 'Untitled Moodboard'}
                  </h3>
                  
                  {moodboard.summary && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {moodboard.summary}
                    </p>
                  )}

                  {/* Tags */}
                  {moodboard.tags && moodboard.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {moodboard.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Color Palette */}
                  {moodboard.palette && moodboard.palette.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground font-medium">Color Palette</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="flex gap-2">
                        {moodboard.palette.slice(0, 5).map((color, idx) => (
                          <div
                            key={idx}
                            className="flex-1 h-10 rounded-lg shadow-sm border border-border/50 group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {getItemCount(moodboard)} {getItemCount(moodboard) === 1 ? 'image' : 'images'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(moodboard.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Quick Actions - Show on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault()
                        router.push(`/moodboards/${moodboard.id}/edit`)
                      }}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(moodboard.id)
                      }}
                      disabled={deleting === moodboard.id}
                    >
                      {deleting === moodboard.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {moodboards.map((moodboard) => (
              <div
                key={moodboard.id}
                className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {getThumbnailUrl(moodboard) ? (
                      <Image
                        src={getThumbnailUrl(moodboard)!}
                        alt={moodboard.title || 'Moodboard'}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/moodboards/${moodboard.id}`}>
                        <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                          {moodboard.title || 'Untitled Moodboard'}
                        </h3>
                      </Link>
                      {moodboard.is_template && (
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium">
                          Template
                        </span>
                      )}
                    </div>
                    {moodboard.summary && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {moodboard.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        {getItemCount(moodboard)} images
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Updated {new Date(moodboard.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/moodboards/${moodboard.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/moodboards/${moodboard.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(moodboard.id)}
                      disabled={deleting === moodboard.id}
                    >
                      {deleting === moodboard.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
