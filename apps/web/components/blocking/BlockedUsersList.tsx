'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBlockingApi, BlockedUserDTO } from '@/lib/api/user-blocking';
import { Shield, ShieldOff, Calendar, AlertTriangle } from 'lucide-react';
import { UnblockUserDialog } from './UnblockUserDialog';

interface BlockedUsersListProps {
  className?: string;
}

export function BlockedUsersList({ className }: BlockedUsersListProps) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    totalCount: 0,
    hasMore: false
  });
  const [unblockingUser, setUnblockingUser] = useState<BlockedUserDTO | null>(null);

  const userBlockingApi = useUserBlockingApi();

  const fetchBlockedUsers = async (offset = 0, append = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const response = await userBlockingApi.getBlockedUsers({
        limit: pagination.limit,
        offset,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      if (response.success) {
        const newUsers = response.data.blockedUsers;
        setBlockedUsers(prev => append ? [...prev, ...newUsers] : newUsers);
        setPagination({
          ...pagination,
          offset,
          totalCount: response.data.totalCount,
          hasMore: response.data.hasMore
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = (user: BlockedUserDTO) => {
    setUnblockingUser(user);
  };

  const handleUnblockSuccess = () => {
    // Refresh the list
    fetchBlockedUsers();
    setUnblockingUser(null);
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchBlockedUsers(pagination.offset + pagination.limit, true);
    }
  };

  const formatBlockDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name?: string, handle?: string) => {
    const displayName = name || handle || 'U';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && blockedUsers.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Blocked Users</CardTitle>
            </div>
            <CardDescription>
              Users you've blocked from contacting you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Blocked Users</CardTitle>
          </div>
          <CardDescription>
            Users you've blocked from contacting you ({pagination.totalCount} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {blockedUsers.length === 0 && !loading && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No blocked users</p>
              <p className="text-sm text-muted-foreground mt-1">
                Users you block will appear here
              </p>
            </div>
          )}

          <div className="space-y-4">
            {blockedUsers.map((blockedUser) => (
              <div
                key={blockedUser.blockId}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={blockedUser.blockedUserAvatarUrl} 
                    alt={blockedUser.blockedUserDisplayName || blockedUser.blockedUserHandle}
                  />
                  <AvatarFallback>
                    {getInitials(blockedUser.blockedUserDisplayName, blockedUser.blockedUserHandle)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {blockedUser.blockedUserDisplayName || blockedUser.blockedUserHandle || 'Unknown User'}
                    </p>
                    {blockedUser.isRecent && (
                      <Badge variant="secondary" className="text-xs">
                        Recent
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Blocked {formatBlockDate(blockedUser.blockedAt)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {blockedUser.reasonDetails.label}
                    </Badge>
                  </div>
                  
                  {blockedUser.reasonDetails.details && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      "{blockedUser.reasonDetails.details}"
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(blockedUser)}
                  className="flex items-center gap-1"
                >
                  <ShieldOff className="h-3 w-3" />
                  Unblock
                </Button>
              </div>
            ))}
          </div>

          {pagination.hasMore && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {unblockingUser && (
        <UnblockUserDialog
          isOpen={!!unblockingUser}
          onClose={() => setUnblockingUser(null)}
          blockedUser={unblockingUser}
          onUnblockSuccess={handleUnblockSuccess}
        />
      )}
    </div>
  );
}