'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Briefcase } from 'lucide-react';
import { VerificationBadge } from '@/components/VerificationBadge';

interface VerificationBadgeData {
  id: string;
  badge_type: 'verified_identity' | 'verified_professional' | 'verified_business';
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

interface DirectoryProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  primary_skill?: string;
  created_at: string;
  account_type?: string[];
  availability_status?: string;
  verified_id?: boolean;
  verification_badges?: VerificationBadgeData[];
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
        const roles = profile.account_type || [];
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="group cursor-pointer"
            >
              {/* Profile Image Container */}
              <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-muted">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const fallbackUrl = '/placeholder-avatar.jpg';
                      if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                        (e.target as HTMLImageElement).src = fallbackUrl;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-2xl font-bold text-primary/60">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Overlay gradient for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Verification Badge - Top Right (only show if verified) */}
                {(() => {
                  // Check for active verification badges
                  const activeBadges = profile.verification_badges?.filter(badge => 
                    !badge.revoked_at && (!badge.expires_at || new Date(badge.expires_at) > new Date())
                  ) || [];
                  
                  // Show badge if user has any active verification badges OR the old verified_id is true
                  const hasVerification = activeBadges.length > 0 || profile.verified_id;
                  
                  if (!hasVerification) return null;
                  
                  // Determine badge type (prioritize identity > professional > business)
                  const badgeType = activeBadges.find(b => b.badge_type === 'verified_identity')?.badge_type || 
                                  activeBadges.find(b => b.badge_type === 'verified_professional')?.badge_type ||
                                  activeBadges.find(b => b.badge_type === 'verified_business')?.badge_type ||
                                  'verified_identity';
                  
                  return (
                    <div className="absolute top-2 right-2">
                      <VerificationBadge 
                        type={badgeType as any}
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                  );
                })()}

              </div>

              {/* Profile Info */}
              <div className="text-center">
                <h3 className="text-foreground font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                  {profile.display_name.toUpperCase()}
                </h3>
                
                {/* Primary Role/Specialization */}
                {profile.primary_skill && (
                  <p className="text-muted-foreground text-sm mb-2">
                    {profile.primary_skill}
                  </p>
                )}

                {/* Location */}
                {profile.city && (
                  <p className="text-xs text-muted-foreground mb-3">
                    📍 {profile.city}
                  </p>
                )}

                {/* Action Button */}
                <div className="flex gap-2">
                  <Link
                    href={`/users/${profile.handle}`}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium text-center"
                  >
                    CONNECT
                  </Link>
                </div>
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
