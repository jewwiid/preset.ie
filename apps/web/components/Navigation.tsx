'use client'

import { useState, useEffect, Fragment } from 'react'
import { Transition } from '@headlessui/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { 
  Camera, 
  Menu, 
  X, 
  Home,
  Briefcase,
  Users,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Plus,
  Grid,
  FileText,
  Star,
  Search,
  ChevronDown
} from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu'
import { cn } from '../lib/utils'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, userRole, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isContributor = userRole?.isContributor
  const isTalent = userRole?.isTalent
  const isAdmin = userRole?.isAdmin



  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Navigation items based on user role
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      show: !!user
    },
    {
      name: 'Browse Gigs',
      href: '/gigs',
      icon: Grid,
      show: isTalent || !user
    },
    {
      name: 'My Gigs',
      href: '/gigs/my-gigs',
      icon: Briefcase,
      show: isContributor
    },
    {
      name: 'Applications',
      href: '/applications',
      icon: FileText,
      show: isContributor || isTalent
    },
    {
      name: 'Showcases',
      href: '/showcases',
      icon: Star,
      show: !!user
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      show: !!user
    }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className={`bg-background shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center">
                  <div className="bg-primary rounded-lg p-2">
                    <Camera className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="ml-2 text-xl font-bold text-muted-foreground-900">Preset</span>
                </div>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex">
              <NavigationMenu>
                <NavigationMenuList>
                  {navigationItems
                    .filter(item => item.show)
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <NavigationMenuItem key={item.name}>
                          <Link href={item.href} legacyBehavior passHref>
                            <NavigationMenuLink
                              className={cn(
                                navigationMenuTriggerStyle(),
                                "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive(item.href)
                                  ? 'text-primary bg-primary/10'
                                  : 'text-muted-foreground-700 hover:text-primary hover:bg-primary/10'
                              )}
                            >
                              <Icon className="h-4 w-4 mr-1.5" />
                              {item.name}
                            </NavigationMenuLink>
                          </Link>
                        </NavigationMenuItem>
                      )
                    })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center">
            {user ? (
              <>
                {/* Create new gig button for contributors */}
                {isContributor && (
                  <Link
                    href="/gigs/create"
                    className="hidden md:flex items-center px-3 py-1.5 mr-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Gig
                  </Link>
                )}


                {/* User menu */}
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-primary bg-transparent hover:bg-transparent">
                        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground-500" />
                        </div>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-48 p-1">
                          <Link href="/profile" legacyBehavior passHref>
                            <NavigationMenuLink className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer rounded-md">
                              <User className="h-4 w-4 mr-2" />
                              Your Profile
                            </NavigationMenuLink>
                          </Link>
                          <Link href="/settings" legacyBehavior passHref>
                            <NavigationMenuLink className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer rounded-md">
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </NavigationMenuLink>
                          </Link>
                          {isAdmin && (
                            <>
                              <div className="border-t border-border my-1"></div>
                              <Link href="/admin" legacyBehavior passHref>
                                <NavigationMenuLink className="flex items-center px-4 py-2 text-sm text-primary font-medium hover:bg-accent transition-colors cursor-pointer rounded-md">
                                  <Settings className="h-4 w-4 mr-2" />
                                  Admin Panel
                                </NavigationMenuLink>
                              </Link>
                            </>
                          )}
                          <div className="border-t border-border my-1"></div>
                          <Link href="/profile" legacyBehavior passHref>
                            <NavigationMenuLink className="flex items-center px-4 py-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors cursor-pointer font-medium rounded-md">
                              <User className="h-4 w-4 mr-2" />
                              Edit Profile
                            </NavigationMenuLink>
                          </Link>
                          <div className="border-t border-border my-1"></div>
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer text-left rounded-md"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </button>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="text-muted-foreground-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md nav-item focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-primary"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <Transition
        show={mobileMenuOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Full-screen sidebar */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-background shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center">
                  <div className="bg-primary rounded-lg p-2">
                    <Camera className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="ml-2 text-xl font-bold text-foreground">Preset</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-accent transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Navigation items */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {navigationItems
                  .filter(item => item.show)
                  .map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          isActive(item.href)
                            ? 'text-primary bg-primary/10'
                            : 'text-foreground hover:text-primary hover:bg-accent'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    )
                  })}
                
                {isContributor && (
                  <Link
                    href="/gigs/create"
                    className="flex items-center px-4 py-3 mt-4 rounded-lg text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Create Gig
                  </Link>
                )}
              </div>

              {/* Footer */}
              {user ? (
                <div className="border-t border-border p-4 space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Your Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-primary hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="border-t border-border p-4 space-y-1">
                  <Link
                    href="/auth/signin"
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-foreground hover:text-primary hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center px-4 py-3 rounded-lg text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </Transition>
    </nav>
  )
}