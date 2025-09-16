'use client'

import { useState, useRef } from 'react'
import { Wand2, Upload, Link, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BatchImage {
  id: string
  url: string
  source: 'url' | 'upload' | 'saved'
  name?: string
  file?: File
}

interface BatchProcessingPanelProps {
  onPerformBatchEdit: (params: {
    prompt: string
    images: string[]
    editType: string
  }) => Promise<void>
  loading: boolean
  savedImages?: Array<{
    id: string
    image_url: string
    title: string
  }>
  onSelectSavedImage?: (imageUrl: string) => void
}

export default function BatchProcessingPanel({ 
  onPerformBatchEdit,
  loading,
  savedImages = [],
  onSelectSavedImage
}: BatchProcessingPanelProps) {
  const [batchImages, setBatchImages] = useState<BatchImage[]>([])
  const [editType, setEditType] = useState('enhance')
  const [editPrompt, setEditPrompt] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'saved'>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBatchEdit = async () => {
    if (batchImages.length === 0) {
      return
    }
    
    await onPerformBatchEdit({
      prompt: editPrompt,
      images: batchImages.map(img => img.url),
      editType
    })
  }

  const addImageFromUrl = (url: string) => {
    if (!url.trim()) return
    
    const newImage: BatchImage = {
      id: `url_${Date.now()}`,
      url: url.trim(),
      source: 'url',
      name: `URL Image ${batchImages.length + 1}`
    }
    setBatchImages([...batchImages, newImage])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        const newImage: BatchImage = {
          id: `upload_${Date.now()}_${Math.random()}`,
          url,
          source: 'upload',
          name: file.name,
          file
        }
        setBatchImages([...batchImages, newImage])
      }
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addSavedImage = (imageUrl: string) => {
    const savedImage = savedImages.find(img => img.image_url === imageUrl)
    if (!savedImage) return

    // Check if image is already in batch
    const existingImage = batchImages.find(img => img.url === imageUrl)
    if (existingImage) {
      return // Don't add duplicate
    }

    const newImage: BatchImage = {
      id: `saved_${savedImage.id}_${Date.now()}`, // Add timestamp to ensure uniqueness
      url: imageUrl,
      source: 'saved',
      name: savedImage.title
    }
    setBatchImages([...batchImages, newImage])
  }

  const removeImage = (id: string) => {
    setBatchImages(batchImages.filter(img => img.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
          Batch Processing
        </CardTitle>
        <CardDescription>
          Process multiple images with the same edit settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Edit Type and Prompt */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="editType">Edit Type</Label>
            <Select value={editType} onValueChange={setEditType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enhance">✨ Enhance (2 credits)</SelectItem>
                <SelectItem value="inpaint">🎨 Inpaint (3 credits)</SelectItem>
                <SelectItem value="outpaint">🖼️ Outpaint (3 credits)</SelectItem>
                <SelectItem value="style_transfer">🎭 Style Transfer (2 credits)</SelectItem>
                <SelectItem value="face_swap">👤 Face Swap (4 credits)</SelectItem>
                <SelectItem value="object_removal">🗑️ Remove Objects (3 credits)</SelectItem>
                <SelectItem value="background_removal">🌅 Remove Background (2 credits)</SelectItem>
                <SelectItem value="upscale">📈 Upscale (1 credit)</SelectItem>
                <SelectItem value="color_adjustment">🌈 Adjust Colors (2 credits)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="editPrompt">Edit Prompt</Label>
            <Input
              id="editPrompt"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Describe how you want to modify the images..."
              className="mt-1"
            />
          </div>
        </div>

        {/* Image Sources */}
        <div>
          <Label className="text-base font-medium">Add Images ({batchImages.length}/10)</Label>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Saved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="mt-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter image URL..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addImageFromUrl((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter image URL..."]') as HTMLInputElement
                    if (input?.value) {
                      addImageFromUrl(input.value)
                      input.value = ''
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Add URL Image
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Supports multiple image files
                </p>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="mt-4">
              <div className="space-y-2">
                {savedImages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No saved images available
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto">
                    {savedImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer"
                        onClick={() => addSavedImage(image.image_url)}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-300 transition-colors">
                          <img
                            src={image.image_url}
                            alt={image.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white"
                          >
                            Add
                          </Button>
                        </div>
                        <div className="mt-1">
                          <p className="text-xs font-medium truncate" title={image.title}>
                            {image.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Selected Images */}
        {batchImages.length > 0 && (
          <div>
            <Label className="text-base font-medium">Selected Images</Label>
            <div className="mt-2">
              <div className="grid grid-cols-3 gap-2 h-64 overflow-y-auto">
                {batchImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-1">
                      <p className="text-xs font-medium truncate" title={image.name}>
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{image.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        <Button
          onClick={handleBatchEdit}
          disabled={loading || batchImages.length === 0 || !editPrompt.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Batch Edit ({batchImages.length * 3} credits)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
