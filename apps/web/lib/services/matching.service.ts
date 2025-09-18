import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserMatch {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  verified: boolean;
  rating?: number;
  city?: string;
  country?: string;
  specializations?: string[];
  compatibility_score: number;
  match_reasons: string[];
}

export interface EquipmentMatch {
  listing_id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  rent_day_cents?: number;
  sale_price_cents?: number;
  location_city?: string;
  location_country?: string;
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
    rating?: number;
  };
  compatibility_score: number;
  match_reasons: string[];
}

export class MatchingService {
  /**
   * Find users who match project role requirements
   */
  static async findUsersForRole(
    roleId: string,
    limit: number = 10
  ): Promise<UserMatch[]> {
    try {
      // Get role details
      const { data: role, error: roleError } = await supabase
        .from('collab_roles')
        .select(`
          *,
          project:collab_projects(
            id,
            city,
            country,
            start_date,
            end_date
          )
        `)
        .eq('id', roleId)
        .single();

      if (roleError || !role) {
        throw new Error('Role not found');
      }

      // Build user query with compatibility scoring
      let query = supabase
        .from('users_profile')
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          verified,
          rating,
          city,
          country,
          specializations,
          bio,
          years_experience,
          hourly_rate_min,
          hourly_rate_max
        `)
        .eq('status', 'active')
        .limit(limit * 2); // Get more to filter and score

      // Apply basic filters
      if (role.project.city) {
        query = query.ilike('city', `%${role.project.city}%`);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) {
        throw new Error('Failed to fetch users');
      }

      // Score and rank users
      const scoredUsers = users.map(user => {
        const compatibility = this.calculateUserRoleCompatibility(user, role);
        return {
          user_id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          verified: user.verified,
          rating: user.rating,
          city: user.city,
          country: user.country,
          specializations: user.specializations,
          compatibility_score: compatibility.score,
          match_reasons: compatibility.reasons
        };
      });

      // Sort by compatibility score and return top matches
      return scoredUsers
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding users for role:', error);
      return [];
    }
  }

  /**
   * Find equipment listings that match project gear requests
   */
  static async findEquipmentForGearRequest(
    gearRequestId: string,
    limit: number = 10
  ): Promise<EquipmentMatch[]> {
    try {
      // Get gear request details
      const { data: gearRequest, error: gearRequestError } = await supabase
        .from('collab_gear_requests')
        .select(`
          *,
          project:collab_projects(
            id,
            city,
            country,
            start_date,
            end_date
          )
        `)
        .eq('id', gearRequestId)
        .single();

      if (gearRequestError || !gearRequest) {
        throw new Error('Gear request not found');
      }

      // Build listings query
      let query = supabase
        .from('listings')
        .select(`
          *,
          owner:users_profile!listings_owner_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating
          )
        `)
        .eq('status', 'active')
        .limit(limit * 2);

      // Apply category filter
      if (gearRequest.category) {
        query = query.ilike('category', `%${gearRequest.category}%`);
      }

      // Apply location filter
      if (gearRequest.project.city) {
        query = query.ilike('location_city', `%${gearRequest.project.city}%`);
      }

      const { data: listings, error: listingsError } = await query;

      if (listingsError) {
        throw new Error('Failed to fetch listings');
      }

      // Score and rank listings
      const scoredListings = listings.map(listing => {
        const compatibility = this.calculateEquipmentCompatibility(listing, gearRequest);
        return {
          listing_id: listing.id,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          condition: listing.condition,
          rent_day_cents: listing.rent_day_cents,
          sale_price_cents: listing.sale_price_cents,
          location_city: listing.location_city,
          location_country: listing.location_country,
          owner: listing.owner,
          compatibility_score: compatibility.score,
          match_reasons: compatibility.reasons
        };
      });

      // Sort by compatibility score and return top matches
      return scoredListings
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding equipment for gear request:', error);
      return [];
    }
  }

  /**
   * Calculate compatibility score between user and role
   */
  private static calculateUserRoleCompatibility(user: any, role: any): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Base score
    score += 20;
    reasons.push('Available user');

    // Skills matching (40% of score)
    if (role.skills_required && role.skills_required.length > 0) {
      const userSkills = user.specializations || [];
      const matchingSkills = role.skills_required.filter((skill: string) =>
        userSkills.some((userSkill: string) =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      const skillScore = (matchingSkills.length / role.skills_required.length) * 40;
      score += skillScore;

      if (matchingSkills.length > 0) {
        reasons.push(`Has ${matchingSkills.length}/${role.skills_required.length} required skills`);
      }
    }

    // Location matching (20% of score)
    if (role.project.city && user.city) {
      if (user.city.toLowerCase().includes(role.project.city.toLowerCase()) ||
          role.project.city.toLowerCase().includes(user.city.toLowerCase())) {
        score += 20;
        reasons.push('Same location');
      } else if (user.country === role.project.country) {
        score += 10;
        reasons.push('Same country');
      }
    }

    // Experience level (15% of score)
    if (user.years_experience) {
      if (user.years_experience >= 5) {
        score += 15;
        reasons.push('Experienced professional');
      } else if (user.years_experience >= 2) {
        score += 10;
        reasons.push('Some experience');
      } else {
        score += 5;
        reasons.push('Beginner');
      }
    }

    // Rating bonus (5% of score)
    if (user.rating && user.rating >= 4.5) {
      score += 5;
      reasons.push('High rating');
    } else if (user.rating && user.rating >= 4.0) {
      score += 3;
      reasons.push('Good rating');
    }

    // Verification bonus (5% of score)
    if (user.verified) {
      score += 5;
      reasons.push('Verified user');
    }

    return {
      score: Math.min(score, 100), // Cap at 100%
      reasons
    };
  }

  /**
   * Calculate compatibility score between equipment listing and gear request
   */
  private static calculateEquipmentCompatibility(listing: any, gearRequest: any): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Base score
    score += 20;
    reasons.push('Available equipment');

    // Category matching (30% of score)
    if (gearRequest.category && listing.category) {
      if (listing.category.toLowerCase().includes(gearRequest.category.toLowerCase()) ||
          gearRequest.category.toLowerCase().includes(listing.category.toLowerCase())) {
        score += 30;
        reasons.push('Category match');
      } else {
        score += 10;
        reasons.push('Related category');
      }
    }

    // Price compatibility (25% of score)
    if (gearRequest.max_daily_rate_cents && listing.rent_day_cents) {
      if (listing.rent_day_cents <= gearRequest.max_daily_rate_cents) {
        score += 25;
        reasons.push('Within budget');
      } else if (listing.rent_day_cents <= gearRequest.max_daily_rate_cents * 1.2) {
        score += 15;
        reasons.push('Slightly over budget');
      } else {
        score += 5;
        reasons.push('Over budget');
      }
    }

    // Location matching (15% of score)
    if (gearRequest.project.city && listing.location_city) {
      if (listing.location_city.toLowerCase().includes(gearRequest.project.city.toLowerCase()) ||
          gearRequest.project.city.toLowerCase().includes(listing.location_city.toLowerCase())) {
        score += 15;
        reasons.push('Same location');
      } else if (listing.location_country === gearRequest.project.country) {
        score += 10;
        reasons.push('Same country');
      }
    }

    // Condition preference (5% of score)
    if (listing.condition === 'new' || listing.condition === 'like_new') {
      score += 5;
      reasons.push('Excellent condition');
    } else if (listing.condition === 'good') {
      score += 3;
      reasons.push('Good condition');
    }

    // Owner verification (5% of score)
    if (listing.owner.verified) {
      score += 5;
      reasons.push('Verified owner');
    }

    return {
      score: Math.min(score, 100), // Cap at 100%
      reasons
    };
  }

  /**
   * Get project matches for a user (projects they might be interested in)
   */
  static async findProjectsForUser(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Get projects with roles
      const { data: projects, error: projectsError } = await supabase
        .from('collab_projects')
        .select(`
          *,
          creator:users_profile!collab_projects_creator_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating
          ),
          collab_roles(
            id,
            role_name,
            skills_required,
            is_paid,
            compensation_details,
            headcount,
            status
          )
        `)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .limit(limit * 2);

      if (projectsError) {
        throw new Error('Failed to fetch projects');
      }

      // Score projects based on user compatibility
      const scoredProjects = projects.map(project => {
        const compatibility = this.calculateUserProjectCompatibility(user, project);
        return {
          ...project,
          compatibility_score: compatibility.score,
          match_reasons: compatibility.reasons
        };
      });

      // Sort by compatibility score and return top matches
      return scoredProjects
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding projects for user:', error);
      return [];
    }
  }

  /**
   * Calculate compatibility between user and project
   */
  private static calculateUserProjectCompatibility(user: any, project: any): {
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    // Base score
    score += 10;
    reasons.push('Available project');

    // Location matching (30% of score)
    if (project.city && user.city) {
      if (user.city.toLowerCase().includes(project.city.toLowerCase()) ||
          project.city.toLowerCase().includes(user.city.toLowerCase())) {
        score += 30;
        reasons.push('Same location');
      } else if (user.country === project.country) {
        score += 20;
        reasons.push('Same country');
      }
    }

    // Skills matching (40% of score)
    const userSkills = user.specializations || [];
    const projectSkills = project.collab_roles.flatMap((role: any) => role.skills_required || []);
    
    if (projectSkills.length > 0) {
      const matchingSkills = projectSkills.filter((skill: string) =>
        userSkills.some((userSkill: string) =>
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );

      const skillScore = (matchingSkills.length / projectSkills.length) * 40;
      score += skillScore;

      if (matchingSkills.length > 0) {
        reasons.push(`Matches ${matchingSkills.length}/${projectSkills.length} project skills`);
      }
    }

    // Paid opportunities bonus (10% of score)
    const hasPaidRoles = project.collab_roles.some((role: any) => role.is_paid);
    if (hasPaidRoles) {
      score += 10;
      reasons.push('Includes paid roles');
    }

    // Creator verification bonus (10% of score)
    if (project.creator.verified) {
      score += 10;
      reasons.push('Verified creator');
    }

    return {
      score: Math.min(score, 100), // Cap at 100%
      reasons
    };
  }
}
