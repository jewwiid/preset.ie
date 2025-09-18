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
    href: '/marketplace',
    description: 'Discover equipment'
  },
  {
    name: 'My Listings',
    href: '/marketplace/my-listings',
    description: 'Manage your listings'
  },
  {
    name: 'Orders',
    href: '/marketplace/orders',
    description: 'Track your orders'
  },
  {
    name: 'Offers',
    href: '/marketplace/offers',
    description: 'Manage offers'
  },
  {
    name: 'Reviews',
    href: '/marketplace/reviews',
    description: 'View reviews'
  }
];

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/marketplace" className="text-2xl font-bold text-gray-900">
                Preset Marketplace
              </Link>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Beta
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/marketplace/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Marketplace navigation">
            {marketplaceNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/marketplace' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
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
