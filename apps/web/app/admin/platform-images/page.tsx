'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { createClient } from '../../../lib/supabase/client';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Upload, ImageIcon, Plus, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
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

const HERO_SECTION = {
  name: 'Hero Background',
  imageType: 'hero',
  category: 'hero',
  description: 'Main hero rotating images - Set Image Type to "Hero"'
};

const HOMEPAGE_SECTIONS = [
  { name: 'About Section', imageType: undefined, category: 'about', description: 'Why Preset section image' },
  { name: 'Talent For Hire Banner', imageType: undefined, category: 'talent-for-hire', description: 'Cover banner for Talent For Hire section' },
  { name: 'Creative Roles Banner', imageType: undefined, category: 'creative-roles', description: 'Cover banner for Creative Roles section' },
  { name: 'Contributors Banner', imageType: undefined, category: 'contributors', description: 'Cover banner for Contributors section' },
  { name: 'For Contributors Image', imageType: undefined, category: 'how-it-works-contributors', description: '"What You Can Do" - For Contributors section' },
  { name: 'For Talents Image', imageType: undefined, category: 'how-it-works-talents', description: '"What You Can Do" - For Talents section' },
];

const PAGE_HEADER_SECTIONS = [
  { name: 'Gigs Header Background', imageType: undefined, category: 'gigs-header', description: 'Background image for Gigs page header' },
  { name: 'Collaborate Header Background', imageType: undefined, category: 'collaborate-header', description: 'Background image for Collaborate page header' },
  { name: 'Marketplace Header Background', imageType: undefined, category: 'marketplace-header', description: 'Background image for Marketplace page header' },
  { name: 'Playground Header Background', imageType: undefined, category: 'playground-header', description: 'Background image for Playground page header' },
  { name: 'Presets Header Background', imageType: undefined, category: 'presets-header', description: 'Background image for Presets page header' },
  { name: 'Showcases Header Background', imageType: undefined, category: 'showcases-header', description: 'Background image for Showcases page header' },
  { name: 'Treatments Header Background', imageType: undefined, category: 'treatments-header', description: 'Background image for Treatments page header' },
  { name: 'Moodboards Header Background', imageType: undefined, category: 'moodboards-header', description: 'Background image for Moodboards page header' },
];

// Roles will be fetched from database dynamically

export default function PlatformImagesAdmin() {
  const { user, loading } = useAuth();
  const [platformImages, setPlatformImages] = useState<PlatformImage[]>([]);
  const [presetVisualAids, setPresetVisualAids] = useState<PresetVisualAid[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fixingDuplicates, setFixingDuplicates] = useState(false);
  
  // Database-driven roles
  const [contributorRoles, setContributorRoles] = useState<any[]>([]);
  const [talentCategories, setTalentCategories] = useState<any[]>([]);
  const [allRoles, setAllRoles] = useState<any[]>([]);

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
      fetchRoles();
    }
  }, [user]);

  const fetchPlatformImages = async () => {
    try {
      const response = await fetch(`/api/platform-images?includeInactive=true&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`📥 Fetched ${data.images?.length || 0} platform images`);
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

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/predefined-data');
      if (response.ok) {
        const data = await response.json();
        setContributorRoles(data.predefined_roles || []);
        setTalentCategories(data.talent_categories || []);
        
        // Combine all roles for display - clean approach without duplicates
        const generateSlug = (name: string) => {
          return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        };
        
        const combinedRoles = [
          ...(data.predefined_roles || []).map((role: any) => ({
            name: role.name,
            slug: generateSlug(role.name),
            type: 'contributor'
          })),
          ...(data.talent_categories || []).map((category: any) => ({
            name: category.category_name,
            slug: generateSlug(category.category_name),
            type: 'talent'
          }))
        ];
        
        setAllRoles(combinedRoles);
        console.log(`📋 Loaded ${combinedRoles.length} roles (${data.predefined_roles?.length || 0} contributors + ${data.talent_categories?.length || 0} talent categories)`);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    // Pass image_type and category for proper folder organization
    formDataObj.append('image_type', formData.image_type || 'general');
    formDataObj.append('category', formData.category || '');

    console.log('📤 Uploading with metadata:', {
      image_type: formData.image_type,
      category: formData.category,
      file_name: file.name
    });

    const response = await fetch('/api/upload/platform-image', {
      method: 'POST',
      body: formDataObj,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.publicUrl || result.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('You must be logged in to perform this action');
        setUploading(false);
        return;
      }

      let imageUrl = '';

      if (formData.selected_image_url) {
        imageUrl = formData.selected_image_url;
      } else if (formData.image_file) {
        imageUrl = await handleFileUpload(formData.image_file);
      }

      if (!imageUrl && !editingImage) {
        toast.error('Please select or upload an image');
        setUploading(false);
        return;
      }

      // Parse usage_context safely
      let usageContext = {};
      try {
        usageContext = JSON.parse(formData.usage_context || '{}');
      } catch (e) {
        usageContext = {};
      }

      // Determine format from file or URL
      let format = 'jpg';
      if (formData.image_file) {
        format = formData.image_file.type?.split('/')[1] || 'jpg';
      } else if (imageUrl) {
        const urlFormat = imageUrl.split('.').pop()?.split('?')[0];
        format = urlFormat || 'jpg';
      }

      // Remove fields that shouldn't be sent to API
      const { image_file, selected_image_url, ...cleanFormData } = formData;

      const imageData = {
        ...cleanFormData,
        image_url: imageUrl || (editingImage?.image_url || ''),
        usage_context: usageContext,
        width: 1024,
        height: 1024,
        file_size: formData.image_file?.size || 0,
        format: format
      };

      const url = editingImage
        ? `/api/platform-images/${editingImage.id}`
        : '/api/platform-images';

      const method = editingImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
        console.log('🔄 Refreshing images after deactivation...');
        await fetchPlatformImages();
        setRefreshKey(prev => prev + 1); // Force component re-render
        console.log('✅ Images refreshed and component re-rendered');
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

  const handleQuickUpload = (section: {name: string, category?: string, imageType?: string, description?: string}) => {
    // Determine the correct image_type based on the section
    let imageType = section.imageType || 'general';

    // If category starts with 'role-', set image_type to 'role'
    if (section.category?.startsWith('role-')) {
      imageType = 'role';
    }

    setFormData({
      image_key: `${section.category || section.imageType}_${Date.now()}`,
      image_type: imageType,
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

  const handleAuditImages = async (autoDelete = false) => {
    if (autoDelete && !confirm('This will automatically delete all broken image records. Continue?')) {
      return;
    }

    setAuditing(true);
    setAuditResults(null);
    try {
      const response = await fetch(`/api/platform-images/audit?autoDelete=${autoDelete}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setAuditResults(result);

        if (result.summary.autoDeleted > 0) {
          toast.success(`✅ Deleted ${result.summary.autoDeleted} broken image records`);
          fetchPlatformImages(); // Refresh the list
        } else if (result.brokenLinks.length === 0) {
          toast.success('✅ All images are valid! No broken links found.');
        } else {
          toast.error(`Found ${result.brokenLinks.length} broken image links`);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to audit images');
      }
    } catch (error) {
      toast.error('Error auditing images');
    } finally {
      setAuditing(false);
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

  const handleFixRoleDuplicates = async () => {
    if (!confirm('This will remove duplicate roles from contributor roles table (Musician, Content Creator, Influencer). These roles belong in talent categories. Continue?')) {
      return;
    }

    setFixingDuplicates(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('You must be logged in to perform this action');
        setFixingDuplicates(false);
        return;
      }

      const response = await fetch('/api/admin/fix-role-duplicates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`✅ Removed ${result.deletedRoles.length} duplicate roles: ${result.deletedRoles.join(', ')}`);
        console.log('📊 Role counts after cleanup:', result.counts);
        fetchRoles(); // Refresh the roles
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fix role duplicates');
      }
    } catch (error) {
      toast.error('Error fixing role duplicates');
    } finally {
      setFixingDuplicates(false);
    }
  };

  const getImagesBySection = (section: typeof HOMEPAGE_SECTIONS[0]) => {
    const filtered = section.imageType
      ? platformImages.filter(img => img.image_type === section.imageType && img.is_active)
      : platformImages.filter(img => img.category === section.category && img.is_active);
    
    console.log(`🔍 Section "${section.name}": Found ${filtered.length} active images out of ${platformImages.filter(img => section.imageType ? img.image_type === section.imageType : img.category === section.category).length} total`);
    
    return filtered;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access admin panel</div>;
  }

  return (
    <div key={refreshKey} className="min-h-screen bg-background">
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
                onClick={() => handleAuditImages(false)}
                variant="outline"
                disabled={auditing}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {auditing ? 'Auditing...' : 'Audit Images'}
              </Button>
              <Button
                onClick={() => handleAuditImages(true)}
                variant="destructive"
                disabled={auditing}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Auto-Cleanup
              </Button>
              <Button
                onClick={handleSyncBucket}
                variant="outline"
                disabled={syncing}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {syncing ? 'Syncing...' : 'Sync Bucket'}
              </Button>
              <Button
                onClick={handleFixRoleDuplicates}
                variant="outline"
                disabled={fixingDuplicates}
                className="flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {fixingDuplicates ? 'Fixing...' : 'Fix Role Duplicates'}
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

        {/* Audit Results */}
        {auditResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audit Results</span>
                <Button variant="ghost" size="sm" onClick={() => setAuditResults(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Total in Database</p>
                  <p className="text-2xl font-bold">{auditResults.summary.totalInDatabase}</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Total in Bucket</p>
                  <p className="text-2xl font-bold">{auditResults.summary.totalInBucket}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Valid Images</p>
                  <p className="text-2xl font-bold text-red-600">{auditResults.summary.validImages}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-md">
                  <p className="text-xs text-muted-foreground">Broken Links</p>
                  <p className="text-2xl font-bold text-red-600">{auditResults.summary.brokenLinks}</p>
                </div>
              </div>

              {auditResults.brokenLinks.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Broken Images (Click to Delete)</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditResults.brokenLinks.map((img: any) => (
                      <div key={img.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted">
                        <div className="flex-1">
                          <p className="font-medium">{img.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground">Category: {img.category || 'None'}</p>
                          <p className="text-xs text-red-500">{img.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(img.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* Hero Background - Multiple Images for Carousel */}
        <ImageSectionManager
          section={HERO_SECTION}
          images={platformImages.filter(img => img.image_type === 'hero' && img.is_active)}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onQuickUpload={handleQuickUpload}
        />

        {/* Homepage Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Homepage Section Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOMEPAGE_SECTIONS.map((section) => {
              const sectionImages = getImagesBySection(section);
              const hasImage = sectionImages.length > 0;
              const image = sectionImages[0]; // These sections typically have one image

              return (
                <div
                  key={section.name}
                  className="relative border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors group aspect-square min-h-[200px]"
                >
                  {hasImage ? (
                    <>
                      {/* Full background image */}
                      <Image
                        src={image.image_url}
                        alt={image.alt_text || section.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />

                      {/* Title overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                        <p className="text-base font-semibold text-white truncate">{section.name}</p>
                        <p className="text-xs text-white/80 truncate">{section.description}</p>
                      </div>

                      {/* Hover controls */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(image)}
                          className="w-full max-w-[150px]"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivate(image.id)}
                          className="w-full max-w-[150px] bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/50 text-orange-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Empty state */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-muted/50">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-3" />
                        <p className="text-base font-semibold text-center mb-1">{section.name}</p>
                        <p className="text-xs text-muted-foreground text-center">{section.description}</p>
                      </div>

                      {/* Add button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <Button
                          onClick={() => handleQuickUpload(section)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Page Header Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Page Header Backgrounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAGE_HEADER_SECTIONS.map((section) => {
              const sectionImages = getImagesBySection(section);
              const hasImage = sectionImages.length > 0;
              const image = sectionImages[0];

              return (
                <div
                  key={section.category}
                  className="relative border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors group aspect-video min-h-[150px]"
                >
                  {hasImage ? (
                    <>
                      <img
                        src={image.image_url}
                        alt={section.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-sm font-medium text-white">{section.name}</p>
                        <p className="text-xs text-white/80">{section.description}</p>
                      </div>

                      {/* Hover controls */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(image)}
                          className="w-full max-w-[150px]"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivate(image.id)}
                          className="w-full max-w-[150px] bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/50 text-orange-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Empty state */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-muted/50">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-3" />
                        <p className="text-base font-semibold text-center mb-1">{section.name}</p>
                        <p className="text-xs text-muted-foreground text-center">{section.description}</p>
                      </div>

                      {/* Add button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <Button
                          onClick={() => handleQuickUpload(section)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Images */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Role Images ({allRoles.length} total)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allRoles.map((role) => {
              const roleImage = platformImages.find(img => img.category === `role-${role.slug}`);
              const hasImage = !!roleImage;

              return (
                <div
                  key={role.slug}
                  className="relative border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors group aspect-square min-h-[200px]"
                >
                  {hasImage ? (
                    <>
                      {/* Full background image */}
                      <Image
                        src={roleImage.image_url}
                        alt={roleImage.alt_text || role.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />

                      {/* Title overlay at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                        <p className="text-base font-semibold text-white truncate">{role.name}</p>
                        <p className="text-xs text-white/70 truncate capitalize">{role.type}</p>
                      </div>

                      {/* Hover controls */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(roleImage)}
                          className="w-full max-w-[150px]"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivate(roleImage.id)}
                          className="w-full max-w-[150px] bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/50 text-orange-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Empty state with preset logo as placeholder */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-muted/50">
                        <ImageIcon className="w-16 h-16 text-muted-foreground mb-3" />
                        <p className="text-base font-semibold text-center mb-1">{role.name}</p>
                        <p className="text-xs text-muted-foreground text-center capitalize">{role.type} card</p>
                      </div>

                      {/* Add button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <Button
                          onClick={() => handleQuickUpload({ name: role.name, category: `role-${role.slug}`, description: `${role.type} card for ${role.name}` })}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
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
