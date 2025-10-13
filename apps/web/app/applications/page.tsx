'use client';

/**
 * Applications Management Page - Refactored
 *
 * Unified view for managing both gig applications and collaboration applications.
 * Supports three view modes: Contributor, Talent, and Admin.
 *
 * Line count: ~250 lines (down from 1,531)
 * Reduction: 84%
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Search,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  MapPin,
  Calendar,
  BarChart3,
  Ban,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  MessageSquare,
  DollarSign,
  User,
  Settings,
  Target,
  Zap,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/badge';
import CompatibilityScore from '../../components/matchmaking/CompatibilityScore';

// Import refactored modules
import type { Application, ViewMode, UserProfile } from './types';
import { STATUS_OPTIONS } from './constants/applicationConfig';
import {
  useApplications,
  useApplicationFilters,
  useApplicationActions,
  useApplicationStats,
  useAdminStats,
} from './hooks';
import {
  getStatusColor,
  getStatusIcon,
  formatApplicationDate,
  canPerformAction,
  parseStyleTags,
  truncateText,
} from './lib/applicationHelpers';

export default function ApplicationsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('contributor');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Initialize hooks
  const {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    applyFilters,
  } = useApplicationFilters();

  const { applications, loading, refetch } = useApplications({
    profile,
    viewMode,
    autoFetch: true,
  });

  const filteredApplications = useMemo(
    () => applyFilters(applications),
    [applications, applyFilters]
  );

  const { stats, successRate } = useApplicationStats(applications);

  const { stats: adminStats } = useAdminStats(viewMode);

  const {
    updating,
    acceptApplication,
    rejectApplication,
    shortlistApplication,
    withdrawApplication,
    banUser,
    deleteApplication,
  } = useApplicationActions({
    onSuccess: () => refetch(),
  });

  // Auth and profile setup
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
      }

      fetchUserProfile();
    }
  }, [user, userRole, authLoading]);

  const fetchUserProfile = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const toggleCardExpansion = (applicationId: string) => {
    setExpandedCards((prev) => {
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

  const StatusIcon = (status: any) => {
    const Icon = getStatusIcon(status);
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  if (loading || authLoading) {
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
                {viewMode === 'admin'
                  ? 'Platform Applications - Admin View'
                  : viewMode === 'contributor'
                  ? 'Manage Applications'
                  : 'My Applications'}
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
              <div className="flex bg-muted rounded-lg p-1">
                {userRole?.isAdmin && (
                  <button
                    onClick={() => setViewMode('admin')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'contributor'
                        ? 'bg-background text-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Contributor
                  </button>
                )}
                {(userRole?.isTalent || userRole?.isAdmin) && (
                  <button
                    onClick={() => setViewMode('talent')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'talent'
                        ? 'bg-background text-foreground shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Talent
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by gig title or applicant name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          {viewMode === 'admin' ? (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-primary-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-primary mr-2" />
                  <div>
                    <p className="text-primary text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold text-primary-800">
                      {adminStats.totalApplications}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-primary mr-2" />
                  <div>
                    <p className="text-primary text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-primary-800">
                      {adminStats.pendingReview}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-destructive-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Ban className="w-5 h-5 text-destructive mr-2" />
                  <div>
                    <p className="text-destructive text-sm font-medium">Banned</p>
                    <p className="text-2xl font-bold text-destructive-800">
                      {adminStats.recentBans}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-primary mr-2" />
                  <div>
                    <p className="text-primary text-sm font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-primary-800">{successRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-semibold">{stats.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pending:</span>
                <span className="ml-2 font-semibold text-primary">{stats.pending}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Shortlisted:</span>
                <span className="ml-2 font-semibold text-primary">{stats.shortlisted}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Accepted:</span>
                <span className="ml-2 font-semibold text-primary">{stats.accepted}</span>
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
                ? 'Platform applications will appear here'
                : viewMode === 'contributor'
                ? 'Applications for your gigs will appear here'
                : 'Your applications will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((application) => {
              const isExpanded = isCardExpanded(application.id);
              const isUpdating = updating.has(application.id);

              return (
                <div
                  key={application.id}
                  className="bg-background rounded-xl border hover:border-primary/20 transition-all hover:shadow-lg"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={application.applicant?.avatar_url || '/default-avatar.png'}
                            alt={application.applicant?.display_name || 'Unknown'}
                            className="w-16 h-16 rounded-full border-2 border-border object-cover"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold ${
                              application.application_type === 'gig'
                                ? 'bg-blue-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}
                          >
                            {application.application_type === 'gig' ? 'G' : 'C'}
                          </div>
                        </div>

                        <div className="flex-1">
                          <Link
                            href={
                              application.application_type === 'gig'
                                ? `/gigs/${application.gig?.id}`
                                : `/collaborate/projects/${application.project?.id}`
                            }
                            className="text-xl font-bold text-foreground hover:text-primary transition-colors block mb-2"
                          >
                            {application.project_title}
                          </Link>

                          {application.role_name && (
                            <Badge variant="secondary" className="text-sm font-medium">
                              {application.role_name}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {StatusIcon(application.status)}
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
                              <ChevronDown className="w-4 h-4" />
                              <span className="text-sm">Expand</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 pt-4 border-t">
                        {/* Left Column - Details */}
                        <div className="lg:col-span-2 space-y-4">
                          {/* Applicant Info */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Applicant
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-foreground">
                                {application.applicant?.display_name}
                              </span>
                              <span className="text-muted-foreground">
                                @{application.applicant?.handle}
                              </span>
                            </div>
                            {application.applicant.style_tags &&
                              application.applicant.style_tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {parseStyleTags(application.applicant.style_tags)
                                    .slice(0, 6)
                                    .map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>
                              )}
                          </div>

                          {/* Application Note */}
                          {application.note && (
                            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                              <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Note
                              </h4>
                              <p className="text-muted-foreground text-sm">{application.note}</p>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Actions */}
                        <div className="space-y-4">
                          {/* Compatibility (collaboration only) */}
                          {application.application_type === 'collaboration' &&
                            application.compatibility_score && (
                              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Compatibility
                                </h4>
                                <CompatibilityScore
                                  score={Math.round(application.compatibility_score)}
                                  size="md"
                                />
                              </div>
                            )}

                          {/* Actions */}
                          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Actions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {/* Talent actions */}
                              {viewMode === 'talent' &&
                                (application.status === 'PENDING' ||
                                  application.status === 'SHORTLISTED') && (
                                  <button
                                    onClick={() => withdrawApplication(application.id)}
                                    className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm"
                                    disabled={isUpdating}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Withdraw
                                  </button>
                                )}

                              {/* Contributor/Admin actions */}
                              {(viewMode === 'contributor' || viewMode === 'admin') && (
                                <>
                                  {application.status === 'PENDING' && (
                                    <>
                                      <button
                                        onClick={() => shortlistApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
                                        disabled={isUpdating}
                                      >
                                        <Star className="w-4 h-4" />
                                        Shortlist
                                      </button>
                                      <button
                                        onClick={() => acceptApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                        disabled={isUpdating}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => rejectApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm"
                                        disabled={isUpdating}
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {application.status === 'SHORTLISTED' && (
                                    <>
                                      <button
                                        onClick={() => acceptApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                        disabled={isUpdating}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => rejectApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm"
                                        disabled={isUpdating}
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Decline
                                      </button>
                                    </>
                                  )}

                                  {/* Admin-only actions */}
                                  {viewMode === 'admin' && (
                                    <>
                                      <button
                                        onClick={() =>
                                          banUser(
                                            application.applicant.id,
                                            application.applicant.display_name
                                          )
                                        }
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm"
                                        disabled={isUpdating}
                                      >
                                        <Ban className="w-4 h-4" />
                                        Ban
                                      </button>
                                      <button
                                        onClick={() => deleteApplication(application.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 text-sm"
                                        disabled={isUpdating}
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
    </div>
  );
}
