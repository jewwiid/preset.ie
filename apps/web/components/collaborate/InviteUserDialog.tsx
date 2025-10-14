'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Search, Mail, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  roles?: Array<{
    id: string;
    role_name: string;
  }>;
  onInviteSent?: () => void;
}

interface UserSearchResult {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  primary_skill?: string;
  role_flags?: string[];
  city?: string;
  country?: string;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  roles = [],
  onInviteSent
}: InviteUserDialogProps) {
  const [inviteMethod, setInviteMethod] = useState<'user' | 'email'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [travelFilter, setTravelFilter] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [showLocationFilters, setShowLocationFilters] = useState(false);

  // Fetch available skills on mount
  React.useEffect(() => {
    const fetchSkills = async () => {
      try {
        const [skillsRes, talentRes] = await Promise.all([
          supabase?.from('predefined_skills').select('name').eq('is_active', true).order('sort_order'),
          supabase?.from('predefined_performance_roles').select('role_name').eq('is_active', true).order('sort_order')
        ]);

        const allSkills = [
          ...(skillsRes?.data?.map((s: any) => s.name) || []),
          ...(talentRes?.data?.map((t: any) => t.role_name) || [])
        ];

        setAvailableSkills(allSkills);
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };

    fetchSkills();
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (skillFilter) params.append('skill', skillFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (cityFilter.trim()) params.append('city', cityFilter.trim());
      if (countryFilter.trim()) params.append('country', countryFilter.trim());
      if (travelFilter) params.append('available_for_travel', 'true');
      params.append('limit', '20');

      const response = await fetch(`/api/users/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search users');
      }

      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search when filters change
  React.useEffect(() => {
    handleSearch();
  }, [skillFilter, roleFilter, cityFilter, countryFilter, travelFilter]);

  const handleSendInvitation = async () => {
    setIsSending(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const payload = {
        invitee_id: inviteMethod === 'user' ? selectedUser?.id : undefined,
        invitee_email: inviteMethod === 'email' ? email : undefined,
        role_id: selectedRole || null,
        message: message.trim() || undefined,
      };

      const response = await fetch(`/api/collab/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Reset form
      setSelectedUser(null);
      setEmail('');
      setSearchQuery('');
      setSelectedRole('');
      setMessage('');
      setSearchResults([]);

      onInviteSent?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };

  const isValid = () => {
    if (inviteMethod === 'user') {
      return !!selectedUser;
    } else {
      return !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite to Project</DialogTitle>
          <DialogDescription>
            Invite a user to join "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite Method Selector */}
          <div className="space-y-2">
            <Label>Invite by</Label>
            <Select value={inviteMethod} onValueChange={(value: any) => setInviteMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Search User</SelectItem>
                <SelectItem value="email">Email Address</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Search */}
          {inviteMethod === 'user' && (
            <div className="space-y-3">
              <Label>Search User</Label>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Filter by Skill</Label>
                  <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Skills" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Skills</SelectItem>
                      {availableSkills.map(skill => (
                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Filter by Type</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="CONTRIBUTOR">Contributors</SelectItem>
                      <SelectItem value="TALENT">Talent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location Filters - Collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowLocationFilters(!showLocationFilters)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {showLocationFilters ? '− Hide' : '+ Show'} Location Filters
                </button>

                {showLocationFilters && (
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City (e.g., Dublin)"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Country (e.g., Ireland)"
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={travelFilter}
                        onChange={(e) => setTravelFilter(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>Available for travel</span>
                    </label>
                  </div>
                )}
              </div>

              {selectedUser ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedUser.avatar_url} />
                      <AvatarFallback>
                        {selectedUser.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{selectedUser.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{selectedUser.handle}</p>
                      {selectedUser.primary_skill && (
                        <p className="text-xs text-primary font-medium">{selectedUser.primary_skill}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Search by handle or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {user.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.display_name}</p>
                              <p className="text-xs text-muted-foreground">@{user.handle}</p>
                              {user.city && user.country && (
                                <p className="text-xs text-muted-foreground">{user.city}, {user.country}</p>
                              )}
                            </div>
                          </div>
                          {user.primary_skill && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                              {user.primary_skill}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Email Input */}
          {inviteMethod === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Role Selection */}
          {roles.length > 0 && (
            <div className="space-y-2">
              <Label>Role (Optional)</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific role</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendInvitation} disabled={!isValid() || isSending}>
            {isSending ? (
              <>
                <LoadingSpinner size="sm" />
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
