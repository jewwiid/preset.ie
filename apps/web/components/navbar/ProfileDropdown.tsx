'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger} from '../ui/dropdown-menu'
import { Home, User as UserIcon, LogOut, Shield, Settings } from 'lucide-react'

interface Profile {
  avatar_url?: string
  display_name?: string
  account_type?: string[]
  handle?: string
}

interface ProfileDropdownProps {
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  isAdmin: boolean
  onSignOut: () => void
}

export function ProfileDropdown({
  user,
  profile,
  profileLoading,
  isAdmin,
  onSignOut}: ProfileDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all">
          {profileLoading ? (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background"></div>
            </div>
          ) : profile?.avatar_url ? (
            <div className="relative w-10 h-10">
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'User'}
                className="w-10 h-10 rounded-full object-cover border-2 border-border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.parentElement?.querySelector('.fallback-avatar')
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex'
                  }
                }}
              />
              <div className="fallback-avatar absolute inset-0 w-10 h-10 bg-primary rounded-full items-center justify-center hidden border-2 border-border">
                <UserIcon className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-2 border-border">
              <UserIcon className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-4" align="end" forceMount>
        {/* Profile Header */}
        <div className="flex flex-col space-y-2 pb-3">
          {profileLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </div>
          ) : profile ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold leading-tight">
                  {profile.display_name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{profile.handle || 'handle'}
                </p>
              </div>
              <div className="inline-flex">
                {profile?.account_type?.includes('CONTRIBUTOR') ? (
                  <Badge className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                    Contributor
                  </Badge>
                ) : (
                  <Badge className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                    Talent
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold leading-tight">User</h3>
                <p className="text-sm text-muted-foreground">
                  @{user?.email?.split('@')[0] || 'user'}
                </p>
              </div>
            </>
          )}
        </div>

        <DropdownMenuSeparator className="my-2" />

        {/* Menu Items */}
        <div className="space-y-0">
          <DropdownMenuItem asChild className="py-2 cursor-pointer">
            <Link href="/dashboard" className="flex items-center nav-submenu-item">
              <Home className="mr-3 h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="py-2 cursor-pointer">
            <Link href="/profile" className="flex items-center nav-submenu-item">
              <UserIcon className="mr-3 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="py-2 cursor-pointer">
            <Link href="/settings" className="flex items-center nav-submenu-item">
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild className="py-2 cursor-pointer">
              <Link href="/admin" className="flex items-center nav-submenu-item">
                <Shield className="mr-3 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={onSignOut}
            className="py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 nav-submenu-item"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
