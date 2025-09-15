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
  Target
} from 'lucide-react'
import { NotificationBell } from './NotificationBell'

export function NavBar() {
  const { user, userRole, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Debug logging
  console.log('🔍 NavBar render - Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    loading,
    hasProfile: !!profile,
    profileLoading,
    profileAvatarUrl: profile?.avatar_url,
    userRole: !!userRole,
    isAdmin,
    shouldShowAvatar: !profileLoading && profile?.avatar_url
  })

  const getNavItemsForRole = () => {
    // Not authenticated - minimal landing page navigation
    if (!user) {
      return []
    }

    // Base items for all authenticated users
    const baseItems = [
      { label: 'Matchmaking', href: '/matchmaking', icon: Target, requiresAuth: true },
      { label: 'Messages', href: '/messages', icon: MessageSquare, requiresAuth: true },
    ]

    // Role-specific additions
    const roleSpecificItems = []
    
    // Contributor-specific items
    if (profile?.role_flags?.includes('CONTRIBUTOR')) {
      roleSpecificItems.push(
        { label: 'Applications', href: '/applications', icon: Briefcase, requiresAuth: true },
        { label: 'Showcases', href: '/showcases', icon: Image, requiresAuth: true }
      )
    }
    
    // Talent-specific items (users who are not contributors)
    if (!profile?.role_flags?.includes('CONTRIBUTOR')) {
      roleSpecificItems.push(
        { label: 'My Applications', href: '/applications', icon: Briefcase, requiresAuth: true },
        { label: 'Showcases', href: '/showcases', icon: Image, requiresAuth: true }
      )
    }

    return [...baseItems, ...roleSpecificItems]
  }

  const mainNavItems = getNavItemsForRole()

  useEffect(() => {
    // Fetch profile when user is authenticated and loading is complete
    console.log('🔄 NavBar: useEffect triggered with:', {
      user: !!user,
      userRole: !!userRole, 
      loading,
      condition: user && !loading
    })
    
    if (user && !loading) {
      console.log('🎯 NavBar: User authenticated, fetching profile...')
      fetchProfileSimple()
    } else {
      console.log('⏸️ NavBar: No user or still loading, clearing profile')
      setProfile(null)
      setIsAdmin(!!userRole?.isAdmin)
      setProfileLoading(false)
    }
  }, [user, loading])

  const fetchProfileSimple = async () => {
    if (!user) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    console.log('🚀 NavBar: Simple profile fetch started')
    setProfileLoading(true)
    
    try {
      // Use the exact same query as profile page, but without timeout
      const { data, error } = await supabase!
        .from('users_profile')
        .select('avatar_url, display_name, role_flags, handle')  // Include handle
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.warn('❌ NavBar: Simple profile fetch failed:', error.message)
        setProfile(null)
      } else if (data) {
        console.log('✅ NavBar: Simple profile fetch success:', { hasAvatar: !!data.avatar_url })
        setProfile(data)
        setIsAdmin(data.role_flags?.includes('ADMIN'))
      }
    } catch (error: any) {
      console.error('💥 NavBar: Simple profile fetch error:', error.message)
      setProfile(null)
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


  const handleSignOut = async () => {
    await signOut()
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 mr-3">
                <img 
                  src="/logo.svg" 
                  alt="Preset" 
                  className="w-10 h-10"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">Preset</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {/* Dashboard - Always First */}
              {user && (
                <Link
                  href="/dashboard"
                  className={`
                    inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${(isActive('/dashboard'))
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              )}

              {/* Gigs Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`
                        inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${(isActive('/gigs'))
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}

            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {loading ? (
              // Show loading state
              <div className="animate-pulse flex space-x-3">
                <div className="hidden md:block h-9 w-24 bg-gray-200 rounded-md"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
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

                {/* Notifications - Only show if user exists */}
                {user && <NotificationBell />}

                {/* Profile Dropdown - Only show if user exists */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                        {(() => {
                          console.log('🖼️ NavBar: Avatar render decision:', { 
                            profileLoading, 
                            hasAvatarUrl: !!profile?.avatar_url, 
                            avatarUrl: profile?.avatar_url,
                            profile: !!profile 
                          })
                          
                          if (profileLoading) {
                            return (
                              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              </div>
                            )
                          } else if (profile?.avatar_url) {
                            return (
                              <img
                                src={profile.avatar_url}
                                alt={profile.display_name || 'User'}
                                className="w-8 h-8 rounded-full object-cover"
                                onLoad={() => console.log('✅ NavBar: Avatar image loaded successfully')}
                                onError={(e) => console.error('❌ NavBar: Avatar image failed to load:', e, 'URL:', profile.avatar_url)}
                              />
                            )
                          } else {
                            return (
                              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
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
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500 mr-2"></div>
                            <span className="text-sm text-gray-500">Loading...</span>
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
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                  Contributor
                                </Badge>
                              )}
                              {!profile?.role_flags?.includes('CONTRIBUTOR') && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  Talent
                                </Badge>
                              )}
                              {isAdmin && (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
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
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
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
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pb-3 pt-2">
            {/* Dashboard - Always First */}
            {user && (
              <Link
                href="/dashboard"
                className={`
                  block px-3 py-2 text-base font-medium rounded-md
                  ${isActive('/dashboard')
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5 inline mr-3" />
                Dashboard
              </Link>
            )}

            {/* Gigs Section */}
            {user && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gigs
                </div>
                <Link
                  href="/gigs"
                  className={`
                    block px-3 py-2 text-base font-medium rounded-md
                    ${isActive('/gigs')
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                className="block px-3 py-2 text-base font-medium text-emerald-600 hover:bg-emerald-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus className="w-5 h-5 inline mr-3" />
                Create Gig
              </Link>
            )}

            {!loading && user && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5 inline mr-3" />
                    Dashboard - Admin View
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 inline mr-3" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 inline mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-900"
                >
                  <LogOut className="w-5 h-5 inline mr-3" />
                  Sign Out
                </button>
              </div>
            )}

            {!loading && !user && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <Link
                  href="/auth/signin"
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 text-base font-medium text-emerald-600 hover:bg-emerald-50 rounded-md"
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
  )
}