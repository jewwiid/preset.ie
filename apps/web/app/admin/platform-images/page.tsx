'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Upload, Image as ImageIcon, Trash2, Edit, Eye, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface PlatformImage {
  id: string;
  image_key: string;
  image_type: string;
  category?: string;
  image_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  title?: string;
  description?: string;
  width: number;
  height: number;
  file_size: number;
  format: string;
  usage_context: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface PresetVisualAid {
  id: string;
  preset_key: string;
  platform_image_id: string;
  visual_aid_type: string;
  display_title?: string;
  display_description?: string;
  is_primary: boolean;
  display_order: number;
  platform_image: PlatformImage;
}

export default function PlatformImagesAdmin() {
  const { user, loading } = useAuth();
  const [platformImages, setPlatformImages] = useState<PlatformImage[]>([]);
  const [presetVisualAids, setPresetVisualAids] = useState<PresetVisualAid[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<PlatformImage | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for new/editing image
  const [formData, setFormData] = useState({
    image_key: '',
    image_type: 'homepage',
    category: '',
    alt_text: '',
    title: '',
    description: '',
    usage_context: '{}',
    is_active: true,
    display_order: 0,
    image_file: null as File | null
  });

  useEffect(() => {
    if (user) {
      fetchPlatformImages();
      fetchPresetVisualAids();
    }
  }, [user]);

  const fetchPlatformImages = async () => {
    try {
      const response = await fetch('/api/platform-images');
      if (response.ok) {
        const data = await response.json();
        setPlatformImages(data.images || []);
      } else {
        toast.error('Failed to fetch platform images');
      }
    } catch (error) {
      toast.error('Error fetching platform images');
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchPresetVisualAids = async () => {
    try {
      const response = await fetch('/api/preset-visual-aids');
      if (response.ok) {
        const data = await response.json();
        setPresetVisualAids(data.visualAids || []);
      }
    } catch (error) {
      console.error('Error fetching preset visual aids:', error);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/platform-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = '';
      
      // If we have a file to upload, upload it first
      if (formData.image_file) {
        imageUrl = await handleFileUpload(formData.image_file);
      }

      const imageData = {
        ...formData,
        image_url: imageUrl || (editingImage?.image_url || ''),
        usage_context: JSON.parse(formData.usage_context),
        width: 1024,
        height: 1024,
        file_size: formData.image_file?.size || 0,
        format: formData.image_file?.type?.split('/')[1] || 'jpg'
      };

      const url = editingImage 
        ? `/api/platform-images/${editingImage.id}`
        : '/api/platform-images';
      
      const method = editingImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });

      if (response.ok) {
        toast.success(editingImage ? 'Image updated successfully' : 'Image created successfully');
        setShowAddForm(false);
        setEditingImage(null);
        resetForm();
        fetchPlatformImages();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save image');
      }
    } catch (error) {
      toast.error('Error saving image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/platform-images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Image deleted successfully');
        fetchPlatformImages();
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      toast.error('Error deleting image');
    }
  };

  const handleEdit = (image: PlatformImage) => {
    setEditingImage(image);
    setFormData({
      image_key: image.image_key,
      image_type: image.image_type,
      category: image.category || '',
      alt_text: image.alt_text || '',
      title: image.title || '',
      description: image.description || '',
      usage_context: JSON.stringify(image.usage_context || {}, null, 2),
      is_active: image.is_active,
      display_order: image.display_order,
      image_file: null
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      image_key: '',
      image_type: 'homepage',
      category: '',
      alt_text: '',
      title: '',
      description: '',
      usage_context: '{}',
      is_active: true,
      display_order: 0,
      image_file: null
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access admin panel</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Images Admin</h1>
          <p className="text-muted-foreground">Manage platform-wide images and preset visual aids</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Image
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold">{platformImages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Images</p>
                <p className="text-2xl font-bold">
                  {platformImages.filter(img => img.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Visual Aids</p>
                <p className="text-2xl font-bold">{presetVisualAids.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingImage ? 'Edit Image' : 'Add New Image'}</CardTitle>
            <CardDescription>
              {editingImage ? 'Update image details' : 'Upload and configure a new platform image'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_key">Image Key</Label>
                  <Input
                    id="image_key"
                    value={formData.image_key}
                    onChange={(e) => setFormData({...formData, image_key: e.target.value})}
                    placeholder="e.g., homepage_hero, cinematic_portrait_example"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="image_type">Image Type</Label>
                  <Select value={formData.image_type} onValueChange={(value) => setFormData({...formData, image_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homepage">Homepage</SelectItem>
                      <SelectItem value="preset_visual_aid">Preset Visual Aid</SelectItem>
                      <SelectItem value="category_icon">Category Icon</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="feature_showcase">Feature Showcase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., cinematic_parameters, hero"
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Image title"
                />
              </div>

              <div>
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({...formData, alt_text: e.target.value})}
                  placeholder="Alternative text for accessibility"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Image description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="usage_context">Usage Context (JSON)</Label>
                <Textarea
                  id="usage_context"
                  value={formData.usage_context}
                  onChange={(e) => setFormData({...formData, usage_context: e.target.value})}
                  placeholder='{"section": "hero", "responsive": true}'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="image_file">Image File {!editingImage && '(Required)'}</Label>
                <Input
                  id="image_file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, image_file: e.target.files?.[0] || null})}
                  required={!editingImage}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Saving...' : (editingImage ? 'Update' : 'Create')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingImage(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Images Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Images</CardTitle>
          <CardDescription>Manage all platform images</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingImages ? (
            <div className="flex items-center justify-center py-8">Loading images...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformImages.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-gray-100">
                    {image.image_url ? (
                      <Image
                        src={image.image_url}
                        alt={image.alt_text || image.title || 'Platform image'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={image.is_active ? 'default' : 'secondary'}>
                        {image.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{image.title || image.image_key}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {image.description || image.alt_text}
                    </p>
                    
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {image.image_type}
                      </Badge>
                      {image.category && (
                        <Badge variant="outline" className="text-xs">
                          {image.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(image)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(image.image_url, '_blank')}
                        disabled={!image.image_url}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preset Visual Aids */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Visual Aids</CardTitle>
          <CardDescription>Images linked to specific presets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {presetVisualAids.map((aid) => (
              <div key={aid.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-16 h-16 relative bg-gray-100 rounded">
                  {aid.platform_image.image_url ? (
                    <Image
                      src={aid.platform_image.image_url}
                      alt={aid.display_title || aid.preset_key}
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{aid.display_title || aid.preset_key}</h4>
                  <p className="text-sm text-muted-foreground">
                    {aid.display_description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {aid.preset_key}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {aid.visual_aid_type}
                    </Badge>
                    {aid.is_primary && (
                      <Badge variant="default" className="text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}