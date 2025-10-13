/**
 * Applications Module - useApplications Hook
 *
 * Fetches and normalizes both gig and collaboration applications.
 * Handles loading states and data transformation.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Application, ViewMode, UserProfile } from '../types';
import {
  normalizeGigApplication,
  normalizeCollaborationApplication,
} from '../lib/applicationHelpers';

interface UseApplicationsOptions {
  profile: UserProfile | null;
  viewMode: ViewMode;
  autoFetch?: boolean;
}

interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage applications based on view mode
 */
export function useApplications({
  profile,
  viewMode,
  autoFetch = true,
}: UseApplicationsOptions): UseApplicationsReturn {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!profile) {
      console.log('Applications: No profile available yet');
      setLoading(false);
      return;
    }

    console.log(
      'Applications: Fetching applications for user:',
      profile.id,
      'viewMode:',
      viewMode
    );

    try {
      setLoading(true);
      setError(null);

      if (viewMode === 'admin') {
        await fetchAdminApplications();
      } else if (viewMode === 'contributor') {
        await fetchContributorApplications();
      } else {
        await fetchTalentApplications();
      }
    } catch (err: any) {
      console.error('Applications: Critical error in fetchApplications:', err);
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [profile, viewMode]);

  /**
   * Fetch all applications for admin view
   */
  const fetchAdminApplications = async () => {
    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    console.log('Applications: Admin mode - fetching all platform applications...');

    const { data, error: fetchError } = await supabase
      .from('applications')
      .select(
        `
        *,
        gig:gigs(
          id,
          title,
          comp_type,
          start_time,
          location_text,
          owner_user_id,
          users_profile!owner_user_id(
            display_name,
            handle,
            avatar_url
          )
        ),
        applicant:users_profile(
          id,
          display_name,
          avatar_url,
          handle,
          bio,
          city,
          style_tags,
          role_flags,
          subscription_tier,
          created_at
        )
      `
      )
      .order('applied_at', { ascending: false })
      .limit(200); // Limit to recent 200 for performance

    if (fetchError) {
      throw new Error(`Failed to fetch admin applications: ${fetchError.message}`);
    }

    console.log(
      'Applications: Successfully fetched',
      data?.length || 0,
      'applications for admin'
    );

    const normalized = (data || []).map(normalizeGigApplication);
    setApplications(normalized);
  };

  /**
   * Fetch applications for gigs owned by the contributor
   */
  const fetchContributorApplications = async () => {
    if (!supabase || !profile) {
      throw new Error('Supabase client not configured or profile missing');
    }

    console.log('Applications: Contributor mode - fetching owned gigs first...');

    // First, get all gigs owned by the contributor
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('id')
      .eq('owner_user_id', profile.id);

    if (gigsError) {
      throw new Error(`Failed to fetch user gigs: ${gigsError.message}`);
    }

    console.log('Applications: Found', gigs?.length || 0, 'gigs owned by user');

    if (!gigs || gigs.length === 0) {
      setApplications([]);
      return;
    }

    const gigIds = gigs.map((g) => g.id);
    console.log('Applications: Fetching applications for gig IDs:', gigIds);

    const { data, error: fetchError } = await supabase
      .from('applications')
      .select(
        `
        *,
        gig:gigs(
          id,
          title,
          comp_type,
          start_time,
          location_text
        ),
        applicant:users_profile(
          id,
          display_name,
          avatar_url,
          handle,
          bio,
          city,
          style_tags
        )
      `
      )
      .in('gig_id', gigIds)
      .order('applied_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch contributor applications: ${fetchError.message}`);
    }

    console.log(
      'Applications: Successfully fetched',
      data?.length || 0,
      'applications'
    );

    const normalized = (data || []).map(normalizeGigApplication);
    setApplications(normalized);
  };

  /**
   * Fetch applications submitted by the talent (both gigs and collaborations)
   */
  const fetchTalentApplications = async () => {
    if (!supabase || !profile) {
      throw new Error('Supabase client not configured or profile missing');
    }

    console.log('Applications: Talent mode - fetching user applications...');

    // Fetch gig applications
    const { data: gigApplications, error: gigError } = await supabase
      .from('applications')
      .select(
        `
        *,
        gig:gigs(
          id,
          title,
          comp_type,
          start_time,
          location_text,
          owner_user_id,
          users_profile!owner_user_id(
            display_name,
            avatar_url,
            handle
          )
        )
      `
      )
      .eq('applicant_user_id', profile.id)
      .order('applied_at', { ascending: false });

    // Fetch collaboration project applications
    const { data: collabApplications, error: collabError } = await supabase
      .from('collab_applications')
      .select(
        `
        *,
        project:collab_projects(
          id,
          title,
          description,
          city,
          country,
          start_date,
          end_date,
          creator:users_profile!collab_projects_creator_id_fkey(
            id,
            handle,
            display_name,
            avatar_url
          )
        ),
        role:collab_roles(
          id,
          role_name,
          skills_required
        ),
        applicant:users_profile!collab_applications_applicant_id_fkey(
          id,
          display_name,
          avatar_url,
          handle,
          bio,
          city,
          style_tags,
          role_flags,
          subscription_tier,
          created_at
        )
      `
      )
      .eq('applicant_id', profile.id)
      .order('created_at', { ascending: false});

    if (gigError) {
      console.error('Applications: Error fetching gig applications:', gigError);
    }
    if (collabError) {
      console.error(
        'Applications: Error fetching collaboration applications:',
        collabError
      );
    }

    // Normalize gig applications
    const normalizedGigApps = (gigApplications || []).map(
      normalizeGigApplication
    );

    // Normalize collaboration applications with compatibility scores
    const normalizedCollabApps = await Promise.all(
      (collabApplications || []).map(async (app) => {
        // Calculate compatibility score for collaboration applications
        let compatibilityData = null;
        if (app.role?.id && app.applicant?.id && supabase) {
          try {
            const { data: compatResult, error: compatError } = await supabase.rpc(
              'calculate_collaboration_compatibility',
              {
                p_profile_id: app.applicant.id,
                p_role_id: app.role.id,
              }
            );

            if (!compatError && compatResult && compatResult.length > 0) {
              compatibilityData = compatResult[0];
            }
          } catch (error) {
            console.error('Error calculating compatibility:', error);
          }
        }

        return normalizeCollaborationApplication(
          {
            ...app,
            // Ensure applicant data is properly mapped
            applicant: app.applicant || {
              id: profile.id,
              display_name: profile.display_name || 'Unknown',
              avatar_url: profile.avatar_url,
              handle: profile.handle || 'unknown',
              bio: profile.bio,
              city: profile.city,
              style_tags: profile.style_tags,
              role_flags: profile.role_flags,
              subscription_tier: profile.subscription_tier,
              created_at: profile.created_at,
            },
          },
          compatibilityData
        );
      })
    );

    // Combine both types of applications
    const allApplications = [...normalizedGigApps, ...normalizedCollabApps].sort(
      (a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
    );

    console.log(
      'Applications: Successfully fetched',
      allApplications.length,
      'total applications (',
      normalizedGigApps.length,
      'gig +',
      normalizedCollabApps.length,
      'collaboration)'
    );

    setApplications(allApplications);
  };

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && profile) {
      fetchApplications();
    }
  }, [autoFetch, profile, viewMode]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}
