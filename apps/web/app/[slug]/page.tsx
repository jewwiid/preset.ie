import React from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import TalentDirectoryClient from './TalentDirectoryClient';

interface VerificationBadge {
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
  verified_id?: boolean;
  verification_badges?: VerificationBadge[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Server-side data fetching
async function getTalentCategories() {
  try {
    if (!supabase) return [];
    
    // Fetch from both contributor roles and talent categories
    const [contributorResult, talentResult] = await Promise.all([
      supabase
        .from('predefined_roles')
        .select('name')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('predefined_talent_categories')
        .select('category_name')
        .eq('is_active', true)
        .order('sort_order')
    ]);

    const contributorRoles = contributorResult.data || [];
    const talentCategories = talentResult.data || [];

    // Combine all roles and convert to URL-friendly slugs
    const allRoles = [
      ...contributorRoles.map(role => role.name),
      ...talentCategories.map(category => category.category_name)
    ];

    return allRoles.map(roleName => {
      const baseName = roleName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Add 's' to make it plural for the URL
      return baseName.endsWith('s') ? baseName : baseName + 's';
    });
  } catch (err) {
    console.error('Error in getTalentCategories:', err);
    return [];
  }
}


async function getTalentProfiles(skillSlug: string) {
  try {
    // Normalize the skill from URL (e.g., "photographers" -> "photographer")
    let normalizedSkill = skillSlug.toLowerCase()
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/ies$/, 'y') // "agencies" -> "agency"  
      .replace(/s$/, ''); // "photographers" -> "photographer"
    
    // Capitalize first letter of each word to match database format
    normalizedSkill = normalizedSkill.replace(/\b\w/g, l => l.toUpperCase());

    // Fetch profiles from database
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('users_profile')
      .select(`
        id,
        user_id,
        display_name,
        handle,
        avatar_url,
        bio,
        city,
        country,
        account_type,
        style_tags,
        vibe_tags,
        professional_skills,
        talent_categoriess,
        contributor_roles,
        years_experience,
        account_status,
        profile_completion_percentage,
        verified_id,
        created_at,
        availability_status
      `)
      .in('account_status', ['active', 'pending_verification'])
      .gte('profile_completion_percentage', 0)
      .not('avatar_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    
    // Fetch verification badges separately
    if (data && data.length > 0) {
      const userIds = data.map(p => p.user_id);
      const { data: badges } = await supabase
        .from('verification_badges')
        .select('*')
        .in('user_id', userIds)
        .is('revoked_at', null); // Only active badges
      
      // Attach badges to profiles
      if (badges) {
        data.forEach((profile: any) => {
          profile.verification_badges = badges.filter(b => b.user_id === profile.user_id);
        });
      }
    }

    // Filter profiles by skill category - only use explicit role fields
    const filteredData = (data || []).filter((profile: any) => {
      const profileSkills = [
        ...(profile.professional_skills || []),
        ...(profile.talent_categoriess || []),
        ...(profile.contributor_roles || [])
      ].map(s => s.toLowerCase());
      
      const searchSkill = normalizedSkill.toLowerCase();
      
      return profileSkills.some(skill => 
        skill.includes(searchSkill) ||
        searchSkill.includes(skill) ||
        // Special case for photographer
        (searchSkill === 'photographer' && skill.includes('photography'))
      );
    });

    return filteredData;
  } catch (err) {
    console.error('Error in getTalentProfiles:', err);
    return [];
  }
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch data server-side
  const [talentCategories, profiles] = await Promise.all([
    getTalentCategories(),
    getTalentProfiles(slug)
  ]);

  // Check if this is a talent category
  const isTalentCategory = talentCategories.includes(slug.toLowerCase());

  if (isTalentCategory) {
    const displayName = slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {displayName}
            </h1>
            <p className="text-muted-foreground">
              Discover talented {slug.toLowerCase()} in your area
            </p>
          </div>

          {/* Client component for interactivity */}
          <TalentDirectoryClient 
            initialProfiles={profiles}
            category={slug}
            displayName={displayName}
          />
        </div>
      </div>
    );
  }

  // If not a talent category, redirect to user profile route
  if (!isTalentCategory) {
    redirect(`/users/${slug}`);
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Page not found</h1>
      <p className="text-muted-foreground mb-4">
        The page "{slug}" could not be found.
      </p>
      <div className="mt-4">
        <Link href="/" className="text-primary hover:underline">
          ← Go back to home
        </Link>
      </div>
    </div>
  );
}