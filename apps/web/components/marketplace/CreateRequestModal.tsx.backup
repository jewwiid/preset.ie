'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calendar, MapPin, Euro, Search, X, Check, Users } from 'lucide-react';
import { StarRating, StarDisplay } from '@/components/ui/star-rating';
import { supabase } from '../../lib/supabase';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: any) => void;
}

const CONDITIONS = [
  'any',
  'new',
  'like_new', 
  'used',
  'fair'
];

interface EquipmentType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  sort_order: number;
}

interface EquipmentBrand {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
}

interface PredefinedModel {
  id: string;
  equipment_type_id: string;
  brand: string;
  model: string;
  description: string;
  sort_order: number;
  equipment_types?: {
    name: string;
    display_name: string;
  };
}

interface Purpose {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  sort_order: number;
}

// Helper function to convert icon names to emojis
const getIconEmoji = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    'heart': '❤️',
    'user': '👤',
    'users': '👥',
    'baby': '👶',
    'ring': '💍',
    'graduation-cap': '🎓',
    'user-check': '✅',
    'home': '🏠',
    'package': '📦',
    'shirt': '👕',
    'map-pin': '📍',
    'mountain': '🏔️',
    'tree-pine': '🌲',
    'trophy': '🏆',
    'calendar': '📅',
    'dog': '🐕',
    'utensils': '🍴',
    'map': '🗺️',
    'search': '🔍',
    'moon': '🌙',
    'waves': '🌊',
    'plane': '✈️',
    'building': '🏢',
    'video': '🎥',
    'briefcase': '💼',
    'film': '🎬',
    'music': '🎵',
    'tv': '📺',
    'radio': '📻',
    'mic': '🎤',
    'book-open': '📖',
    'share-2': '📤',
    'play': '▶️',
    'smartphone': '📱',
    'instagram': '📷',
    'monitor': '🖥️',
    'megaphone': '📢',
    'star': '⭐',
    'camera': '📷',
    'clock': '🕐',
    'globe': '🌍',
    'vr': '🥽',
    'headphones': '🎧',
    'mic-2': '🎙️',
    'speaker': '🔊',
    'volume-2': '🔉',
    'zap': '⚡',
    'phone': '📞',
    'cake': '🎂',
    'gift': '🎁',
    'hand-heart': '🤝',
    'crown': '👑',
    'rocket': '🚀',
    'palette': '🎨',
    'flask': '🧪',
    'award': '🏅',
    'book': '📚',
    'folder': '📁',
    'tag': '🏷️',
    'mail': '📧',
    'newspaper': '📰',
    'file-text': '📄',
    'test-tube': '🧪',
    'shield': '🛡️',
    'alert-triangle': '⚠️',
    'store': '🏪',
    'wrench': '🔧',
    'shield-check': '✅',
    'scale': '⚖️',
    'microscope': '🔬',
    'list': '📋',
    'edit': '✏️',
    'more-horizontal': '⋯',
    'church': '⛪'
  };
  
  return iconMap[iconName] || '📋';
};

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [equipmentBrands, setEquipmentBrands] = useState<EquipmentBrand[]>([]);
  const [predefinedModels, setPredefinedModels] = useState<PredefinedModel[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<PredefinedModel[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<PredefinedModel[]>([]);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [userRating, setUserRating] = useState<{ average_rating: number; total_reviews: number } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    equipment_type: '',
    brand: '',
    model: '',
    condition_preference: 'any',
    request_type: 'rent',
    rental_start_date: '',
    rental_end_date: '',
    max_daily_rate_cents: '',
    max_total_cents: '',
    max_purchase_price_cents: '',
    location_city: '',
    location_country: '',
    pickup_preferred: true,
    delivery_acceptable: false,
    max_distance_km: '50',
    verified_users_only: false,
        min_rating: 0,
    urgent: false,
    purpose_id: '',
    purpose_category: '',
    reference_type: '',
    reference_title: '',
    reference_url: '',
    reference_description: '',
    reference_thumbnail_url: ''
  });

  // Fetch predefined equipment data
  useEffect(() => {
    if (isOpen) {
      fetchEquipmentData();
      fetchUserRating();
      fetchPurposes();
    }
  }, [isOpen]);

  // Fetch user's current rating
  const fetchUserRating = async () => {
    try {
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      if (!session) return;

      const response = await fetch('/api/user/rating', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const ratingData = await response.json();
        setUserRating(ratingData);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  // Fetch purposes data
  const fetchPurposes = async () => {
    try {
      const response = await fetch('/api/marketplace/purposes?limit=200');
      if (!response.ok) {
        throw new Error('Failed to fetch purposes data');
      }
      
      const data = await response.json();
      setPurposes(data.purposes || []);
    } catch (error) {
      console.error('Error fetching purposes data:', error);
    }
  };

  const fetchEquipmentData = async () => {
    try {
      const response = await fetch('/api/marketplace/equipment?type=all');
      if (!response.ok) {
        throw new Error('Failed to fetch equipment data');
      }
      
      const data = await response.json();
      setEquipmentTypes(data.equipmentTypes || []);
      setEquipmentBrands(data.equipmentBrands || []);
      setPredefinedModels(data.predefinedModels || []);
    } catch (error) {
      console.error('Error fetching equipment data:', error);
    }
  };

  // Filter models based on selected category and brand
  useEffect(() => {
    if (predefinedModels.length > 0 && formData.category) {
      let filtered = predefinedModels.filter(model => 
        model.equipment_types?.name === formData.category
      );

      // If brand is selected, filter by brand
      if (selectedBrand) {
        filtered = filtered.filter(model => 
          model.brand.toLowerCase() === selectedBrand.toLowerCase()
        );
      }

      setAvailableModels(filtered);
    } else {
      setAvailableModels([]);
    }
  }, [formData.category, selectedBrand, predefinedModels]);

  // Filter equipment based on selected category and search (for the search functionality)
  useEffect(() => {
    if (predefinedModels.length > 0) {
      let filtered = predefinedModels;

      // If category is selected, filter by category first
      if (formData.category) {
        const selectedType = equipmentTypes.find(type => type.name === formData.category);
        
        if (selectedType) {
          filtered = filtered.filter(model => 
            model.equipment_type_id === selectedType.id
          );
        }
      }

      // Filter by search term if provided
      if (equipmentSearch) {
        filtered = filtered.filter(model => {
          const fullName = `${model.brand} ${model.model}`.toLowerCase();
          const searchTerm = equipmentSearch.toLowerCase();
          
          return fullName.includes(searchTerm) ||
                 model.brand.toLowerCase().includes(searchTerm) ||
                 model.model.toLowerCase().includes(searchTerm) ||
                 model.equipment_types?.name.toLowerCase().includes(searchTerm) ||
                 model.equipment_types?.display_name.toLowerCase().includes(searchTerm);
        });
      }

      setFilteredEquipment(filtered);
    } else {
      setFilteredEquipment([]);
    }
  }, [formData.category, equipmentSearch, predefinedModels, equipmentTypes]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset dependent fields when category changes
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value,
        brand: '',
        model: '',
        equipment_type: ''
      }));
      setSelectedBrand('');
      setSelectedModel('');
      setEquipmentSearch('');
    }
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel('');
    setFormData(prev => ({
      ...prev,
      brand: brand,
      model: '',
      equipment_type: ''
    }));
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    const fullEquipmentName = `${selectedBrand} ${model}`;
    setFormData(prev => ({
      ...prev,
      model: model,
      equipment_type: fullEquipmentName
    }));
  };

  const handleEquipmentSelect = (model: PredefinedModel) => {
    const fullEquipmentName = `${model.brand} ${model.model}`;
    setFormData(prev => ({
      ...prev,
      equipment_type: fullEquipmentName
    }));
    setEquipmentSearch(fullEquipmentName);
  };

  const handleCustomEquipment = async (customName: string) => {
    // Store custom equipment in database for future users
    try {
      const response = await fetch('/api/marketplace/equipment/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment_name: customName,
          category: formData.category,
          brand: customName.split(' ')[0], // Extract brand from first word
          model: customName.split(' ').slice(1).join(' ') // Rest is model
        })
      });

      if (response.ok) {
        // Refresh equipment data to include the new custom equipment
        await fetchEquipmentData();
      }
    } catch (error) {
      console.error('Error storing custom equipment:', error);
    }

    // Set the custom equipment name
    setFormData(prev => ({
      ...prev,
      equipment_type: customName
    }));
    setEquipmentSearch(customName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get auth token from Supabase
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Please sign in to create a request');
      }

      // Prepare request data
      const requestData = {
        ...formData,
        max_daily_rate_cents: formData.max_daily_rate_cents ? parseInt(formData.max_daily_rate_cents) * 100 : undefined,
        max_total_cents: formData.max_total_cents ? parseInt(formData.max_total_cents) * 100 : undefined,
        max_purchase_price_cents: formData.max_purchase_price_cents ? parseInt(formData.max_purchase_price_cents) * 100 : undefined,
        max_distance_km: parseInt(formData.max_distance_km),
        min_rating: formData.min_rating
      };

      const response = await fetch('/api/marketplace/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create request');
      }

      const result = await response.json();
      
      if (onSuccess) {
        onSuccess(result.request);
      }
      
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        equipment_type: '',
        brand: '',
        model: '',
        condition_preference: 'any',
        request_type: 'rent',
        rental_start_date: '',
        rental_end_date: '',
        max_daily_rate_cents: '',
        max_total_cents: '',
        max_purchase_price_cents: '',
        location_city: '',
        location_country: '',
        pickup_preferred: true,
        delivery_acceptable: false,
        max_distance_km: '50',
        verified_users_only: false,
        min_rating: 0,
        urgent: false,
        purpose_id: '',
        purpose_category: '',
        reference_type: '',
        reference_title: '',
        reference_url: '',
        reference_description: '',
        reference_thumbnail_url: ''
      });
      setEquipmentSearch('');

    } catch (error) {
      console.error('Error creating request:', error);
      alert(error instanceof Error ? error.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full h-[90vh] shadow-xl flex flex-col">
        <Card className="border-0 shadow-none flex flex-col h-full">
          <CardHeader className="pb-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
              <CardTitle className="text-2xl font-bold">Request Equipment</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
              Post what you're looking for and let equipment owners respond with offers
            </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">1</span>
                  </div>
                <h3 className="font-semibold text-lg">Basic Information</h3>
                </div>
                
                <div className="space-y-4">
                <div>
                    <Label htmlFor="title">
                      Request Title <span className="text-destructive">*</span>
                    </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Need Canon 5D Mark IV for wedding shoot"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your project, requirements, or any specific needs..."
                    rows={3}
                  />
                </div>

                  <div>
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map(type => (
                          <SelectItem key={type.id} value={type.name}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              <span>{type.display_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="purpose_category">
                        Purpose Category <span className="text-destructive">*</span>
                      </Label>
                      <Select value={formData.purpose_category} onValueChange={(value) => {
                        handleInputChange('purpose_category', value);
                        handleInputChange('purpose_id', ''); // Reset purpose when category changes
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {['photography', 'video', 'audio', 'event', 'creative', 'business', 'other'].map(category => (
                          <SelectItem key={category} value={category}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getIconEmoji(category === 'photography' ? 'camera' : category === 'video' ? 'video' : category === 'audio' ? 'headphones' : category === 'event' ? 'calendar' : category === 'creative' ? 'palette' : category === 'business' ? 'briefcase' : 'list')}</span>
                                <span className="capitalize">{category}</span>
                              </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                      <Label htmlFor="purpose_id">
                        Specific Purpose <span className="text-destructive">*</span>
                      </Label>
                      <Select 
                        value={formData.purpose_id} 
                        onValueChange={(value) => handleInputChange('purpose_id', value)}
                        disabled={!formData.purpose_category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.purpose_category ? "Select purpose" : "Select category first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {purposes
                            .filter(p => p.category === formData.purpose_category)
                            .map(purpose => (
                              <SelectItem key={purpose.id} value={purpose.id}>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getIconEmoji(purpose.icon)}</span>
                                  <span>{purpose.display_name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.purpose_id && (
                    <div className="mt-2 p-3 bg-muted rounded-md border">
                      <p className="text-sm text-muted-foreground">{purposes.find(p => p.id === formData.purpose_id)?.description}</p>
                    </div>
                  )}

                  {/* Reference Section */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reference_type">Reference Material (Optional)</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Link to moodboards, treatments, showcases, or other reference materials to help equipment owners understand your project
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reference_type">Reference Type</Label>
                        <Select value={formData.reference_type} onValueChange={(value) => handleInputChange('reference_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reference type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="moodboard">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎨</span>
                                <span>Moodboard</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="treatment">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📋</span>
                                <span>Treatment</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="showcase">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🎭</span>
                                <span>Showcase</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="external_link">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🔗</span>
                                <span>External Link</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="other">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span>Other</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="reference_title">Reference Title</Label>
                    <Input
                          id="reference_title"
                          value={formData.reference_title}
                          onChange={(e) => handleInputChange('reference_title', e.target.value)}
                          placeholder="Enter reference title"
                          disabled={!formData.reference_type}
                    />
                  </div>
                </div>

                    <div>
                      <Label htmlFor="reference_url">Reference URL</Label>
                      <Input
                        id="reference_url"
                        type="url"
                        value={formData.reference_url}
                        onChange={(e) => handleInputChange('reference_url', e.target.value)}
                        placeholder="https://example.com/reference"
                        disabled={!formData.reference_type}
                      />
                      {formData.reference_type && ['moodboard', 'treatment', 'showcase'].includes(formData.reference_type) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ⚠️ You can only reference {formData.reference_type}s that you own
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="reference_description">Reference Description</Label>
                      <Textarea
                        id="reference_description"
                        value={formData.reference_description}
                        onChange={(e) => handleInputChange('reference_description', e.target.value)}
                        placeholder="Describe what this reference shows or how it relates to your project"
                        disabled={!formData.reference_type}
                        rows={3}
                      />
                    </div>

                    {formData.reference_url && (
                      <div className="p-3 bg-muted rounded-md border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">
                            {formData.reference_type === 'moodboard' ? '🎨' : 
                             formData.reference_type === 'treatment' ? '📋' : 
                             formData.reference_type === 'showcase' ? '🎭' : 
                             formData.reference_type === 'external_link' ? '🔗' : '📄'}
                          </span>
                          <span className="font-medium">{formData.reference_title || 'Reference Material'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{formData.reference_description}</p>
                        <a 
                          href={formData.reference_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Reference →
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Brand Selection */}
                      <div>
                        <Label htmlFor="brand">
                          Brand <span className="text-destructive">*</span>
                        </Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select value={selectedBrand} onValueChange={handleBrandChange}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select brand" />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.category && availableModels.length > 0 ? (
                                  // Show brands from available models
                                  Array.from(new Set(availableModels.map(model => model.brand)))
                                    .sort()
                                    .map(brand => (
                                      <SelectItem key={brand} value={brand}>
                                        {brand.charAt(0).toUpperCase() + brand.slice(1)}
                                      </SelectItem>
                                    ))
                                ) : (
                                  // Show all brands if no category selected
                                  equipmentBrands.map(brand => (
                                    <SelectItem key={brand.id} value={brand.name}>
                                      {brand.display_name}
                                    </SelectItem>
                                  ))
                                )}
                                <SelectItem value="custom">+ Add Custom Brand</SelectItem>
                                {selectedBrand && selectedBrand !== 'custom' && !equipmentBrands.some(brand => brand.name === selectedBrand) && !availableModels.some(model => model.brand === selectedBrand) && (
                                  <SelectItem value={selectedBrand}>
                                    {selectedBrand.charAt(0).toUpperCase() + selectedBrand.slice(1)}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {selectedBrand && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBrand('');
                                  setSelectedModel('');
                                  setCustomBrandInput('');
                                  setCustomModelInput('');
                                  setFormData(prev => ({
                                    ...prev,
                                    brand: '',
                                    model: '',
                                    equipment_type: ''
                                  }));
                                }}
                                className="px-3"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                          
                          {/* Custom Brand Input */}
                          {selectedBrand === 'custom' && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter custom brand name"
                                value={customBrandInput}
                                onChange={(e) => {
                                  setCustomBrandInput(e.target.value);
                                }}
                                onBlur={(e) => {
                                  const customBrand = e.target.value.trim();
                                  if (customBrand) {
                                    setSelectedBrand(customBrand);
                                    setFormData(prev => ({
                                      ...prev,
                                      brand: customBrand,
                                      model: '',
                                      equipment_type: ''
                                    }));
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const customBrand = e.currentTarget.value.trim();
                                    if (customBrand) {
                                      setSelectedBrand(customBrand);
                                      setFormData(prev => ({
                                        ...prev,
                                        brand: customBrand,
                                        model: '',
                                        equipment_type: ''
                                      }));
                                    }
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBrand('');
                                    setCustomBrandInput('');
                                    setFormData(prev => ({
                                      ...prev,
                                      brand: '',
                                      model: '',
                                      equipment_type: ''
                                    }));
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    const customBrand = customBrandInput.trim();
                                    if (customBrand) {
                                      setSelectedBrand(customBrand);
                                      setFormData(prev => ({
                                        ...prev,
                                        brand: customBrand,
                                        model: '',
                                        equipment_type: ''
                                      }));
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Model Selection */}
                      <div>
                        <Label htmlFor="model">
                          Model <span className="text-destructive">*</span>
                        </Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedBrand}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder={selectedBrand ? "Select model" : "Select brand first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableModels
                                  .filter(model => model.brand.toLowerCase() === selectedBrand.toLowerCase())
                                  .map(model => (
                                    <SelectItem key={model.id} value={model.model}>
                                      {model.model}
                                    </SelectItem>
                                  ))}
                                {selectedBrand && (
                                  <SelectItem value="custom">+ Add Custom Model</SelectItem>
                                )}
                                {selectedModel && selectedModel !== 'custom' && !availableModels.some(model => model.model === selectedModel) && (
                                  <SelectItem value={selectedModel}>
                                    {selectedModel}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {selectedModel && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedModel('');
                                  setCustomModelInput('');
                                  setFormData(prev => ({
                                    ...prev,
                                    model: '',
                                    equipment_type: ''
                                  }));
                                }}
                                className="px-3"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                          
                          {/* Custom Model Input */}
                          {selectedModel === 'custom' && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter custom model name"
                                value={customModelInput}
                                onChange={(e) => {
                                  setCustomModelInput(e.target.value);
                                }}
                                onBlur={(e) => {
                                  const customModel = e.target.value.trim();
                                  if (customModel) {
                                    setSelectedModel(customModel);
                                    const fullEquipmentName = `${selectedBrand} ${customModel}`;
                                    setFormData(prev => ({
                                      ...prev,
                                      model: customModel,
                                      equipment_type: fullEquipmentName
                                    }));
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const customModel = e.currentTarget.value.trim();
                                    if (customModel) {
                                      setSelectedModel(customModel);
                                      const fullEquipmentName = `${selectedBrand} ${customModel}`;
                                      setFormData(prev => ({
                                        ...prev,
                                        model: customModel,
                                        equipment_type: fullEquipmentName
                                      }));
                                    }
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedModel('');
                                    setCustomModelInput('');
                                    setFormData(prev => ({
                                      ...prev,
                                      model: '',
                                      equipment_type: ''
                                    }));
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    const customModel = customModelInput.trim();
                                    if (customModel) {
                                      setSelectedModel(customModel);
                                      const fullEquipmentName = `${selectedBrand} ${customModel}`;
                                      setFormData(prev => ({
                                        ...prev,
                                        model: customModel,
                                        equipment_type: fullEquipmentName
                                      }));
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Model Description */}
                          {selectedModel && selectedModel !== 'custom' && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {availableModels
                                .find(model => 
                                  model.brand.toLowerCase() === selectedBrand.toLowerCase() && 
                                  model.model === selectedModel
                                )?.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected equipment display */}
                      {formData.equipment_type && (
                        <div className="p-3 bg-muted rounded-md border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Check className="h-4 w-4" />
                              Selected: {formData.equipment_type.split(' ').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBrand('');
                                setSelectedModel('');
                                setCustomBrandInput('');
                                setCustomModelInput('');
                                setFormData(prev => ({
                                  ...prev,
                                  brand: '',
                                  model: '',
                                  equipment_type: ''
                                }));
                              }}
                              className="h-6 w-6 p-0"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condition_preference">Condition Preference</Label>
                    <Select value={formData.condition_preference} onValueChange={(value) => handleInputChange('condition_preference', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(condition => (
                          <SelectItem key={condition} value={condition}>
                            {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                      <Label htmlFor="request_type">
                        Request Type <span className="text-destructive">*</span>
                      </Label>
                    <Select value={formData.request_type} onValueChange={(value) => handleInputChange('request_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rental Only</SelectItem>
                        <SelectItem value="buy">Purchase Only</SelectItem>
                        <SelectItem value="both">Rent or Buy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Rental Information */}
              {(formData.request_type === 'rent' || formData.request_type === 'both') && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                  <h3 className="font-semibold text-lg">Rental Details</h3>
                    </div>
                  
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                          <Label htmlFor="rental_start_date">
                            Start Date <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rental_start_date"
                        type="date"
                        value={formData.rental_start_date}
                        onChange={(e) => handleInputChange('rental_start_date', e.target.value)}
                              className="pl-10"
                        required
                      />
                          </div>
                    </div>

                    <div>
                          <Label htmlFor="rental_end_date">
                            End Date <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rental_end_date"
                        type="date"
                        value={formData.rental_end_date}
                        onChange={(e) => handleInputChange('rental_end_date', e.target.value)}
                              className="pl-10"
                        required
                      />
                          </div>
                    </div>
                  </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_daily_rate_cents">Max Daily Rate (€)</Label>
                      <div className="relative">
                            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="max_daily_rate_cents"
                          type="number"
                              min="0"
                              step="1"
                          value={formData.max_daily_rate_cents}
                          onChange={(e) => handleInputChange('max_daily_rate_cents', e.target.value)}
                          placeholder="50"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="max_total_cents">Max Total Budget (€)</Label>
                      <div className="relative">
                            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="max_total_cents"
                          type="number"
                              min="0"
                              step="1"
                          value={formData.max_total_cents}
                          onChange={(e) => handleInputChange('max_total_cents', e.target.value)}
                          placeholder="500"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </>
              )}

              {/* Purchase Information */}
              {(formData.request_type === 'buy' || formData.request_type === 'both') && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                  <h3 className="font-semibold text-lg">Purchase Details</h3>
                    </div>
                  
                  <div>
                    <Label htmlFor="max_purchase_price_cents">Max Purchase Price (€)</Label>
                    <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="max_purchase_price_cents"
                        type="number"
                          min="0"
                          step="1"
                        value={formData.max_purchase_price_cents}
                        onChange={(e) => handleInputChange('max_purchase_price_cents', e.target.value)}
                        placeholder="2000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                </>
              )}

              {/* Location */}
              <Separator />
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">3</span>
                  </div>
                <h3 className="font-semibold text-lg">Location</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location_city">City</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location_city"
                      value={formData.location_city}
                      onChange={(e) => handleInputChange('location_city', e.target.value)}
                      placeholder="Dublin"
                          className="pl-10"
                    />
                      </div>
                  </div>

                  <div>
                    <Label htmlFor="location_country">Country</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location_country"
                      value={formData.location_country}
                      onChange={(e) => handleInputChange('location_country', e.target.value)}
                      placeholder="Ireland"
                          className="pl-10"
                    />
                      </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="max_distance_km">Max Distance (km)</Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        min={0}
                        max={500}
                        step={5}
                        value={[parseInt(formData.max_distance_km) || 50]}
                        onValueChange={(value) => handleInputChange('max_distance_km', Array.isArray(value) ? value[0].toString() : value.toString())}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 km</span>
                        <span className="font-medium">{formData.max_distance_km || 50} km</span>
                        <span>500 km</span>
                </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Preferences */}
              <Separator />
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">4</span>
                  </div>
                <h3 className="font-semibold text-lg">Preferences</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Only verified users */}
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="verified_users_only" className="text-sm font-medium">
                          Only verified users
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Restrict to verified users only
                        </p>
                      </div>
                      <Switch
                      id="verified_users_only"
                      checked={formData.verified_users_only}
                      onCheckedChange={(checked) => handleInputChange('verified_users_only', checked)}
                    />
                    </div>
                  </div>

                  {/* Card 2: Urgent request */}
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="urgent" className="text-sm font-medium flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1 text-destructive" />
                          Urgent request
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Mark this request as urgent
                        </p>
                      </div>
                      <Switch
                      id="urgent"
                      checked={formData.urgent}
                      onCheckedChange={(checked) => handleInputChange('urgent', checked)}
                    />
                    </div>
                  </div>

                  {/* Card 3: Pickup preferred */}
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="pickup_preferred" className="text-sm font-medium">
                          Pickup preferred
                    </Label>
                        <p className="text-xs text-muted-foreground">
                          Prefer pickup over delivery
                        </p>
                      </div>
                      <Switch
                        id="pickup_preferred"
                        checked={formData.pickup_preferred}
                        onCheckedChange={(checked) => handleInputChange('pickup_preferred', checked)}
                      />
                  </div>
                </div>

                  {/* Card 4: Delivery acceptable */}
                  <div className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="delivery_acceptable" className="text-sm font-medium">
                          Delivery acceptable
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Accept delivery as an option
                        </p>
                      </div>
                      <Switch
                        id="delivery_acceptable"
                        checked={formData.delivery_acceptable}
                        onCheckedChange={(checked) => handleInputChange('delivery_acceptable', checked)}
                      />
                    </div>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Minimum User Rating Column */}
                <div>
                  <Label htmlFor="min_rating">Minimum User Rating</Label>
                      <div className="mt-2">
                        <StarRating
                    value={formData.min_rating}
                          onChange={(value) => handleInputChange('min_rating', value)}
                          max={5}
                          size="md"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only allow users with this rating or higher to respond to your request
                      </p>
                    </div>
                    
                    {/* Your Current Rating Column */}
                    <div>
                      <Label>Your Current Rating</Label>
                      <div className="mt-2">
                        {userRating ? (
                          <div className="p-3 bg-muted rounded-md border">
                            <div className="space-y-2">
                              <StarDisplay 
                                value={userRating.average_rating} 
                                size="md" 
                                showText={true}
                              />
                              <p className="text-xs text-muted-foreground">
                                {userRating.total_reviews} review{userRating.total_reviews !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-muted rounded-md border">
                            <div className="space-y-2">
                              <StarDisplay 
                                value={0} 
                                size="md" 
                                showText={true}
                              />
                              <p className="text-xs text-muted-foreground">
                                0 reviews
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              {/* Convert to Collaboration */}
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">Need a team for your project?</h4>
                    <p className="text-sm text-muted-foreground">
                      Convert this equipment request into a collaboration project to find photographers, models, and other creatives.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      // Store current form data in sessionStorage for collaboration form
                      sessionStorage.setItem('equipmentRequestData', JSON.stringify(formData));
                      onClose();
                      // Navigate to collaboration create page
                      window.location.href = '/collaborate/create?from=equipment-request';
                    }}
                    className="flex-shrink-0"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Convert to Collaboration
                  </Button>
                </div>
              </div>

              {/* Submit */}
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Creating...
                    </div>
                  ) : (
                    'Create Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
