'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { createClient } from '../../../lib/supabase/client';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Upload, ImageIcon, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ImageUploadModal from './components/ImageUploadModal';
import ImageSectionManager from './components/ImageSectionManager';
import ImageLibrary from './components/ImageLibrary';
import VisualAidsManager from './components/VisualAidsManager';

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

const HOMEPAGE_SECTIONS = [
  { name: 'Hero Background', imageType: 'homepage', category: undefined, description: 'Main hero rotating images - Set Image Type to "Homepage"' },
  { name: 'About Section', imageType: undefined, category: 'about', description: 'Why Preset section image' },
  { name: 'Talent For Hire Banner', imageType: undefined, category: 'talent-for-hire', description: 'Cover banner for Talent For Hire section' },
  { name: 'Creative Roles Banner', imageType: undefined, category: 'creative-roles', description: 'Cover banner for Creative Roles section' },
  { name: 'Contributors Banner', imageType: undefined, category: 'contributors', description: 'Cover banner for Contributors section' },
  { name: 'For Contributors Image', imageType: undefined, category: 'how-it-works-contributors', description: '"What You Can Do" - For Contributors section' },
  { name: 'For Talents Image', imageType: undefined, category: 'how-it-works-talents', description: '"What You Can Do" - For Talents section' },
];

const ROLES = [
  { name: 'Actors', slug: 'actors' },
  { name: 'Models', slug: 'models' },
  { name: 'Singers', slug: 'singers' },
  { name: 'Dancers', slug: 'dancers' },
  { name: 'Musicians', slug: 'musicians' },
  { name: 'Photographers', slug: 'photographers' },
  { name: 'Videographers', slug: 'videographers' },
  { name: 'Cinematographers', slug: 'cinematographers' },
  { name: 'Makeup Artists', slug: 'makeup-artists' },
  { name: 'Hair Stylists', slug: 'hair-stylists' },
  { name: 'Fashion Stylists', slug: 'fashion-stylists' },
  { name: 'Directors', slug: 'directors' },
  { name: 'Creative Directors', slug: 'creative-directors' },
  { name: 'Art Directors', slug: 'art-directors' },
  { name: 'Producers', slug: 'producers' },
  { name: 'Editors', slug: 'editors' },
  { name: 'Designers', slug: 'designers' },
  { name: 'Writers', slug: 'writers' },
  { name: 'Freelancers', slug: 'freelancers' },
  { name: 'Brand Managers', slug: 'brand-managers' },
  { name: 'Content Creators', slug: 'content-creators' },
  { name: 'Studios', slug: 'studios' },
];

export default function PlatformImagesAdmin() {
  const { user, loading } = useAuth();
  const [platformImages, setPlatformImages] = useState<PlatformImage[]>([]);
  const [presetVisualAids, setPresetVisualAids] = useState<PresetVisualAid[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingImage, setEditingImage] = useState<PlatformImage | null>(null);
  const [quickUploadMode, setQuickUploadMode] = useState<{category?: string, imageType?: string, name: string} | null>(null);
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
    image_file: null as File | null,
    selected_image_url: '' as string
  });

  useEffect(() => {
    if (user) {
      fetchPlatformImages();
      fetchPresetVisualAids();
      fetchPresets();
    }
  }, [user]);

  const fetchPlatformImages = async () => {
    try {
      const response = await fetch('/api/platform-images?includeInactive=true');
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
        setPresetVisualAids(data.visual_aids || []);
      }
    } catch (error) {
      console.error('Error fetching preset visual aids:', error);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/presets');
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formDataObj = new FormData();
    formDataObj.append('file', file);

    const response = await fetch('/api/upload/platform-image', {
      method: 'POST',
      body: formDataObj,
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

      if (formData.selected_image_url) {
        imageUrl = formData.selected_image_url;
      } else if (formData.image_file) {
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
        handleCloseModal();
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

  const handleDeactivate = async (imageId: string) => {
    if (!confirm('Remove this image from display? (It will be hidden but not deleted)')) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      const response = await fetch(`/api/platform-images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: false }),
      });

      if (response.ok) {
        toast.success('Image removed from display');
        fetchPlatformImages();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to deactivate image');
      }
    } catch (error) {
      toast.error('Error deactivating image');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('⚠️ PERMANENTLY DELETE this image from the database and storage? This cannot be undone!')) return;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      const response = await fetch(`/api/platform-images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        toast.success('Image permanently deleted');
        fetchPlatformImages();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete image');
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
      image_file: null,
      selected_image_url: ''
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
      image_file: null,
      selected_image_url: ''
    });
    setQuickUploadMode(null);
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setEditingImage(null);
    resetForm();
  };

  const handleQuickUpload = (section: {name: string, category?: string, imageType?: string}) => {
    setFormData({
      image_key: `${section.category || section.imageType}_${Date.now()}`,
      image_type: section.imageType || 'homepage',
      category: section.category || '',
      alt_text: `${section.name} image`,
      title: section.name,
      description: '',
      usage_context: '{}',
      is_active: true,
      display_order: 0,
      image_file: null,
      selected_image_url: ''
    });
    setQuickUploadMode(section);
    setShowAddForm(true);
  };

  const handleSyncBucket = async () => {
    if (!confirm('This will create database records for all images in the platform-images bucket that don\'t already have records. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch('/api/platform-images/sync-bucket', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully synced ${result.synced} images from bucket`);
        fetchPlatformImages();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sync bucket images');
      }
    } catch (error) {
      toast.error('Error syncing bucket images');
    } finally {
      setSyncing(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, image_file: e.target.files?.[0] || null, selected_image_url: ''});
  };

  const handleSelectExisting = (imageUrl: string) => {
    setFormData({...formData, selected_image_url: imageUrl, image_file: null});
  };

  const handleAddVisualAid = (preset: any) => {
    toast.success(`Coming soon: Add visual aid for ${preset.name}`);
  };

  const getImagesBySection = (section: typeof HOMEPAGE_SECTIONS[0]) => {
    return section.imageType
      ? platformImages.filter(img => img.image_type === section.imageType && img.is_active)
      : platformImages.filter(img => img.category === section.category && img.is_active);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access admin panel</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Platform Images</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSyncBucket}
                variant="outline"
                disabled={syncing}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {syncing ? 'Syncing...' : 'Sync Bucket'}
              </Button>
              <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Image
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
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
                <ImageIcon className="w-5 h-5 text-primary" />
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
                <ImageIcon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Visual Aids</p>
                  <p className="text-2xl font-bold">{presetVisualAids.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Upload Modal */}
        <ImageUploadModal
          showAddForm={showAddForm}
          editingImage={editingImage}
          quickUploadMode={quickUploadMode}
          formData={formData}
          onClose={handleCloseModal}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onImageFileChange={handleImageFileChange}
          onSelectExisting={handleSelectExisting}
        />

        {/* Homepage Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Homepage Section Images</h2>
          {HOMEPAGE_SECTIONS.map((section) => (
            <ImageSectionManager
              key={section.name}
              section={section}
              images={getImagesBySection(section)}
              onQuickUpload={handleQuickUpload}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>

        {/* Role Images */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Role Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ROLES.map((role) => {
              const roleImage = platformImages.find(img => img.category === `role-${role.slug}`);
              return (
                <ImageSectionManager
                  key={role.slug}
                  section={{ name: role.name, category: `role-${role.slug}`, description: `Role card for ${role.name}` }}
                  images={roleImage ? [roleImage] : []}
                  onQuickUpload={handleQuickUpload}
                  onEdit={handleEdit}
                  onDeactivate={handleDeactivate}
                />
              );
            })}
          </div>
        </div>

        {/* Image Library */}
        <ImageLibrary
          images={platformImages}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Visual Aids Manager */}
        <VisualAidsManager
          presets={presets}
          presetVisualAids={presetVisualAids}
          onAddVisualAid={handleAddVisualAid}
        />
      </div>
    </div>
  );
}
