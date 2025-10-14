'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { MessageSquare, Users } from 'lucide-react'
import { useNavBarProfile } from '../hooks/useNavBarProfile'
import { DesktopNav } from './navbar/DesktopNav'
import { MobileNav } from './navbar/MobileNav'

export function NavBar() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { profile, profileLoading, isAdmin, isContributor } = useNavBarProfile(user, loading)

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getNavItemsForRole = () => {
    if (!user) return []

    const baseItems = [
      { label: 'Messages', href: '/messages', icon: MessageSquare, requiresAuth: true },
      { label: 'Collaborate', href: '/collaborate', icon: Users, requiresAuth: true },
    ]

    return baseItems
  }

  const mainNavItems = getNavItemsForRole()

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  const visibleNavItems = mainNavItems.filter(item => {
    if (item.requiresAuth && !user) return false
    if ((item as any).adminOnly && !isAdmin) return false
    return true
  })

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2 md:gap-3 lg:gap-6">
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
              <span className="text-xl font-bold text-primary preset-branding">Preset</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <DesktopNav
            user={user}
            profile={profile}
            profileLoading={profileLoading}
            isAdmin={isAdmin}
            isContributor={isContributor}
            loading={loading}
            visibleNavItems={visibleNavItems}
            isActive={isActive}
            onSignOut={handleSignOut}
          />

          {/* Mobile Navigation */}
          <MobileNav
            user={user}
            profile={profile}
            profileLoading={profileLoading}
            isAdmin={isAdmin}
            isContributor={isContributor}
            loading={loading}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            visibleNavItems={visibleNavItems}
            isActive={isActive}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </nav>
  )
}
