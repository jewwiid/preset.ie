'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/preset-logo.svg"
                alt="Preset Logo"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting creatives worldwide
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/gigs" className="text-muted-foreground hover:text-primary transition-colors">
              Gigs
            </Link>
            <Link href="/showcases" className="text-muted-foreground hover:text-primary transition-colors">
              Showcases
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
              Help
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © {currentYear} Preset. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
