'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  searchLocations, 
  getCurrentLocation, 
  reverseGeocode, 
  parseLocationResult, 
  getPopularCities,
  normalizeLocationText,
  type LocationResult,
  type ParsedLocation 
} from '@/lib/location-service'

interface LocationPickerProps {
  value?: string
  onChange: (location: string, parsedLocation?: ParsedLocation) => void
  placeholder?: string
  className?: string
  showCurrentLocation?: boolean
}

export default function LocationPicker({
  value = '',
  onChange,
  placeholder = 'Enter city, location...',
  className = '',
  showCurrentLocation = true
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<LocationResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPopular, setShowPopular] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const popularCities = getPopularCities()

  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setShowPopular(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setInputValue(query)
    onChange(query)

    if (query.length === 0) {
      setSuggestions([])
      setIsOpen(false)
      setShowPopular(true)
      return
    }

    if (query.length >= 2) {
      setIsLoading(true)
      try {
        const results = await searchLocations(query)
        setSuggestions(results)
        setIsOpen(true)
        setShowPopular(false)
      } catch (error) {
        console.error('Location search error:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }

  const handleLocationSelect = async (location: LocationResult | ParsedLocation) => {
    let parsedLocation: ParsedLocation
    
    if ('display_name' in location) {
      // It's a LocationResult from search
      parsedLocation = parseLocationResult(location)
    } else {
      // It's already a ParsedLocation from popular cities
      parsedLocation = location
    }

    setInputValue(parsedLocation.formatted_address)
    onChange(parsedLocation.formatted_address, parsedLocation)
    setIsOpen(false)
    setShowPopular(false)
  }

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    try {
      const coords = await getCurrentLocation()
      const locationData = await reverseGeocode(coords.lat, coords.lng)
      
      if (locationData) {
        const parsed = parseLocationResult(locationData)
        setInputValue(parsed.formatted_address)
        onChange(parsed.formatted_address, parsed)
        setIsOpen(false)
        setShowPopular(false)
      }
    } catch (error) {
      console.error('Current location error:', error)
      alert('Unable to get your current location. Please enter manually.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFocus = () => {
    if (inputValue.length === 0) {
      setShowPopular(true)
      setIsOpen(true)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="relative">
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={`w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${className}`}
          />
        </div>
        
        {showCurrentLocation && (
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Use current location"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-primary rounded-full"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 8v6m11-7h-6m-8 0H1" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(isOpen || showPopular) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-auto"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-3 text-gray-500 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-primary rounded-full mr-2"></div>
                Searching locations...
              </div>
            </div>
          )}

          {/* Popular cities */}
          {showPopular && !isLoading && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                Popular Cities
              </div>
              {popularCities.map((city) => (
                <button
                  key={city.place_id}
                  type="button"
                  onClick={() => handleLocationSelect(city)}
                  className="w-full px-4 py-3 text-left hover:bg-primary/10 focus:bg-primary-50 focus:outline-none transition-colors"
                >
                  <div className="font-medium text-gray-900">{city.city}</div>
                  <div className="text-sm text-gray-500">{city.country}</div>
                </button>
              ))}
            </>
          )}

          {/* Search results */}
          {!showPopular && suggestions.length > 0 && !isLoading && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                Search Results
              </div>
              {suggestions.map((location) => (
                <button
                  key={location.place_id}
                  type="button"
                  onClick={() => handleLocationSelect(location)}
                  className="w-full px-4 py-3 text-left hover:bg-primary/10 focus:bg-primary-50 focus:outline-none transition-colors"
                >
                  <div className="font-medium text-gray-900 truncate">
                    {location.address.city || location.address.town || location.address.village}
                    {location.address.city && location.address.county && ', ' + location.address.county}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {location.display_name}
                  </div>
                </button>
              ))}
            </>
          )}

          {/* No results */}
          {!showPopular && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
            <div className="px-4 py-4 text-gray-500 text-center">
              <div className="text-sm">No locations found</div>
              <div className="text-xs text-gray-400 mt-1">Try a different search term</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}