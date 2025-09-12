'use client'

import { useState, useEffect, Fragment } from 'react'
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
import { Menu as HeadlessMenu, Transition } from '@headlessui/react'

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
    <nav className={`bg-white shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-2">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">Preset</span>
                </div>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-1">
              {navigationItems
                .filter(item => item.show)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1.5" />
                      {item.name}
                    </Link>
                  )
                })}
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
                    className="hidden md:flex items-center px-3 py-1.5 mr-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Gig
                  </Link>
                )}


                {/* User menu */}
                <HeadlessMenu as="div" className="relative ml-3">
                  <HeadlessMenu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                    <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </HeadlessMenu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <HeadlessMenu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <HeadlessMenu.Item>
                        {({ active, close }) => (
                          <Link
                            href="/profile"
                            onClick={close}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Your Profile
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      <HeadlessMenu.Item>
                        {({ active, close }) => (
                          <Link
                            href="/settings"
                            onClick={close}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer`}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        )}
                      </HeadlessMenu.Item>
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <HeadlessMenu.Item>
                            {({ active, close }) => (
                              <Link
                                href="/admin"
                                onClick={close}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center px-4 py-2 text-sm text-emerald-600 font-medium hover:bg-gray-100 transition-colors cursor-pointer`}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Admin Panel
                              </Link>
                            )}
                          </HeadlessMenu.Item>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-left`}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </HeadlessMenu.Items>
                  </Transition>
                </HeadlessMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-emerald-600 px-3 py-2 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
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

      {/* Mobile menu */}
      <Transition
        show={mobileMenuOpen}
        enter="transition ease-out duration-100 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems
              .filter(item => item.show)
              .map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            
            {isContributor && (
              <Link
                href="/gigs/create"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Gig
              </Link>
            )}
          </div>

          {user ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-2 space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-2" />
                  Your Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-2 space-y-1">
                <Link
                  href="/auth/signin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </Transition>
    </nav>
  )
}