import { DollarSign, Camera, Video, Sparkles } from 'lucide-react';
import { CompensationType } from './types';

export const colorDistance = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 999;

  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

export const hexToRgb = (hex: string): {r: number, g: number, b: number} | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const getCompTypeIcon = (type: CompensationType) => {
  switch (type) {
    case 'PAID':
      return <DollarSign className="w-4 h-4" />;
    case 'TFP':
      return <Camera className="w-4 h-4" />;
    case 'EXPENSES':
      return <Video className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export const getCompTypeColor = (type: CompensationType) => {
  switch (type) {
    case 'PAID':
      return 'bg-primary/10 text-primary';
    case 'TFP':
      return 'bg-secondary/20 text-secondary-foreground';
    case 'EXPENSES':
      return 'bg-muted/50 text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getDaysUntilDeadline = (deadline: string) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getLookingForLabel = (type: string) => {
  const labels: Record<string, string> = {
    'MODELS': '🎭 Models',
    'MODELS_FASHION': '👗 Fashion Models',
    'MODELS_COMMERCIAL': '📺 Commercial',
    'MODELS_FITNESS': '💪 Fitness',
    'MODELS_EDITORIAL': '📰 Editorial',
    'MODELS_RUNWAY': '🚶 Runway',
    'MODELS_HAND': '🤲 Hand',
    'MODELS_PARTS': '👤 Parts',
    'ACTORS': '🎬 Actors',
    'DANCERS': '💃 Dancers',
    'MUSICIANS': '🎵 Musicians',
    'SINGERS': '🎤 Singers',
    'VOICE_ACTORS': '🎙️ Voice Actors',
    'PERFORMERS': '🎪 Performers',
    'INFLUENCERS': '📱 Influencers',
    'PHOTOGRAPHERS': '📸 Photographers',
    'VIDEOGRAPHERS': '🎥 Videographers',
    'CINEMATOGRAPHERS': '🎞️ Cinematographers',
    'MAKEUP_ARTISTS': '💄 MUA',
    'HAIR_STYLISTS': '💇 Hair',
    'FASHION_STYLISTS': '👔 Fashion Stylist',
    'WARDROBE_STYLISTS': '👘 Wardrobe',
    'NAIL_ARTISTS': '💅 Nails',
    'SFX_MAKEUP': '🎭 SFX Makeup',
    'PRODUCTION_CREW': '🎬 Production',
    'PRODUCERS': '🎯 Producers',
    'DIRECTORS': '🎬 Directors',
    'ASSISTANT_DIRECTORS': '📋 AD',
    'CASTING_DIRECTORS': '🎭 Casting',
    'GAFFERS': '💡 Gaffer',
    'GRIPS': '🔧 Grip',
    'SOUND_ENGINEERS': '🔊 Sound',
    'EDITORS': '✂️ Editors',
    'VIDEO_EDITORS': '🎬 Video Editor',
    'PHOTO_EDITORS': '🖼️ Photo Editor',
    'COLOR_GRADERS': '🎨 Color',
    'VFX_ARTISTS': '✨ VFX',
    'ANIMATORS': '🎞️ Animator',
    'MOTION_GRAPHICS': '🎬 Motion',
    'DESIGNERS': '🎨 Designers',
    'GRAPHIC_DESIGNERS': '🖌️ Graphic',
    'UI_UX_DESIGNERS': '📱 UI/UX',
    'ART_DIRECTORS': '🎨 Art Director',
    'SET_DESIGNERS': '🏗️ Set Design',
    'PROP_STYLISTS': '🪴 Props',
    'CONTENT_CREATORS': '📱 Content',
    'SOCIAL_MEDIA_MANAGERS': '📲 Social',
    'COPYWRITERS': '✍️ Copy',
    'WRITERS': '📝 Writers',
    'BRAND_MANAGERS': '🏢 Brand',
    'AGENCIES': '🏢 Agencies',
    'TALENT_MANAGERS': '👥 Talent Mgr',
    'BOOKING_AGENTS': '📅 Booking',
    'EVENT_COORDINATORS': '🎉 Events',
    'OTHER': '🔧 Other'
  };
  return labels[type] || type;
};

export const extractCityFromLocation = (locationText: string, locationData?: string): string | undefined => {
  if (!locationText && !locationData) return undefined;

  // Try to parse from location_data first if available
  if (locationData) {
    try {
      const parsed = JSON.parse(locationData);
      if (parsed.city) return parsed.city;
    } catch (e) {
      // Continue to text parsing
    }
  }

  // Parse from text - assuming format like "City, Country" or "City, State"
  const parts = locationText.split(',').map(p => p.trim());
  return parts[0] || undefined;
};

export const extractCountryFromLocation = (locationText: string, locationData?: string): string | undefined => {
  if (!locationText && !locationData) return undefined;

  // Try to parse from location_data first if available
  if (locationData) {
    try {
      const parsed = JSON.parse(locationData);
      if (parsed.country) return parsed.country;
    } catch (e) {
      // Continue to text parsing
    }
  }

  // Parse from text - assuming format like "City, Country"
  const parts = locationText.split(',').map(p => p.trim());
  return parts[parts.length - 1] || undefined;
};

export const extractPaletteColors = (moodboards: any[]): string[] => {
  if (!moodboards || moodboards.length === 0) return [];

  const colors = new Set<string>();
  moodboards.forEach(mb => {
    if (mb.palette && Array.isArray(mb.palette)) {
      mb.palette.forEach((color: string) => {
        if (color && color.startsWith('#')) {
          colors.add(color.toUpperCase());
        }
      });
    }

    // Also check moodboard_items if available
    if (mb.moodboard_items && Array.isArray(mb.moodboard_items)) {
      mb.moodboard_items.forEach((item: any) => {
        if (item.palette && Array.isArray(item.palette)) {
          item.palette.forEach((color: string) => {
            if (color && color.startsWith('#')) {
              colors.add(color.toUpperCase());
            }
          });
        }
      });
    }
  });

  return Array.from(colors).slice(0, 5); // Limit to 5 colors
};
