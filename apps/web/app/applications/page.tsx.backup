'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { 
  Briefcase, Clock, CheckCircle, XCircle, MessageSquare, 
  Filter, Search, ChevronDown, Star, MapPin, Calendar,
  Users, Eye, Heart, MoreVertical, Shield, Ban, Flag, 
  Trash2, AlertTriangle, BarChart3, TrendingUp, UserCheck,
  ChevronDown as ChevronDownIcon, ChevronUp, DollarSign, 
  User, Settings, Target, Award, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '../../components/ui/badge';
import CompatibilityScore from '../../components/matchmaking/CompatibilityScore';
import { useCollaborationCompatibility } from '../../lib/hooks/useCollaborationCompatibility';

type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'DECLINED' | 'pending' | 'accepted' | 'rejected' | 'withdrawn';

interface Application {
  id: string;
  gig_id?: string;
  project_id?: string;
  applicant_user_id?: string;
  applicant_id?: string;
  note?: string;
  status: ApplicationStatus;
  applied_at: string;
  created_at?: string;
  application_type: 'gig' | 'collaboration';
  
  // Normalized fields for unified display
  project_title?: string;
  project_description?: string;
  project_location?: string;
  project_start_date?: string;
  project_creator?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  role_name?: string;
  skills_required?: string[];
  
  // Original gig data (for gig applications)
  gig?: {
    id: string;
    title: string;
    comp_type: string;
    start_time: string;
    location_text: string;
    owner_user_id?: string;
    users_profile?: {
      display_name: string;
      handle: string;
      avatar_url?: string;
    };
  };
  
  // Original project data (for collaboration applications)
  project?: {
    id: string;
    title: string;
    description?: string;
    city?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    creator?: {
      id: string;
      handle: string;
      display_name: string;
      avatar_url?: string;
    };
  };
  
  // Original role data (for collaboration applications)
  role?: {
    id: string;
    role_name: string;
    skills_required?: string[];
  };
  
        applicant: {
          id: string;
          display_name: string;
          avatar_url?: string;
          handle: string;
          bio?: string;
          city?: string;
          style_tags?: string[];
          role_flags?: string[];
          subscription_tier?: string;
          created_at?: string;
        };

        // Compatibility data for collaboration applications
        compatibility_score?: number;
        matched_skills?: string[];
        missing_skills?: string[];
      }

export default function ApplicationsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = (applicationId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const isCardExpanded = (applicationId: string) => expandedCards.has(applicationId);
  const [viewMode, setViewMode] = useState<'contributor' | 'talent' | 'admin'>('contributor');
  const [adminStats, setAdminStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    flaggedUsers: 0,
    recentBans: 0
  });
  const [showAdminActions, setShowAdminActions] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      // Set default view mode based on role
      if (userRole?.isAdmin) {
        setViewMode('admin');
      } else if (userRole?.isContributor) {
        setViewMode('contributor');
      } else if (userRole?.isTalent) {
        setViewMode('talent');
      } else {
        // Default fallback - should not happen with proper role assignment
        setViewMode('contributor');
      }
      
      // Fetch user profile
      fetchUserProfile();
    }
  }, [user, userRole, authLoading]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }

      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (profile && !authLoading) {
      fetchApplications();
    }
  }, [viewMode, profile]);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, selectedStatus, applications]);

  const fetchApplications = async () => {
    try {
      if (!profile) {
        console.log('Applications: No profile available yet')
        return;
      }

      console.log('Applications: Fetching applications for user:', profile.id, 'viewMode:', viewMode)
      setLoading(true);
      
      if (viewMode === 'admin') {
        console.log('Applications: Admin mode - fetching all platform applications...')
        // Fetch all applications across the platform for admin review
        if (!supabase) {
          console.error('Supabase client not configured')
          return
        }
        const { data, error } = await supabase
          .from('applications')
          .select(`
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
          `)
          .order('applied_at', { ascending: false })
          .limit(200); // Limit to recent 200 for performance
        
        if (error) {
          console.error('Applications: Error fetching all applications for admin:', error)
          throw error;
        }
        
        console.log('Applications: Successfully fetched', data?.length || 0, 'applications for admin')
        setApplications(data || []);
        
        // Fetch admin stats
        await fetchAdminStats();
      } else if (viewMode === 'contributor') {
        console.log('Applications: Contributor mode - fetching owned gigs first...')
        // Fetch applications for gigs owned by the contributor
        if (!supabase) {
          console.error('Supabase client not configured')
          return
        }
        const { data: gigs, error: gigsError } = await supabase
          .from('gigs')
          .select('id')
          .eq('owner_user_id', profile.id);
          
        if (gigsError) {
          console.error('Applications: Error fetching user gigs:', gigsError)
          throw gigsError
        }
        
        console.log('Applications: Found', gigs?.length || 0, 'gigs owned by user')
        
        if (!gigs || gigs.length === 0) {
          setApplications([]);
          return;
        }
        
        const gigIds = gigs.map(g => g.id);
        console.log('Applications: Fetching applications for gig IDs:', gigIds)
        
        if (!supabase) {
          console.error('Supabase client not configured')
          return
        }
        const { data, error } = await supabase
          .from('applications')
          .select(`
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
          `)
          .in('gig_id', gigIds)
          .order('applied_at', { ascending: false });
        
        if (error) {
          console.error('Applications: Error fetching applications for contributor:', error)
          throw error;
        }
        
        console.log('Applications: Successfully fetched', data?.length || 0, 'applications')
        setApplications(data || []);
      } else {
        console.log('Applications: Talent mode - fetching user applications...')
        // Fetch applications submitted by the talent (both gigs and collaboration projects)
        if (!supabase) {
          console.error('Supabase client not configured')
          return
        }

        // Fetch gig applications
        const { data: gigApplications, error: gigError } = await supabase
          .from('applications')
          .select(`
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
          `)
          .eq('applicant_user_id', profile.id)
          .order('applied_at', { ascending: false });

        // Fetch collaboration project applications
        const { data: collabApplications, error: collabError } = await supabase
          .from('collab_applications')
          .select(`
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
          `)
          .eq('applicant_id', profile.id)
          .order('created_at', { ascending: false });

        if (gigError) {
          console.error('Applications: Error fetching gig applications:', gigError)
        }
        if (collabError) {
          console.error('Applications: Error fetching collaboration applications:', collabError)
        }

        // Combine and normalize the data
        const normalizedGigApps = (gigApplications || []).map(app => ({
          ...app,
          application_type: 'gig',
          project_title: app.gig?.title,
          project_description: app.gig?.comp_type,
          project_location: app.gig?.location_text,
          project_start_date: app.gig?.start_time,
          project_creator: app.gig?.users_profile,
          applied_at: app.applied_at
        }));

        const normalizedCollabApps = await Promise.all((collabApplications || []).map(async app => {
          // Calculate compatibility score for collaboration applications
          let compatibilityData = null;
          if (app.role?.id && app.applicant?.id && supabase) {
            try {
              const { data: compatResult, error: compatError } = await supabase.rpc(
                'calculate_collaboration_compatibility',
                {
                  p_profile_id: app.applicant.id,
                  p_role_id: app.role.id
                }
              );
              
              if (!compatError && compatResult && compatResult.length > 0) {
                compatibilityData = compatResult[0];
              }
            } catch (error) {
              console.error('Error calculating compatibility:', error);
            }
          }

          return {
            ...app,
            application_type: 'collaboration',
            project_title: app.project?.title,
            project_description: app.project?.description,
            project_location: app.project?.city && app.project?.country 
              ? `${app.project.city}, ${app.project.country}` 
              : app.project?.city || app.project?.country,
            project_start_date: app.project?.start_date,
            project_creator: app.project?.creator,
            applied_at: app.created_at,
            role_name: app.role?.role_name,
            skills_required: app.role?.skills_required,
            compatibility_score: compatibilityData?.overall_score,
            matched_skills: compatibilityData?.matched_skills || [],
            missing_skills: compatibilityData?.missing_skills || [],
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
              created_at: profile.created_at
            }
          };
        }));

        // Combine both types of applications
        const allApplications = [...normalizedGigApps, ...normalizedCollabApps]
          .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

        console.log('Applications: Successfully fetched', allApplications.length, 'total applications (', 
          normalizedGigApps.length, 'gig +', normalizedCollabApps.length, 'collaboration)')
        setApplications(allApplications);
      }
    } catch (error: any) {
      console.error('Applications: Critical error in fetchApplications:', error);
      console.error('Applications: Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      console.log('Applications: Fetching admin stats...')
      
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }
      
      // Get total applications count
      const { count: totalApps, error: totalError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });
      
      // Get pending applications count  
      const { count: pendingApps, error: pendingError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');
      
      // Get banned users count (users with BANNED flag)
      // Using a simpler approach to avoid array query issues
      const { data: allUsers, error: bannedError } = await supabase
        .from('users_profile')
        .select('role_flags');
      
      const bannedUsers = allUsers ? allUsers.filter(user => 
        user.role_flags && user.role_flags.includes('BANNED')
      ).length : 0;
      
      if (totalError || pendingError || bannedError) {
        console.error('Error fetching admin stats:', { totalError, pendingError, bannedError })
        return;
      }
      
      setAdminStats({
        totalApplications: totalApps || 0,
        pendingReview: pendingApps || 0,
        flaggedUsers: 0, // TODO: Implement flagged users system
        recentBans: bannedUsers || 0
      });
      
      console.log('Applications: Admin stats loaded:', { 
        totalApps, pendingApps, bannedUsers 
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const banUser = async (userId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to ban user "${displayName}"? This will prevent them from using the platform.`)) {
      return;
    }
    
    try {
      setUpdating(true);
      console.log('Applications: Banning user:', userId, displayName)
      
      // Get current user data
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }
      const { data: userData, error: fetchError } = await supabase
        .from('users_profile')
        .select('role_flags')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Add BANNED flag to user
      const currentFlags = userData.role_flags || [];
      if (!currentFlags.includes('BANNED')) {
        currentFlags.push('BANNED');
      }
      
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }
      const { error } = await supabase
        .from('users_profile')
        .update({ role_flags: currentFlags })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Refresh applications to show updated user status
      await fetchApplications();
      alert(`User "${displayName}" has been banned successfully.`);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }
    
    try {
      setUpdating(true);
      console.log('Applications: Deleting application:', applicationId)
      
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Remove from local state
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      setShowAdminActions(null);
      alert('Application deleted successfully.');
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];
    
    if (searchTerm) {
      filtered = filtered.filter(app =>
        (app.gig?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.project_title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.applicant?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.applicant?.handle?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }
    
    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdating(true);
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating application:', error);
    } finally {
      setUpdating(false);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    setUpdating(true);
    try {
      if (!supabase) {
        console.error('Supabase client not configured')
        return
      }
      
      // Update both gig applications and collaboration applications
      const { error: gigError } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId);
      
      const { error: collabError } = await supabase
        .from('collab_applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId);
      
      if (gigError && collabError) {
        throw new Error('Failed to withdraw application');
      }
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: 'withdrawn' } : app
        )
      );
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, status: 'withdrawn' } : null);
      }
      
      alert('Application withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-primary/10 text-primary';
      case 'SHORTLISTED':
        return 'bg-primary/10 text-primary';
      case 'ACCEPTED':
        return 'bg-primary/10 text-primary';
      case 'DECLINED':
        return 'bg-destructive/10 text-destructive';
      case 'withdrawn':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'SHORTLISTED':
        return <Star className="w-4 h-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />;
      case 'DECLINED':
        return <XCircle className="w-4 h-4" />;
      case 'withdrawn':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-muted-foreground-900">
                {viewMode === 'admin' ? 'Platform Applications - Admin View' :
                 viewMode === 'contributor' ? 'Manage Applications' : 'My Applications'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {viewMode === 'admin' 
                  ? 'Monitor and moderate applications across the platform'
                  : viewMode === 'contributor' 
                    ? 'Review and manage applications for your gigs'
                    : 'Track your gig applications'}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            {(userRole?.isAdmin || userRole?.isContributor || userRole?.isTalent) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
                <span className="text-sm font-medium text-muted-foreground sm:hidden">View As:</span>
                <div className="flex bg-muted rounded-lg p-1 w-full sm:w-auto">
                  {userRole?.isAdmin && (
                    <button
                      onClick={() => setViewMode('admin')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'admin'
                          ? 'bg-primary text-primary-foreground shadow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-1 inline" />
                      Admin
                    </button>
                  )}
                  {(userRole?.isContributor || userRole?.isAdmin) && (
                    <button
                      onClick={() => setViewMode('contributor')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'contributor'
                          ? 'bg-background text-foreground shadow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="hidden sm:inline">As </span>Contributor
                    </button>
                  )}
                  {(userRole?.isTalent || userRole?.isAdmin) && (
                    <button
                      onClick={() => setViewMode('talent')}
                      className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        viewMode === 'talent'
                          ? 'bg-background text-foreground shadow'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="hidden sm:inline">As </span>Talent
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by gig title or applicant name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-primary"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus | 'ALL')}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div>
          
          {/* Stats */}
          {viewMode === 'admin' ? (
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-primary mr-2" />
                    <div>
                      <p className="text-primary text-sm font-medium">Total Applications</p>
                      <p className="text-2xl font-bold text-primary-800">{adminStats.totalApplications}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-primary mr-2" />
                    <div>
                      <p className="text-primary text-sm font-medium">Pending Review</p>
                      <p className="text-2xl font-bold text-primary-800">{adminStats.pendingReview}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-destructive-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Ban className="w-5 h-5 text-destructive mr-2" />
                    <div>
                      <p className="text-destructive text-sm font-medium">Banned Users</p>
                      <p className="text-2xl font-bold text-destructive-800">{adminStats.recentBans}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-primary-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-primary mr-2" />
                    <div>
                      <p className="text-primary text-sm font-medium">Success Rate</p>
                      <p className="text-2xl font-bold text-primary-800">
                        {adminStats.totalApplications > 0 
                          ? Math.round((applications.filter(a => a.status === 'ACCEPTED').length / adminStats.totalApplications) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-semibold">{applications.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pending:</span>
                <span className="ml-2 font-semibold text-primary">
                  {applications.filter(a => a.status === 'PENDING').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Shortlisted:</span>
                <span className="ml-2 font-semibold text-primary">
                  {applications.filter(a => a.status === 'SHORTLISTED').length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Accepted:</span>
                <span className="ml-2 font-semibold text-primary">
                  {applications.filter(a => a.status === 'ACCEPTED').length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-lg">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No applications found</h3>
            <p className="text-muted-foreground">
              {viewMode === 'admin'
                ? 'Platform applications will appear here when users apply to gigs and projects'
                : viewMode === 'contributor' 
                  ? 'Applications for your gigs and projects will appear here'
                  : 'Your gig and project applications will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((application) => {
              const isExpanded = isCardExpanded(application.id);
              
              return (
                <div key={application.id} className="bg-background rounded-xl border border-border hover:border-primary/20 transition-all duration-200 hover:shadow-lg">
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Applicant Avatar with Type Indicator */}
                        <div className="relative">
                          <img
                            src={application.applicant?.avatar_url || '/default-avatar.png'}
                            alt={application.applicant?.display_name || 'Unknown User'}
                            className="w-16 h-16 rounded-full border-2 border-border object-cover"
                          />
                          {/* Application Type Indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold ${
                            application.application_type === 'gig' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                          }`}>
                            {application.application_type === 'gig' ? 'G' : 'C'}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          {/* Project Title */}
                          <Link
                            href={application.application_type === 'gig' 
                              ? `/gigs/${application.gig?.id}` 
                              : `/collaborate/projects/${application.project?.id}`}
                            className="text-xl font-bold text-foreground hover:text-primary transition-colors block mb-2"
                          >
                            {application.project_title}
                          </Link>
                          
                          {/* Role Badge */}
                          {application.role_name && (
                            <Badge variant="secondary" className="text-sm font-medium mb-3">
                              {application.role_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge and Expand Button */}
                      <div className="flex flex-col items-end gap-3">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          {application.status}
                        </span>
                        <button
                          onClick={() => toggleCardExpansion(application.id)}
                          className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span className="text-sm">Collapse</span>
                            </>
                          ) : (
                            <>
                              <ChevronDownIcon className="w-4 h-4" />
                              <span className="text-sm">Expand</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Applicant Info */}
                        <div className="lg:col-span-2 space-y-4">
                          {/* Project Details Preview */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              Project Details
                            </h4>
                            <div className="space-y-3">
                              {/* Project Description */}
                              {application.project_description && (
                                <div>
                                  <p className="text-sm font-medium text-foreground mb-1">Description:</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {application.project_description.length > 200 
                                      ? `${application.project_description.substring(0, 200)}...` 
                                      : application.project_description
                                    }
                                  </p>
                                </div>
                              )}
                              
                              {/* Skills Required */}
                              {application.skills_required && application.skills_required.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-foreground mb-2">Required Skills:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {application.skills_required.map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Compensation Info (for gigs) */}
                              {application.application_type === 'gig' && application.gig?.comp_type && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Compensation:</span>
                                  <span className="text-sm font-medium text-foreground">{application.gig.comp_type}</span>
                                </div>
                              )}
                              
                              {/* Project Duration */}
                              {application.project_start_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Duration:</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {formatDate(application.project_start_date)}
                                    {application.project?.end_date && ` - ${formatDate(application.project.end_date)}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Applicant Details Card */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Applicant Details
                            </h4>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-lg">
                                  {application.applicant?.display_name || 'Unknown User'}
                                </span>
                                <span className="text-muted-foreground">@{application.applicant?.handle || 'unknown'}</span>
                              </div>
                              {application.applicant?.city && (
                                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                                  <MapPin className="w-4 h-4" />
                                  {application.applicant.city}
                                </span>
                              )}
                            </div>
                            
                            {/* Admin-only badges */}
                            {viewMode === 'admin' && application.applicant && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {application.applicant.subscription_tier && (
                                  <Badge variant="outline" className="text-xs">
                                    {application.applicant.subscription_tier}
                                  </Badge>
                                )}
                                {application.applicant.role_flags?.includes('BANNED') && (
                                  <Badge variant="destructive" className="text-xs">
                                    BANNED
                                  </Badge>
                                )}
                                {application.applicant.role_flags?.includes('VERIFIED_ID') && (
                                  <Badge variant="default" className="text-xs">
                                    <UserCheck className="w-3 h-3 inline mr-1" />
                                    VERIFIED
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {/* Style Tags */}
                            {application.applicant.style_tags && application.applicant.style_tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const styleTags = application.applicant.style_tags;
                                  let tagsArray: string[] = [];

                                  if (Array.isArray(styleTags)) {
                                    tagsArray = styleTags as string[];
                                  } else if (typeof styleTags === 'string') {
                                    tagsArray = (styleTags as string).split(',');
                                  }

                                  return tagsArray.slice(0, 6).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {String(tag).trim()}
                                    </Badge>
                                  ));
                                })()}
                                {Array.isArray(application.applicant.style_tags) && application.applicant.style_tags.length > 6 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{application.applicant.style_tags.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Application Note */}
                          {application.note && (
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Application Note
                              </h4>
                              <p className="text-muted-foreground text-sm leading-relaxed">{application.note}</p>
                            </div>
                          )}
                          
                          {/* Project Creator Info */}
                          {application.project_creator && (
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Project Creator
                              </h4>
                              <div className="flex items-center gap-3">
                                <img
                                  src={application.project_creator.avatar_url || '/default-avatar.png'}
                                  alt={application.project_creator.display_name}
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <span className="font-medium text-foreground">
                                    {application.project_creator.display_name}
                                  </span>
                                  <span className="text-muted-foreground ml-2">@{application.project_creator.handle}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Right Column - Compatibility & Actions */}
                        <div className="space-y-4">
                          {/* Compatibility Score */}
                          {application.application_type === 'collaboration' && application.compatibility_score && (
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Compatibility
                              </h4>
                              <CompatibilityScore
                                score={Math.round(application.compatibility_score)}
                                size="md"
                                className="mb-3"
                              />
                              {application.matched_skills && application.matched_skills.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-foreground">Matched Skills:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {application.matched_skills.slice(0, 4).map((skill, index) => (
                                      <Badge key={index} variant="default" className="text-xs">
                                        ✓ {skill}
                                      </Badge>
                                    ))}
                                    {application.matched_skills.length > 4 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{application.matched_skills.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Project Details */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Project Info
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Applied:</span>
                                <span className="font-medium">{formatDate(application.applied_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Location:</span>
                                <span className="font-medium">
                                  {application.project_location || application.gig?.location_text || 'Not specified'}
                                </span>
                              </div>
                              {application.project_start_date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Start:</span>
                                  <span className="font-medium">{formatDate(application.project_start_date)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Actions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowDetailModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              
                              {/* Talent-specific actions */}
                              {viewMode === 'talent' && (
                                <>
                                  {application.status === 'PENDING' && (
                                    <button
                                      onClick={() => withdrawApplication(application.id)}
                                      className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                      disabled={updating}
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Withdraw
                                    </button>
                                  )}
                                  {application.status === 'SHORTLISTED' && (
                                    <button
                                      onClick={() => withdrawApplication(application.id)}
                                      className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                      disabled={updating}
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Withdraw
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {/* Contributor/Admin actions */}
                              {(viewMode === 'contributor' || viewMode === 'admin') && (
                                <>
                                  {application.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'SHORTLISTED')}
                                        className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <Star className="w-4 h-4" />
                                        Shortlist
                                      </button>
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'DECLINED')}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Decline
                                      </button>
                                    </>
                                  )}
                                  
                                  {application.status === 'SHORTLISTED' && (
                                    <>
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => updateApplicationStatus(application.id, 'DECLINED')}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Decline
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Admin-specific actions */}
                                  {viewMode === 'admin' && (
                                    <>
                                      <button
                                        onClick={() => banUser(application.applicant.id, application.applicant.display_name)}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <Ban className="w-4 h-4" />
                                        Ban User
                                      </button>
                                      <button
                                        onClick={() => deleteApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                                        disabled={updating}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Application Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Applicant Info */}
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={selectedApplication.applicant.avatar_url || '/default-avatar.png'}
                  alt={selectedApplication.applicant.display_name}
                  className="w-20 h-20 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedApplication.applicant.display_name}</h3>
                  <p className="text-muted-foreground">@{selectedApplication.applicant.handle}</p>
                  {selectedApplication.applicant.bio && (
                    <p className="text-muted-foreground mt-2">{selectedApplication.applicant.bio}</p>
                  )}
                  
                </div>
              </div>
              
              {/* Application Note */}
              {selectedApplication.note && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-2">Application Note</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedApplication.note}</p>
                </div>
              )}
              
              {/* Style Tags */}
              {selectedApplication.applicant.style_tags && selectedApplication.applicant.style_tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-2">Style Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const styleTags = selectedApplication.applicant.style_tags;
                      let tagsArray: string[] = [];

                      if (Array.isArray(styleTags)) {
                        tagsArray = styleTags as string[];
                      } else if (typeof styleTags === 'string') {
                        tagsArray = (styleTags as string).split(',');
                      }

                      return tagsArray.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {String(tag).trim()}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              {viewMode === 'contributor' && (
                <div className="flex gap-3 pt-6 border-t">
                  {selectedApplication.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'SHORTLISTED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary-700"
                        disabled={updating}
                      >
                        Shortlist Applicant
                      </button>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'ACCEPTED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                        disabled={updating}
                      >
                        Accept Application
                      </button>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'DECLINED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10"
                        disabled={updating}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  
                  {selectedApplication.status === 'SHORTLISTED' && (
                    <>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'ACCEPTED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                        disabled={updating}
                      >
                        Accept Application
                      </button>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'DECLINED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10"
                        disabled={updating}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-muted-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}