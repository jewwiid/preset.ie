'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Eye,
  Tag,
  Calendar,
  Image as ImageIcon,
  Video,
  Sparkles,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Image from 'next/image'
import Link from 'next/link'

interface SavedMedia {
  id: string
  media_type: 'image' | 'video'
  image_url?: string
  video_url?: string
  thumbnail_url: string
  title: string
  description?: string
  tags: string[]
  created_at: string
  width: number
  height: number
  video_duration?: number
  video_resolution?: string
  video_format?: string
  generation_metadata?: {
    prompt: string
    style: string
    aspect_ratio: string
    resolution: string
    consistency_level: string
    enhanced_prompt: string
    style_applied: string
    custom_style_preset?: any
    credits_used: number
    generated_at: string
  }
  source: 'playground_gallery' | 'user_media'
  owner_user_id?: string
}

interface MediaEditDialogProps {
  media: SavedMedia | null
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<SavedMedia>) => void
}

function MediaEditDialog({ media, isOpen, onClose, onSave }: MediaEditDialogProps) {
  const [title, setTitle] = useState(media?.title || '')
  const [description, setDescription] = useState(media?.description || '')
  const [tags, setTags] = useState(media?.tags?.join(', ') || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (media) {
      setTitle(media.title)
      setDescription(media.description || '')
      setTags(media.tags.join(', '))
    }
  }, [media])

  const handleSave = async () => {
    if (!media) return

    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Media</DialogTitle>
          <DialogDescription>
            Update the title, description, and tags for this media item.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this media"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this media (optional)"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">Tags</label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas (e.g., landscape, nature, sunset)
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MediaManagementPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [media, setMedia] = useState<SavedMedia[]>([])
  const [filteredMedia, setFilteredMedia] = useState<SavedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingMedia, setEditingMedia] = useState<SavedMedia | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])

  // Fetch media
  const fetchMedia = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/media')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.media) {
          setMedia(data.media)
          setFilteredMedia(data.media)

          // Extract all unique tags
          const tags = new Set<string>()
          data.media.forEach((item: SavedMedia) => {
            item.tags.forEach(tag => tags.add(tag))
          })
          setAllTags(Array.from(tags))
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update media
  const updateMedia = async (mediaId: string, updates: Partial<SavedMedia>) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.media) {
          setMedia(prev => prev.map(item =>
            item.id === mediaId ? { ...item, ...updates } : item
          ))
          setFilteredMedia(prev => prev.map(item =>
            item.id === mediaId ? { ...item, ...updates } : item
          ))

          // Update all tags if tags changed
          if (updates.tags) {
            const tags = new Set<string>()
            media.forEach(item => {
              if (item.id === mediaId) {
                updates.tags.forEach(tag => tags.add(tag))
              } else {
                item.tags.forEach(tag => tags.add(tag))
              }
            })
            setAllTags(Array.from(tags))
          }
        }
      }
    } catch (error) {
      console.error('Error updating media:', error)
    }
  }

  // Delete media
  const deleteMedia = async (mediaId: string) => {
    setDeletingMedia(mediaId)
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMedia(prev => prev.filter(item => item.id !== mediaId))
          setFilteredMedia(prev => prev.filter(item => item.id !== mediaId))
        }
      }
    } catch (error) {
      console.error('Error deleting media:', error)
    } finally {
      setDeletingMedia(null)
    }
  }

  // Filter media
  useEffect(() => {
    let filtered = media

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags.includes(tag))
      )
    }

    setFilteredMedia(filtered)
  }, [media, searchQuery, selectedTags])

  useEffect(() => {
    fetchMedia()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to manage your media</p>
          <Button onClick={() => router.push('/auth/signup')}>
            Log In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Management</h1>
            <p className="text-muted-foreground">
              Manage your saved images and videos with full control
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tag Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Tags:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {selectedTags.length > 0 ? `${selectedTags.length} selected` : 'All Tags'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => setSelectedTags([])}>
                      All Tags
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {allTags.slice(0, 10).map(tag => (
                      <DropdownMenuItem
                        key={tag}
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(prev => prev.filter(t => t !== tag))
                          } else {
                            setSelectedTags(prev => [...prev, tag])
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{tag}</span>
                          {selectedTags.includes(tag) && <span>✓</span>}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{filteredMedia.length} items</span>
                <span>•</span>
                <span>{media.filter(m => m.media_type === 'image').length} images</span>
                <span>•</span>
                <span>{media.filter(m => m.media_type === 'video').length} videos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No media found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Your saved media will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  {item.media_type === 'image' ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      {item.media_type === 'image' ? 'Image' : 'Video'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-black/50 text-white hover:bg-black/70"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingMedia(item)
                          setEditDialogOpen(true)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={item.image_url || item.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Original
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this media?')) {
                              deleteMedia(item.id)
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    {item.generation_metadata && (
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {item.generation_metadata.style}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <MediaEditDialog
        media={editingMedia}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={(updates) => updateMedia(editingMedia!.id, updates)}
      />
    </div>
  )
}