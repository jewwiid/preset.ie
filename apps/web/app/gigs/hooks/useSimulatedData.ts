import { Gig } from '../types';
import { extractCityFromLocation, extractCountryFromLocation } from '../utils';

/**
 * Custom hook for managing simulated/mock data
 * Used to enhance gigs with additional metadata for filtering
 */
export const useSimulatedData = () => {
  // Available style tags
  const availableStyleTags = [
    'fashion', 'portrait', 'urban', 'commercial', 'product', 'beauty',
    'wedding', 'documentary', 'event', 'lifestyle', 'headshots',
    'street', 'editorial', 'conceptual', 'nature', 'architecture'
  ];

  // Available vibe tags
  const availableVibeTags = [
    'creative', 'professional', 'modern', 'clean', 'bright', 'romantic',
    'intimate', 'natural', 'confident', 'edgy', 'dynamic', 'moody',
    'minimalist', 'vintage', 'dramatic', 'warm', 'cool', 'artistic'
  ];

  /**
   * Generates simulated data for a gig based on its attributes
   * @param gig - The gig to enhance with simulated data
   */
  const getSimulatedGigData = (gig: Gig): Partial<Gig> => {
    const simulatedData: Partial<Gig> = {
      style_tags: [],
      vibe_tags: [],
      city: extractCityFromLocation(gig.location_text, undefined),
      country: extractCountryFromLocation(gig.location_text, undefined),
      palette_colors: gig.palette_colors || getSimulatedPaletteColors(gig.purpose, gig.title)
    };

    // Add style tags based on title and purpose
    const title = gig.title.toLowerCase();
    const purpose = gig.purpose?.toLowerCase() || '';

    if (title.includes('fashion') || purpose === 'fashion') simulatedData.style_tags?.push('fashion');
    if (title.includes('portrait') || purpose === 'portrait') simulatedData.style_tags?.push('portrait');
    if (title.includes('commercial') || purpose === 'commercial') simulatedData.style_tags?.push('commercial');
    if (title.includes('wedding') || purpose === 'wedding') simulatedData.style_tags?.push('wedding', 'documentary', 'event');
    if (title.includes('headshots') || title.includes('lifestyle')) simulatedData.style_tags?.push('headshots', 'lifestyle');
    if (title.includes('street') || title.includes('urban')) simulatedData.style_tags?.push('street', 'urban');
    if (title.includes('product')) simulatedData.style_tags?.push('product', 'commercial');
    if (title.includes('beauty')) simulatedData.style_tags?.push('beauty', 'commercial');

    // Add vibe tags based on context
    if (title.includes('creative')) simulatedData.vibe_tags?.push('creative');
    if (purpose === 'commercial' || title.includes('professional')) simulatedData.vibe_tags?.push('professional', 'clean');
    if (title.includes('modern') || title.includes('contemporary')) simulatedData.vibe_tags?.push('modern');
    if (purpose === 'wedding' || title.includes('wedding')) simulatedData.vibe_tags?.push('romantic', 'intimate', 'natural');
    if (title.includes('street') || title.includes('urban')) simulatedData.vibe_tags?.push('edgy', 'dynamic');
    if (title.includes('lifestyle') || title.includes('headshots')) simulatedData.vibe_tags?.push('confident', 'natural');

    return simulatedData;
  };

  /**
   * Generates palette colors based on gig purpose and title
   * @param purpose - The purpose type of the gig
   * @param title - The title of the gig
   */
  const getSimulatedPaletteColors = (purpose?: string, title?: string): string[] => {
    if (purpose === 'FASHION' || title?.toLowerCase().includes('fashion')) {
      return ['#E8D5C4', '#C7B299', '#A08A7A', '#8B7267']; // warm fashion tones
    }
    if (purpose === 'COMMERCIAL' || title?.toLowerCase().includes('commercial')) {
      return ['#2D3748', '#4A5568', '#718096', '#A0AEC0']; // professional grays
    }
    if (purpose === 'WEDDING' || title?.toLowerCase().includes('wedding')) {
      return ['#FED7D7', '#FBB6CE', '#ED8936', '#DD6B20']; // romantic pastels
    }
    if (title?.toLowerCase().includes('lifestyle') || title?.toLowerCase().includes('headshots')) {
      return ['#E6FFFA', '#B2F5EA', '#4FD1C7', '#319795']; // fresh teals
    }
    return ['#F7FAFC', '#EDF2F7', '#CBD5E0', '#A0AEC0']; // neutral default
  };

  return {
    availableStyleTags,
    availableVibeTags,
    getSimulatedGigData,
    getSimulatedPaletteColors
  };
};
