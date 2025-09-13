'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { 
  Briefcase, Clock, CheckCircle, XCircle, MessageSquare, 
  Filter, Search, ChevronDown, Star, MapPin, Calendar,
  Users, Eye, Heart, MoreVertical, Shield, Ban, Flag, 
  Trash2, AlertTriangle, BarChart3, TrendingUp, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'DECLINED';

interface Application {
  id: string;
  gig_id: string;
  applicant_user_id: string;
  note?: string;
  status: ApplicationStatus;
  applied_at: string;
  gig: {
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
      } else if (userRole?.isTalent && !userRole?.isContributor) {
        setViewMode('talent');
      } else {
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
        // Fetch applications submitted by the talent
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
                avatar_url,
                handle
              )
            )
          `)
          .eq('applicant_user_id', profile.id)
          .order('applied_at', { ascending: false });
        
        if (error) {
          console.error('Applications: Error fetching applications for talent:', error)
          throw error;
        }
        
        console.log('Applications: Successfully fetched', data?.length || 0, 'talent applications')
        setApplications(data || []);
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
        app.gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant.handle.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHORTLISTED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {viewMode === 'admin' ? 'Platform Applications - Admin View' :
                 viewMode === 'contributor' ? 'Manage Applications' : 'My Applications'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {viewMode === 'admin' 
                  ? 'Monitor and moderate applications across the platform'
                  : viewMode === 'contributor' 
                    ? 'Review and manage applications for your gigs'
                    : 'Track your gig applications'}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            {(userRole?.isAdmin || (userRole?.isContributor && userRole?.isTalent)) && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                {userRole?.isAdmin && (
                  <button
                    onClick={() => setViewMode('admin')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'admin'
                        ? 'bg-red-600 text-white shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-1 inline" />
                    Admin
                  </button>
                )}
                {userRole?.isContributor && (
                  <button
                    onClick={() => setViewMode('contributor')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'contributor'
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    As Contributor
                  </button>
                )}
                {userRole?.isTalent && (
                  <button
                    onClick={() => setViewMode('talent')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'talent'
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    As Talent
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by gig title or applicant name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Applications</p>
                      <p className="text-2xl font-bold text-blue-800">{adminStats.totalApplications}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Pending Review</p>
                      <p className="text-2xl font-bold text-yellow-800">{adminStats.pendingReview}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Ban className="w-5 h-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-red-600 text-sm font-medium">Banned Users</p>
                      <p className="text-2xl font-bold text-red-800">{adminStats.recentBans}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-green-600 text-sm font-medium">Success Rate</p>
                      <p className="text-2xl font-bold text-green-800">
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
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-semibold">{applications.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Pending:</span>
                <span className="ml-2 font-semibold text-yellow-600">
                  {applications.filter(a => a.status === 'PENDING').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Shortlisted:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {applications.filter(a => a.status === 'SHORTLISTED').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Accepted:</span>
                <span className="ml-2 font-semibold text-green-600">
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
          <div className="text-center py-12 bg-white rounded-lg">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {viewMode === 'admin'
                ? 'Platform applications will appear here when users apply to gigs'
                : viewMode === 'contributor' 
                  ? 'Applications for your gigs will appear here'
                  : 'Your gig applications will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      {/* Applicant Avatar */}
                      <img
                        src={application.applicant.avatar_url || '/default-avatar.png'}
                        alt={application.applicant.display_name}
                        className="w-12 h-12 rounded-full"
                      />
                      
                      <div className="flex-1">
                        {/* Gig Title */}
                        <Link
                          href={`/gigs/${application.gig.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {application.gig.title}
                        </Link>
                        
                        {/* Admin-only: Show gig owner */}
                        {viewMode === 'admin' && application.gig.users_profile && (
                          <div className="text-sm text-gray-500 mt-1">
                            Gig by: <span className="font-medium text-gray-700">
                              {application.gig.users_profile.display_name}
                            </span> (@{application.gig.users_profile.handle})
                          </div>
                        )}
                        
                        {/* Applicant Info */}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-medium text-gray-900">
                            {application.applicant.display_name}
                          </span>
                          <span className="text-gray-600">@{application.applicant.handle}</span>
                          {application.applicant.city && (
                            <span className="text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {application.applicant.city}
                            </span>
                          )}
                          
                          {/* Admin-only info */}
                          {viewMode === 'admin' && (
                            <>
                              {application.applicant.subscription_tier && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  application.applicant.subscription_tier === 'PRO' ? 'bg-purple-100 text-purple-800' :
                                  application.applicant.subscription_tier === 'PLUS' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.applicant.subscription_tier}
                                </span>
                              )}
                              {application.applicant.role_flags?.includes('BANNED') && (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  BANNED
                                </span>
                              )}
                              {application.applicant.role_flags?.includes('VERIFIED_ID') && (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  <UserCheck className="w-3 h-3 inline mr-1" />
                                  VERIFIED
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Application Note */}
                        {application.note && (
                          <p className="text-gray-700 mt-2 line-clamp-2">{application.note}</p>
                        )}
                        
                        {/* Applicant Tags */}
                        {application.applicant.style_tags && application.applicant.style_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {application.applicant.style_tags.slice(0, 5).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Applied {formatDate(application.applied_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {application.gig.location_text}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status}
                      </span>
                      
                      {(viewMode === 'contributor' || viewMode === 'admin') && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          
                          {application.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'SHORTLISTED')}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                disabled={updating}
                              >
                                <Star className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                disabled={updating}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'DECLINED')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                disabled={updating}
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          
                          {application.status === 'SHORTLISTED' && (
                            <>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                disabled={updating}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'DECLINED')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                disabled={updating}
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          
                          {/* Admin-specific actions */}
                          {viewMode === 'admin' && (
                            <>
                              <button
                                onClick={() => banUser(application.applicant.id, application.applicant.display_name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                disabled={updating}
                                title="Ban User"
                              >
                                <Ban className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => deleteApplication(application.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                disabled={updating}
                                title="Delete Application"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Application Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
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
                  <p className="text-gray-600">@{selectedApplication.applicant.handle}</p>
                  {selectedApplication.applicant.bio && (
                    <p className="text-gray-700 mt-2">{selectedApplication.applicant.bio}</p>
                  )}
                  
                </div>
              </div>
              
              {/* Application Note */}
              {selectedApplication.note && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Application Note</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.note}</p>
                </div>
              )}
              
              {/* Style Tags */}
              {selectedApplication.applicant.style_tags && selectedApplication.applicant.style_tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Style Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.applicant.style_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
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
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={updating}
                      >
                        Shortlist Applicant
                      </button>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'ACCEPTED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        disabled={updating}
                      >
                        Accept Application
                      </button>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'DECLINED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
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
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        disabled={updating}
                      >
                        Accept Application
                      </button>
                      <button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'DECLINED');
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                        disabled={updating}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
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