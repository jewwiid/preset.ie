'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MarketplaceLayoutProps {
  children: React.ReactNode;
}

const marketplaceNavItems = [
  {
    name: 'Browse',
    href: '/gear',
    description: 'Discover equipment'
  },
  {
    name: 'My Listings',
    href: '/gear/my-listings',
    description: 'Manage your listings'
  },
  {
    name: 'Requests',
    href: '/gear/requests',
    description: 'Browse and create equipment requests'
  },
  {
    name: 'My Requests',
    href: '/gear/my-requests',
    description: 'View your rental requests and offers'
  },
  {
    name: 'Orders',
    href: '/gear/orders',
    description: 'Track your orders'
  },
  {
    name: 'Offers',
    href: '/gear/offers',
    description: 'Manage offers'
  },
  {
    name: 'Reviews',
    href: '/gear/reviews',
    description: 'View reviews'
  },
  {
    name: 'Boost',
    href: '/gear/boost',
    description: 'Boost your listings'
  }
];

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/gear" className="text-2xl font-bold text-foreground">
                Marketplace
              </Link>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Beta
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild>
                <Link href="/gear/create">
                  Create Listing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Marketplace navigation">
            {marketplaceNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/gear' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Preset Marketplace - Peer-to-peer equipment rental and sales
            </p>
            <p className="text-xs">
              Platform is not liable for transactions. Transact with verified users when possible.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
