'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger} from '../ui/dropdown-menu'
import {
  Home,
  Search,
  Briefcase,
  MessageSquare,
  Image,
  Plus,
  User as UserIcon,
  Heart,
  ChevronDown,
  Target,
  ShoppingBag,
  ShoppingCart,
  Store,
  Palette,
  Users,
  Sparkles,
  Camera,
  Wand2,
  Clock,
  TrendingUp,
  Package} from 'lucide-react'
import { NotificationBell } from '../NotificationBell'
import { ThemeToggle } from '../ThemeToggle'
import { ProfileDropdown } from './ProfileDropdown'

interface Profile {
  avatar_url?: string
  display_name?: string
  role_flags?: string[]
  handle?: string
}

interface NavItem {
  label: string
  href: string
  icon: any
  requiresAuth?: boolean
}

interface DesktopNavProps {
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  isAdmin: boolean
  isContributor: boolean
  loading: boolean
  visibleNavItems: NavItem[]
  isActive: (href: string) => boolean
  onSignOut: () => void
}

export function DesktopNav({
  user,
  profile,
  profileLoading,
  isAdmin,
  isContributor,
  loading,
  visibleNavItems,
  isActive,
  onSignOut}: DesktopNavProps) {
  return (
    <div className="hidden md:flex md:items-center flex-1">
      {/* Left: Logo */}
      <div className="flex items-center flex-shrink-0">
        <Link href="/" className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 mr-2">
            <img
              src="/logo.svg"
              alt="Preset"
              className="w-10 h-10"
            />
          </div>
          <span className="text-xl font-bold text-primary preset-branding">Preset</span>
        </Link>
      </div>

      {/* Center: Navigation menus */}
      <div className="flex items-center justify-center flex-1 gap-1 md:gap-2 lg:gap-3 xl:gap-4 mx-2 lg:mx-4 overflow-x-auto">
        {/* Dashboard Dropdown */}
        {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                inline-flex items-center h-10 px-2 md:px-3 text-sm md:text-base rounded-lg transition-colors nav-menu-item
                ${(isActive('/dashboard') || isActive('/profile') || isActive('/matchmaking'))
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:bg-accent/50'
                }
              `}
            >
              <Home className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Dashboard</span>
              <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 lg:ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center nav-submenu-item">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center nav-submenu-item">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/matchmaking" className="flex items-center nav-submenu-item">
                <Target className="mr-2 h-4 w-4" />
                Matchmaking
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/applications" className="flex items-center nav-submenu-item">
                <Briefcase className="mr-2 h-4 w-4" />
                My Applications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Gigs Dropdown */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                inline-flex items-center h-10 px-2 md:px-3 text-sm md:text-base rounded-lg transition-colors nav-menu-item
                ${(isActive('/gigs'))
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:bg-accent/50'
                }
              `}
            >
              <Search className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Gigs</span>
              <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 lg:ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start">
            <DropdownMenuItem asChild>
              <Link href="/gigs" className="flex items-center nav-submenu-item">
                <Search className="mr-2 h-4 w-4" />
                Browse Gigs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/gigs/saved" className="flex items-center nav-submenu-item">
                <Heart className="mr-2 h-4 w-4" />
                Saved Gigs
              </Link>
            </DropdownMenuItem>
            {isContributor && (
              <DropdownMenuItem asChild>
                <Link href="/gigs/my-gigs" className="flex items-center nav-submenu-item">
                  <Briefcase className="mr-2 h-4 w-4" />
                  My Gigs
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Marketplace Dropdown */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                inline-flex items-center h-10 px-2 md:px-3 text-sm md:text-base rounded-lg transition-colors nav-menu-item
                ${(isActive('/gear') || isActive('/presets/marketplace'))
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:bg-accent/50'
                }
              `}
            >
              <Store className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Marketplace</span>
              <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 lg:ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="start">
            <DropdownMenuLabel className="nav-submenu-title">Preset Marketplace</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/presets/marketplace" className="flex items-center nav-submenu-item">
                <Palette className="mr-2 h-4 w-4" />
                Browse Presets
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/presets/marketplace/my-listings" className="flex items-center nav-submenu-item">
                <ShoppingBag className="mr-2 h-4 w-4" />
                My Preset Listings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/presets/marketplace/purchases" className="flex items-center nav-submenu-item">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase History
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/presets/marketplace/analytics" className="flex items-center nav-submenu-item">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="nav-submenu-title">Equipment Marketplace</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/gear" className="flex items-center nav-submenu-item">
                <Camera className="mr-2 h-4 w-4" />
                Browse Equipment
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/gear/create" className="flex items-center nav-submenu-item">
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/gear/my-listings" className="flex items-center nav-submenu-item">
                <Package className="mr-2 h-4 w-4" />
                My Equipment Listings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/gear/orders" className="flex items-center nav-submenu-item">
                <Briefcase className="mr-2 h-4 w-4" />
                My Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="nav-submenu-title">
                <MessageSquare className="mr-2 h-4 w-4" />
                Requests
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/gear/requests?create=true" className="flex items-center nav-submenu-item">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gear/requests" className="flex items-center nav-submenu-item">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Browse Requests
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gear/my-requests" className="flex items-center nav-submenu-item">
                    <Clock className="mr-2 h-4 w-4" />
                    My Requests
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Create Menu */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`
                inline-flex items-center h-10 px-2 md:px-3 text-sm md:text-base rounded-lg transition-colors nav-menu-item
                ${(isActive('/presets') || isActive('/presets/create') || isActive('/showcases') || isActive('/showcases/create') || isActive('/treatments') || isActive('/treatments/create') || isActive('/playground') || isActive('/moodboards'))
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground hover:bg-accent/50'
                }
              `}
            >
              <Plus className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Create</span>
              <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4 lg:ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem asChild>
              <Link href="/playground" className="flex items-center nav-submenu-item">
                <Camera className="mr-2 h-4 w-4" />
                Media (Playground)
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/moodboards" className="flex items-center nav-submenu-item">
                <Image className="mr-2 h-4 w-4" />
                Moodboards
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/presets" className="flex items-center nav-submenu-item">
                <Palette className="mr-2 h-4 w-4" />
                Presets
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/showcases" className="flex items-center nav-submenu-item">
                <Sparkles className="mr-2 h-4 w-4" />
                Showcases
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/treatments" className="flex items-center nav-submenu-item">
                <Wand2 className="mr-2 h-4 w-4" />
                Treatments
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Regular Nav Items */}
      {visibleNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              inline-flex items-center h-10 px-2 md:px-3 text-sm md:text-base rounded-lg transition-colors nav-menu-item
              ${isActive(item.href)
                ? 'text-primary bg-primary/10'
                : 'text-foreground hover:bg-accent/50'
              }
            `}
          >
            <Icon className="w-4 h-4 lg:mr-2" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        )
      })}
      </div>

      {/* Right: Action items */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
      {loading ? (
        <div className="animate-pulse flex space-x-3">
          <div className="hidden md:block h-9 w-24 bg-muted-200 rounded-md"></div>
          <div className="h-8 w-8 bg-muted-200 rounded-full"></div>
        </div>
      ) : user ? (
        <>
          {/* Create Gig Button */}
          {isContributor && (
            <Button asChild className="hidden md:inline-flex h-10 w-10 xl:w-auto px-2 xl:px-4 rounded-lg nav-menu-item text-sm md:text-base justify-center">
              <Link href="/gigs/create">
                <Plus className="w-4 h-4 xl:mr-2 flex-shrink-0" />
                <span className="hidden xl:inline">Gig</span>
              </Link>
            </Button>
          )}

          {/* Theme Toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <div className="hidden md:block">
            <NotificationBell />
          </div>

          {/* Profile Dropdown */}
          <div className="hidden md:block">
            <ProfileDropdown
              user={user}
              profile={profile}
              profileLoading={profileLoading}
              isAdmin={isAdmin}
              onSignOut={onSignOut}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center space-x-3">
          <Button variant="ghost" asChild className="preset-branding">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
          <Button asChild className="preset-branding">
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
