/**
 * Social Platform Utilities
 * Handles automatic platform URL generation and username validation
 */

export interface SocialPlatform {
  name: string
  baseUrl: string
  urlFormat: (username: string) => string
  extractUsername: (input: string) => string | null
  validateUsername: (username: string) => boolean
  placeholder: string
  icon: string
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  instagram: {
    name: 'Instagram',
    baseUrl: 'https://instagram.com/',
    urlFormat: (username: string) => `https://instagram.com/${username}`,
    extractUsername: (input: string) => {
      // Handle various input formats
      if (!input.trim()) return null
      
      // Full Instagram URL
      const urlMatch = input.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i)
      if (urlMatch) return urlMatch[1]
      
      // Username with or without @
      const cleanUsername = input.replace(/^@/, '').trim()
      return cleanUsername.match(/^[A-Za-z0-9._]+$/) ? cleanUsername : null
    },
    validateUsername: (username: string) => {
      return /^[A-Za-z0-9._]{1,30}$/.test(username)
    },
    placeholder: 'username',
    icon: 'instagram'
  },
  
  tiktok: {
    name: 'TikTok',
    baseUrl: 'https://tiktok.com/@',
    urlFormat: (username: string) => `https://tiktok.com/@${username}`,
    extractUsername: (input: string) => {
      if (!input.trim()) return null
      
      // Full TikTok URL
      const urlMatch = input.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]+)/i)
      if (urlMatch) return urlMatch[1]
      
      // Username with or without @
      const cleanUsername = input.replace(/^@/, '').trim()
      return cleanUsername.match(/^[A-Za-z0-9._]+$/) ? cleanUsername : null
    },
    validateUsername: (username: string) => {
      return /^[A-Za-z0-9._]{2,24}$/.test(username)
    },
    placeholder: 'username',
    icon: 'music'
  },
  
  twitter: {
    name: 'Twitter/X',
    baseUrl: 'https://twitter.com/',
    urlFormat: (username: string) => `https://twitter.com/${username}`,
    extractUsername: (input: string) => {
      if (!input.trim()) return null
      
      // Full Twitter/X URL
      const urlMatch = input.match(/(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com)\/([A-Za-z0-9_]+)/i)
      if (urlMatch) return urlMatch[2]
      
      // Username with or without @
      const cleanUsername = input.replace(/^@/, '').trim()
      return cleanUsername.match(/^[A-Za-z0-9_]+$/) ? cleanUsername : null
    },
    validateUsername: (username: string) => {
      return /^[A-Za-z0-9_]{1,15}$/.test(username)
    },
    placeholder: 'username',
    icon: 'twitter'
  },

  linkedin: {
    name: 'LinkedIn',
    baseUrl: 'https://linkedin.com/in/',
    urlFormat: (username: string) => `https://linkedin.com/in/${username}`,
    extractUsername: (input: string) => {
      if (!input.trim()) return null
      
      // Full LinkedIn URL
      const urlMatch = input.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9-]+)/i)
      if (urlMatch) return urlMatch[1]
      
      // Just the username part
      const cleanUsername = input.trim()
      return cleanUsername.match(/^[A-Za-z0-9-]+$/) ? cleanUsername : null
    },
    validateUsername: (username: string) => {
      return /^[A-Za-z0-9-]{3,100}$/.test(username)
    },
    placeholder: 'username',
    icon: 'linkedin'
  }
}

// Country codes for phone numbers
export interface CountryCode {
  code: string
  country: string
  flag: string
  pattern: RegExp
  placeholder: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+353', country: 'Ireland', flag: '🇮🇪', pattern: /^\+353[0-9]{8,9}$/, placeholder: '87 123 4567' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', pattern: /^\+44[0-9]{10}$/, placeholder: '7700 900123' },
  { code: '+1', country: 'United States', flag: '🇺🇸', pattern: /^\+1[0-9]{10}$/, placeholder: '555 123 4567' },
  { code: '+33', country: 'France', flag: '🇫🇷', pattern: /^\+33[0-9]{9}$/, placeholder: '6 12 34 56 78' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', pattern: /^\+49[0-9]{10,11}$/, placeholder: '30 12345678' },
  { code: '+34', country: 'Spain', flag: '🇪🇸', pattern: /^\+34[0-9]{9}$/, placeholder: '612 345 678' },
  { code: '+39', country: 'Italy', flag: '🇮🇹', pattern: /^\+39[0-9]{9,10}$/, placeholder: '320 123 4567' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', pattern: /^\+31[0-9]{9}$/, placeholder: '6 12345678' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪', pattern: /^\+32[0-9]{8,9}$/, placeholder: '470 123 456' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭', pattern: /^\+41[0-9]{9}$/, placeholder: '76 123 45 67' }
]

// Non-social platform utilities
export interface ContactPlatform {
  name: string
  processInput: (input: string, selectedCountryCode?: string) => { value: string; displayValue: string; isValid: boolean; error: string | null }
  placeholder: string
}

export const CONTACT_PLATFORMS: Record<string, ContactPlatform> = {
  website: {
    name: 'Website',
    processInput: (input: string) => {
      if (!input.trim()) return { value: '', displayValue: '', isValid: true, error: null }
      
      let processedUrl = input.trim()
      
      // Add https:// if no protocol specified
      if (!processedUrl.match(/^https?:\/\//)) {
        processedUrl = `https://${processedUrl}`
      }
      
      // Basic URL validation
      try {
        const url = new URL(processedUrl)
        // Only include pathname if it's not just the root "/"
        const pathPart = url.pathname === '/' ? '' : url.pathname
        return {
          value: processedUrl,
          displayValue: url.hostname + pathPart + url.search + url.hash,
          isValid: true,
          error: null
        }
      } catch {
        return {
          value: input,
          displayValue: input,
          isValid: false,
          error: 'Please enter a valid website URL'
        }
      }
    },
    placeholder: 'example.com'
  },
  
  phone: {
    name: 'Phone',
    processInput: (input: string, selectedCountryCode: string = '+353') => {
      if (!input.trim()) return { value: '', displayValue: '', isValid: true, error: null }
      
      let processedPhone = input.trim()
      
      // Remove any existing country code and clean input
      processedPhone = processedPhone.replace(/^\+\d{1,4}/, '').replace(/^0+/, '')
      
      // Add selected country code
      processedPhone = `${selectedCountryCode}${processedPhone.replace(/[\s\-()]/g, '')}`
      
      // Find country config for validation
      const countryConfig = COUNTRY_CODES.find(c => c.code === selectedCountryCode)
      
      let isValid = true
      let error: string | null = null
      
      if (countryConfig) {
        // Use country-specific validation
        isValid = countryConfig.pattern.test(processedPhone)
        if (!isValid) {
          error = `Please enter a valid ${countryConfig.country} phone number`
        }
      } else {
        // Fallback to basic validation
        const phonePattern = /^\+\d{1,4}\d{7,15}$/
        isValid = phonePattern.test(processedPhone)
        if (!isValid) {
          error = 'Please enter a valid phone number'
        }
      }
      
      return {
        value: processedPhone,
        displayValue: processedPhone,
        isValid,
        error
      }
    },
    placeholder: '87 123 4567'
  }
}

/**
 * Process contact platform input (website, phone) with auto-formatting
 */
export function processContactInput(platform: keyof typeof CONTACT_PLATFORMS, input: string, selectedCountryCode?: string) {
  const platformConfig = CONTACT_PLATFORMS[platform]
  if (!platformConfig) {
    return { value: input, displayValue: input, isValid: false, error: 'Unknown platform' }
  }

  return platformConfig.processInput(input, selectedCountryCode)
}

/**
 * Process social platform input and return both username and URL
 */
export function processSocialInput(platform: keyof typeof SOCIAL_PLATFORMS, input: string) {
  const platformConfig = SOCIAL_PLATFORMS[platform]
  if (!platformConfig) {
    return { username: null, url: null, isValid: false, error: 'Unknown platform' }
  }

  const username = platformConfig.extractUsername(input)
  
  if (!username) {
    return { 
      username: null, 
      url: null, 
      isValid: false, 
      error: input.trim() ? 'Invalid username format' : null 
    }
  }

  if (!platformConfig.validateUsername(username)) {
    return { 
      username, 
      url: null, 
      isValid: false, 
      error: `Invalid ${platformConfig.name} username format` 
    }
  }

  const url = platformConfig.urlFormat(username)
  
  return {
    username,
    url,
    isValid: true,
    error: null
  }
}

/**
 * Get display name with @ prefix for platforms that use it
 */
export function getDisplayName(platform: keyof typeof SOCIAL_PLATFORMS, username: string): string {
  if (!username) return ''
  
  // Platforms that display with @ prefix
  const atPlatforms = ['instagram', 'tiktok', 'twitter']
  
  if (atPlatforms.includes(platform)) {
    return `@${username}`
  }
  
  return username
}

/**
 * Validate and clean multiple social inputs
 */
export function processSocialInputs(inputs: Record<string, string>) {
  const results: Record<string, {
    username: string | null
    url: string | null
    displayName: string
    isValid: boolean
    error: string | null
  }> = {}

  for (const [platform, input] of Object.entries(inputs)) {
    const processed = processSocialInput(platform as keyof typeof SOCIAL_PLATFORMS, input)
    results[platform] = {
      ...processed,
      displayName: processed.username ? getDisplayName(platform as keyof typeof SOCIAL_PLATFORMS, processed.username) : ''
    }
  }

  return results
}

/**
 * Get platform icon name for UI components
 */
export function getPlatformIcon(platform: keyof typeof SOCIAL_PLATFORMS): string {
  return SOCIAL_PLATFORMS[platform]?.icon || 'link'
}