'use client'

import { ReactNode } from 'react'
import { NavBar } from './NavBar'
import { usePathname } from 'next/navigation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  
  // Pages that shouldn't show navigation (keep only profile creation and test admin)
  const noNavPages = ['/auth/create-profile', '/test-admin']
  const shouldShowNav = pathname ? !noNavPages.includes(pathname) : true

  return (
    <div className="min-h-screen bg-muted-50">
      {shouldShowNav && <NavBar />}
      <main className={shouldShowNav ? '' : ''}>
        {children}
      </main>
    </div>
  )
}