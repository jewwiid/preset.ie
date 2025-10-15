'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger} from '../ui/dropdown-menu'
import {
  Home,
  Search,
  Briefcase,
  MessageSquare,
  Image,
  Plus,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  Settings,
  Heart,
  Target,
  ShoppingBag,
  Store,
  Palette,
  Sparkles,
  Camera,
  Wand2,
  Clock,
  Users} from 'lucide-react'
import { NotificationBell } from '../NotificationBell'
import { ThemeToggle } from '../ThemeToggle'

interface Profile {
  avatar_url?: string
  display_name?: string
  account_type?: string[]
  handle?: string
}

interface NavItem {
  label: string
  href: string
  icon: any
  requiresAuth?: boolean
}

interface MobileNavProps {
  user: User | null
  profile: Profile | null
  profileLoading: boolean
  isAdmin: boolean
  isContributor: boolean
  loading: boolean
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  visibleNavItems: NavItem[]
  isActive: (href: string) => boolean
  onSignOut: () => void
}

export function MobileNav({
  user,
  profile,
  profileLoading,
  isAdmin,
  isContributor,
  loading,
  mobileMenuOpen,
  setMobileMenuOpen,
  visibleNavItems,
  isActive,
  onSignOut}: MobileNavProps) {
  return (
    <>
      {/* Mobile Right Side Icons */}
      <div className="flex md:hidden items-center gap-3">
        {user && (
          <>
            {/* Create Gig Button */}
            {isContributor && (
              <Button asChild size="icon" className="h-10 w-10 rounded-lg">
                <Link href="/gigs/create">
                  <Plus className="w-5 h-5" />
                </Link>
              </Button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* Profile Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  {profileLoading ? (
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background"></div>
                    </div>
                  ) : profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-2 border-border">
                      <UserIcon className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-4" align="end" forceMount>
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
                      <div className="inline-flex pt-1">
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
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold leading-tight">User</h3>
                      <p className="text-sm text-muted-foreground">
                        @{user?.email?.split('@')[0] || 'user'}
                      </p>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator className="my-2" />

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
          </>
        )}

        {!user && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="preset-branding">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="preset-branding">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        )}

        {/* Mobile menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMobileMenuOpen(!mobileMenuOpen)
          }}
          className="p-2 rounded-md nav-item relative z-50"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Mobile Menu Slide-in Panel */}
          <div className="md:hidden fixed inset-y-0 left-0 w-full bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-3">
                    <img
                      src="/logo.svg"
                      alt="Preset"
                      className="w-10 h-10"
                    />
                  </div>
                  <span className="text-xl font-bold text-primary preset-branding">Preset</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {/* Dashboard Section */}
                {user && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider preset-branding">
                      Dashboard
                    </div>
                    <Link
                      href="/dashboard"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/dashboard')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Home className="w-5 h-5 inline mr-3" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/profile')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="w-5 h-5 inline mr-3" />
                      Profile
                    </Link>
                    <Link
                      href="/matchmaking"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/matchmaking')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Target className="w-5 h-5 inline mr-3" />
                      Matchmaking
                    </Link>
                    <Link
                      href="/applications"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/applications')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Briefcase className="w-5 h-5 inline mr-3" />
                      My Applications
                    </Link>
                  </>
                )}

                {/* Gigs Section */}
                {user && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider preset-branding">
                      Gigs
                    </div>
                    <Link
                      href="/gigs"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gigs')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Search className="w-5 h-5 inline mr-3" />
                      Browse Gigs
                    </Link>
                    <Link
                      href="/gigs/saved"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gigs/saved')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="w-5 h-5 inline mr-3" />
                      Saved Gigs
                    </Link>
                    {isContributor && (
                      <Link
                        href="/gigs/my-gigs"
                        className={`
                          block px-3 py-2 text-base font-medium rounded-md preset-branding
                          ${isActive('/gigs/my-gigs')
                            ? 'text-primary bg-primary/10'
                            : 'nav-item'
                          }
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Briefcase className="w-5 h-5 inline mr-3" />
                        My Gigs
                      </Link>
                    )}
                  </>
                )}

                {/* Marketplace Section */}
                {user && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider preset-branding">
                      Marketplace
                    </div>
                    <Link
                      href="/gear"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Store className="w-5 h-5 inline mr-3" />
                      Browse Marketplace
                    </Link>
                    <Link
                      href="/gear/create"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear/create')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Plus className="w-5 h-5 inline mr-3" />
                      Create Listing
                    </Link>
                    <Link
                      href="/gear/requests?create=true"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear/requests')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageSquare className="w-5 h-5 inline mr-3" />
                      Create Request
                    </Link>
                    <Link
                      href="/gear/my-listings"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear/my-listings')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingBag className="w-5 h-5 inline mr-3" />
                      My Listings
                    </Link>
                    <Link
                      href="/gear/orders"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear/orders')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Briefcase className="w-5 h-5 inline mr-3" />
                      My Orders
                    </Link>
                    <Link
                      href="/gear/requests"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear/requests')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MessageSquare className="w-5 h-5 inline mr-3" />
                      Equipment Requests
                    </Link>
                    <Link
                      href="/gear/my-requests"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/gear/my-requests')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Clock className="w-5 h-5 inline mr-3" />
                      My Requests
                    </Link>
                  </>
                )}

                {/* Create & Browse Section */}
                {user && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider preset-branding">
                      Create
                    </div>
                    <Link
                      href="/playground"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/playground')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Camera className="w-5 h-5 inline mr-3" />
                      Media (Playground)
                    </Link>
                    <Link
                      href="/moodboards"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/moodboards')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Image className="w-5 h-5 inline mr-3" />
                      Moodboards
                    </Link>
                    <Link
                      href="/presets"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/presets')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Palette className="w-5 h-5 inline mr-3" />
                      Presets
                    </Link>
                    <Link
                      href="/showcases"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/showcases')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Sparkles className="w-5 h-5 inline mr-3" />
                      Showcases
                    </Link>
                    <Link
                      href="/treatments"
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive('/treatments')
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Wand2 className="w-5 h-5 inline mr-3" />
                      Treatments
                    </Link>
                  </>
                )}

                {/* Regular Nav Items */}
                {visibleNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        block px-3 py-2 text-base font-medium rounded-md preset-branding
                        ${isActive(item.href)
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5 inline mr-3" />
                      {item.label}
                    </Link>
                  )
                })}

                {!loading && user && isContributor && (
                  <Link
                    href="/gigs/create"
                    className="block px-3 py-2 text-base font-medium nav-item preset-branding"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="w-5 h-5 inline mr-3" />
                    Create Gig
                  </Link>
                )}

                {!loading && user && (
                  <div className="mt-3 border-t border-border pt-3">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-3 py-2 text-base font-medium nav-item preset-branding"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="w-5 h-5 inline mr-3" />
                        Dashboard - Admin View
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground preset-branding"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserIcon className="w-5 h-5 inline mr-3" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground preset-branding"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 inline mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={onSignOut}
                      className="block w-full text-left px-3 py-2 text-base font-medium text-destructive hover:text-destructive preset-branding"
                    >
                      <LogOut className="w-5 h-5 inline mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}

                {/* Theme Toggle for Mobile */}
                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium text-muted-foreground preset-branding">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>

                {!loading && !user && (
                  <div className="mt-3 border-t border-border pt-3">
                    <Link
                      href="/auth/signin"
                      className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground preset-branding"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block px-3 py-2 text-base font-medium nav-item preset-branding"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
