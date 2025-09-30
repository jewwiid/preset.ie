'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { 
  Home, 
  Search, 
  Briefcase, 
  MessageSquare, 
  Image, 
  Plus,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  Settings,
  Heart,
  ChevronDown,
  Target,
  ShoppingBag,
  Store,
  Calendar,
  Palette,
  Users,
  FileText,
  Sparkles,
  Camera,
  Video,
  Wand2,
  Clock
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from './ThemeToggle'

export function NavBar() {
  const { user, userRole, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFetchFailed, setProfileFetchFailed] = useState(false)


  const getNavItemsForRole = () => {
    // Not authenticated - minimal landing page navigation
    if (!user) {
      return []
    }

    // Base items for all authenticated users
    const baseItems = [
      { label: 'Messages', href: '/messages', icon: MessageSquare, requiresAuth: true },
      { label: 'Collaborate', href: '/collaborate', icon: Users, requiresAuth: true },
      // Presets, Showcases, Treatments now accessible via Create menu
      // Marketplace is handled by dropdown, not as a base item
      // Matchmaking is accessible via dashboard, not as a main nav item
      // Applications moved to Dashboard dropdown
    ]

    // Role-specific additions
    const roleSpecificItems: any[] = []
    
    // Contributor-specific items
    if (profile?.role_flags?.includes('CONTRIBUTOR')) {
      roleSpecificItems.push(
        // My Gigs is now accessible via Gigs dropdown, not as a standalone nav item
        // Showcases now accessible via Create menu
      )
    }
    
    // Talent-specific items (users who are not contributors)
    // Showcases now accessible via Create menu for all users

    return [...baseItems, ...roleSpecificItems]
  }

  const mainNavItems = getNavItemsForRole()

  useEffect(() => {
    // Fetch profile when user is authenticated and loading is complete
    console.log('🔄 NavBar: useEffect triggered with:', {
      user: !!user,
      userRole: !!userRole,
      loading,
      condition: user && !loading,
      userEmail: user?.email,
      userId: user?.id
    })

    if (user && !loading) {
      // Verify session is actually available before fetching profile
      const verifyAndFetch = async () => {
        try {
          if (!supabase) return

          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            console.log('🎯 NavBar: Session verified, fetching profile...')
            fetchProfileSimple()
          } else {
            console.log('⚠️ NavBar: User exists but no session found, waiting...')
            // Retry after a short delay
            setTimeout(verifyAndFetch, 500)
          }
        } catch (error) {
          console.error('❌ NavBar: Session verification failed:', error)
        }
      }

      verifyAndFetch()
    } else {
      console.log('⏸️ NavBar: No user or still loading, clearing profile')
      setProfile(null)
      setIsAdmin(!!userRole?.isAdmin)
      setProfileLoading(false)
      setProfileFetchFailed(false)
    }
  }, [user, loading, userRole])

  // Listen for OAuth callback completion to retry profile fetch
  useEffect(() => {
    const handleOAuthCallbackComplete = () => {
      console.log('🚀 NavBar: OAuth callback complete, retrying profile fetch')
      // Add a small delay to ensure auth context has processed the session
      setTimeout(() => {
        if (user && !loading) {
          console.log('🚀 NavBar: Retrying profile fetch after OAuth callback')
          fetchProfileSimple()
        } else {
          console.log('🚀 NavBar: User not ready for profile fetch:', { user: !!user, loading })
        }
      }, 500)
    }

    window.addEventListener('oauth-callback-complete', handleOAuthCallbackComplete)
    
    return () => {
      window.removeEventListener('oauth-callback-complete', handleOAuthCallbackComplete)
    }
  }, [user, loading])

  const fetchProfileSimple = async (retryCount = 0) => {
    if (!user) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    // Check if profile fetching is disabled (e.g., during OAuth callback)
    if ((window as any).__disableNavBarProfileFetch) {
      console.log('⏸️ NavBar: Profile fetching disabled, skipping...')
      return
    }
    
    // Check if we should trigger a retry (from OAuth callback)
    if ((window as any).__triggerNavBarProfileFetch) {
      console.log('🚀 NavBar: Triggered profile fetch retry from OAuth callback')
      ;(window as any).__triggerNavBarProfileFetch = false
    }
    
    console.log(`🚀 NavBar: Simple profile fetch started${retryCount > 0 ? ` (retry ${retryCount})` : ''}`)
    setProfileLoading(true)
    if (retryCount === 0) {
      setProfileFetchFailed(false)
    }
    
    try {
      // Reduced timeout to 5 seconds for faster failure detection
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
      
      const fetchPromise = supabase!
        .from('users_profile')
        .select('avatar_url, display_name, role_flags, handle')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error) {
        console.warn('❌ NavBar: Simple profile fetch failed:', error.message)
        // Retry once if it's a network error and we haven't retried yet
        if (retryCount === 0 && (error.message.includes('timeout') || error.message.includes('network'))) {
          console.log('🔄 NavBar: Retrying profile fetch...')
          setTimeout(() => fetchProfileSimple(1), 1000)
          return
        }
        setProfile(null)
        setProfileFetchFailed(true)
      } else if (data) {
        console.log('✅ NavBar: Simple profile fetch success:', { hasAvatar: !!data.avatar_url })
        setProfile(data)
        setIsAdmin(data.role_flags?.includes('ADMIN'))
        setProfileFetchFailed(false)
      } else {
        console.log('ℹ️ NavBar: No profile found for user, setting profile to null')
        setProfile(null)
      }
    } catch (error: any) {
      console.error('💥 NavBar: Simple profile fetch error:', error.message)
      // Retry once for timeout errors
      if (retryCount === 0 && error.message.includes('timeout')) {
        console.log('🔄 NavBar: Retrying profile fetch after timeout...')
        setTimeout(() => fetchProfileSimple(1), 2000)
        return
      }
      setProfile(null)
      setProfileFetchFailed(true)
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen) {
        const target = event.target as Element
        // Check if click is outside both the dropdown and the button
        const isClickInsideDropdown = target.closest('[data-dropdown="profile"]')
        const isClickOnButton = target.closest('[data-dropdown-button="profile"]')
        
        if (!isClickInsideDropdown && !isClickOnButton) {
          setProfileDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDropdownOpen])


  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
    // Redirect to homepage after sign out
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  // Filter nav items based on auth status
  const visibleNavItems = mainNavItems.filter(item => {
    if (item.requiresAuth && !user) return false
    if ((item as any).adminOnly && !isAdmin) return false
    return true
  })

  // Check if user is contributor
  const isContributor = profile?.role_flags?.includes('CONTRIBUTOR')

  return (
    <>
      <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 mr-3">
                <img 
                  src="/logo.svg" 
                  alt="Preset" 
                  className="w-10 h-10"
                />
              </div>
              <span className="text-xl font-bold text-foreground">Preset</span>
            </Link>
          </div>

          {/* Desktop Navigation - Right aligned */}
          <div className="hidden md:flex md:items-center md:space-x-1">
              {/* Dashboard Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`
                        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${(isActive('/dashboard') || isActive('/profile') || isActive('/matchmaking'))
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/matchmaking" className="flex items-center">
                        <Target className="mr-2 h-4 w-4" />
                        Matchmaking
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/applications" className="flex items-center">
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
                        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${(isActive('/gigs'))
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Gigs
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/gigs" className="flex items-center">
                        <Search className="mr-2 h-4 w-4" />
                        Browse Gigs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gigs/saved" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        Saved Gigs
                      </Link>
                    </DropdownMenuItem>
                    {isContributor && (
                      <DropdownMenuItem asChild>
                        <Link href="/gigs/my-gigs" className="flex items-center">
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
                        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${(isActive('/gear'))
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Marketplace
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/gear" className="flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        Browse Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gear/create" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Listing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gear/my-listings" className="flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        My Listings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gear/orders" className="flex items-center">
                        <Briefcase className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Requests
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 z-50">
                        <DropdownMenuItem asChild>
                          <Link href="/gear/requests?create=true" className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Request
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/gear/requests" className="flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Browse Requests
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/gear/my-requests" className="flex items-center">
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
                        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${(isActive('/presets') || isActive('/presets/create') || isActive('/showcases') || isActive('/showcases/create') || isActive('/treatments') || isActive('/treatments/create') || isActive('/playground'))
                          ? 'text-primary bg-primary/10'
                          : 'nav-item'
                        }
                      `}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/playground" className="flex items-center">
                        <Camera className="mr-2 h-4 w-4" />
                        Media (Playground)
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/presets" className="flex items-center">
                        <Palette className="mr-2 h-4 w-4" />
                        Presets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/showcases" className="flex items-center">
                        <Image className="mr-2 h-4 w-4" />
                        Showcases
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/treatments" className="flex items-center">
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
                      inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive(item.href)
                        ? 'text-primary bg-primary/10'
                        : 'nav-item'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}

          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {loading ? (
              // Show loading state
              <div className="animate-pulse flex space-x-3">
                <div className="hidden md:block h-9 w-24 bg-muted-200 rounded-md"></div>
                <div className="h-8 w-8 bg-muted-200 rounded-full"></div>
              </div>
            ) : user ? (
              <>
                {/* Create Gig Button */}
                {profile?.role_flags?.includes('CONTRIBUTOR') && (
                  <Button asChild className="hidden md:inline-flex">
                    <Link href="/gigs/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Gig
                    </Link>
                  </Button>
                )}

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications - Only show if user exists */}
                {user && <NotificationBell />}

                {/* Profile Dropdown - Only show if user exists */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                        {(() => {
                          if (profileLoading) {
                            return (
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
                              </div>
                            )
                          } else if (profile?.avatar_url) {
                            return (
                              <div className="relative w-8 h-8">
                                <img
                                  src={profile.avatar_url}
                                  alt={profile.display_name || 'User'}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onLoad={() => console.log('✅ NavBar: Avatar image loaded successfully')}
                                  onError={(e) => {
                                    console.error('❌ NavBar: Avatar image failed to load:', profile.avatar_url)
                                    // Fallback to default avatar on error
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const fallback = target.parentElement?.querySelector('.fallback-avatar')
                                    if (fallback) {
                                      (fallback as HTMLElement).style.display = 'flex'
                                    }
                                  }}
                                />
                                <div className="fallback-avatar absolute inset-0 w-8 h-8 bg-primary rounded-full items-center justify-center hidden">
                                  <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )
                          }
                        })()}
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        {profileLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            <span className="text-sm text-muted-foreground-500">Loading...</span>
                          </div>
                        ) : profile ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-none">
                                {profile.display_name || 'User'}
                              </p>
                              <p className="text-xs leading-none text-muted-foreground ml-2">
                                @{profile.handle || 'handle'}
                              </p>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {profile?.role_flags?.includes('CONTRIBUTOR') && (
                                <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-800">
                                  Contributor
                                </Badge>
                              )}
                              {!profile?.role_flags?.includes('CONTRIBUTOR') && (
                                <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-800">
                                  Talent
                                </Badge>
                              )}
                              {isAdmin && (
                                <Badge variant="secondary" className="text-xs bg-destructive-100 text-destructive-800">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium leading-none">User</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              @{user?.email?.split('@')[0] || 'user'}
                            </p>
                          </>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <Home className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          Dashboard - Admin View
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md nav-item"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-200 pb-3 pt-2">
            {/* Dashboard Section */}
            {user && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground-500 uppercase tracking-wider">
                  Dashboard
                </div>
                <Link
                  href="/dashboard"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
                    ${isActive('/profile')
                      ? 'text-primary bg-primary/10'
                      : 'nav-item'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 inline mr-3" />
                  Profile
                </Link>
                <Link
                  href="/matchmaking"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground-500 uppercase tracking-wider">
                  Gigs
                </div>
                <Link
                  href="/gigs"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                      block px-3 py-2 text-base font-medium rounded-md
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
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground-500 uppercase tracking-wider">
                  Marketplace
                </div>
                <Link
                  href="/gear"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground-500 uppercase tracking-wider">
                  Create
                </div>
                <Link
                  href="/playground"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                  href="/presets"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
                    ${isActive('/showcases')
                      ? 'text-primary bg-primary/10'
                      : 'nav-item'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Image className="w-5 h-5 inline mr-3" />
                  Showcases
                </Link>
                <Link
                  href="/treatments"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
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
                    block px-3 py-2 text-base font-medium rounded-md
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


            {!loading && user && profile?.role_flags?.includes('CONTRIBUTOR') && (
              <Link
                href="/gigs/create"
                className="block px-3 py-2 text-base font-medium nav-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus className="w-5 h-5 inline mr-3" />
                Create Gig
              </Link>
            )}

            {!loading && user && (
              <div className="mt-3 border-t border-border-200 pt-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 text-base font-medium nav-item"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5 inline mr-3" />
                    Dashboard - Admin View
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-base font-medium text-muted-foreground-600 hover:text-muted-foreground-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 inline mr-3" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-base font-medium text-muted-foreground-600 hover:text-muted-foreground-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 inline mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-destructive-600 hover:text-destructive-900"
                >
                  <LogOut className="w-5 h-5 inline mr-3" />
                  Sign Out
                </button>
              </div>
            )}

            {/* Theme Toggle for Mobile */}
            <div className="mt-3 border-t border-border-200 pt-3">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-muted-foreground-600">Theme</span>
                <ThemeToggle />
              </div>
            </div>

            {!loading && !user && (
              <div className="mt-3 border-t border-border-200 pt-3">
                <Link
                  href="/auth/signin"
                  className="block px-3 py-2 text-base font-medium text-muted-foreground-600 hover:text-muted-foreground-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 text-base font-medium nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

    </nav>
    </>
  )
}