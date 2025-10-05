'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase } from 'lucide-react';

interface DirectoryProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  primary_skill?: string;
  created_at: string;
  role_flags?: string[];
  availability_status?: string;
}

interface TalentDirectoryClientProps {
  initialProfiles: DirectoryProfile[];
  category: string;
  displayName: string;
}

export default function TalentDirectoryClient({ 
  initialProfiles, 
  category, 
  displayName 
}: TalentDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical' | 'location'>('newest');
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'talent' | 'contributor'>('all');
  const [filteredProfiles, setFilteredProfiles] = useState<DirectoryProfile[]>(initialProfiles);


  // Filter and sort profiles based on search and filters
  useEffect(() => {
    let filtered = [...initialProfiles];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.display_name.toLowerCase().includes(query) ||
        profile.handle.toLowerCase().includes(query) ||
        profile.bio?.toLowerCase().includes(query) ||
        profile.city?.toLowerCase().includes(query)
      );
    }

    // Apply location filter
    if (locationFilter.trim()) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.city?.toLowerCase().includes(location)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(profile => {
        const roles = profile.role_flags || [];
        if (roleFilter === 'talent') {
          return roles.includes('TALENT') || roles.includes('BOTH');
        } else if (roleFilter === 'contributor') {
          return roles.includes('CONTRIBUTOR') || roles.includes('BOTH');
        }
        return true;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.display_name.localeCompare(b.display_name));
        break;
      case 'location':
        filtered.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredProfiles(filtered);
  }, [initialProfiles, searchQuery, locationFilter, roleFilter, sortBy]);

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, handle, bio, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Location Filter */}
          <div className="sm:w-64">
            <input
              type="text"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'talent' | 'contributor')}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="talent">Talent Only</option>
              <option value="contributor">Contributors Only</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'alphabetical' | 'location')}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="location">By Location</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredProfiles.length} of {initialProfiles.length} {category.toLowerCase()}
          {searchQuery && ` matching "${searchQuery}"`}
          {locationFilter && ` in "${locationFilter}"`}
          {roleFilter !== 'all' && ` (${roleFilter === 'talent' ? 'Talent' : 'Contributor'} only)`}
        </div>
      </div>

      {/* Profiles Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-card hover:bg-muted/50 transition-colors rounded-lg border p-6 group"
            >
              {/* Profile Header */}
              <div className="flex items-center mb-4">
                <div 
                  id={`avatar-${profile.id}`}
                  className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden relative"
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      onError={() => {
                        // Image failed to load, show fallback
                        const container = document.getElementById(`avatar-${profile.id}`);
                        if (container) {
                          const img = container.querySelector('img') as HTMLImageElement;
                          const fallback = container.querySelector('.avatar-fallback') as HTMLElement;
                          if (img) img.style.display = 'none';
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="avatar-fallback w-full h-full flex items-center justify-center text-lg font-semibold"
                    style={{ display: profile.avatar_url ? 'none' : 'flex' }}
                  >
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {profile.display_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{profile.handle}
                  </p>
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {profile.bio}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                {profile.city && (
                  <span className="flex items-center">
                    📍 {profile.city}
                  </span>
                )}
                <span>
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {/* Role Badge */}
              {/* Role and Availability Badges */}
              <div className="flex gap-1 mb-2 flex-wrap">
                {/* Role Badges */}
                {profile.role_flags && profile.role_flags.length > 0 && (
                  <>
                    {profile.role_flags.map((role, index) => (
                      <span
                        key={`role-${index}`}
                        className={`px-2 py-1 text-xs rounded-full ${
                          role === 'TALENT' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : role === 'CONTRIBUTOR'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : role === 'BOTH'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {role === 'BOTH' ? 'Both' : role}
                      </span>
                    ))}
                  </>
                )}
                
                {/* Availability Status Badge */}
                {profile.availability_status && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      profile.availability_status === 'available'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : profile.availability_status === 'limited'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : profile.availability_status === 'busy'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {profile.availability_status === 'available' && 'Available'}
                    {profile.availability_status === 'limited' && 'Limited'}
                    {profile.availability_status === 'busy' && 'Busy'}
                    {profile.availability_status === 'unavailable' && 'Unavailable'}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                       <Link
                         href={`/users/${profile.handle}`}
                         className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-center"
                       >
                         View Profile
                       </Link>
                <button
                  onClick={() => {
                    // TODO: Implement invitation functionality
                    console.log('Invite clicked for:', profile.handle);
                  }}
                  className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                >
                  ✉️ Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {initialProfiles.length === 0 
              ? `No ${category.toLowerCase()} found`
              : 'No results found'
            }
          </h3>
          <p className="text-muted-foreground mb-6">
            {initialProfiles.length === 0 
              ? `We don't have any ${category.toLowerCase()} in our directory yet.`
              : searchQuery || locationFilter || roleFilter !== 'all'
                ? 'Try adjusting your search criteria or clearing the filters.'
                : 'No profiles match your current filters.'
            }
          </p>
          {(searchQuery || locationFilter || roleFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('');
                setRoleFilter('all');
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  );
}
