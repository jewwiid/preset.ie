'use client'

import { useAuth } from "../lib/auth-context";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // Removed automatic redirect - let users choose to view homepage or go to dashboard

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-preset-50 to-white">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-preset-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-preset-500 border-t-transparent absolute top-0"></div>
        </div>
      </div>
    );
  }

  // Allow both authenticated and non-authenticated users to view the homepage

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation is now handled by the global NavBar in layout.tsx */}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.jpeg"
            alt="Creative photography"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white dark:from-gray-900/90 dark:via-gray-900/70 dark:to-gray-900"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-gradient">Where Creatives</span>
            <br />
            <span className="text-gray-900 dark:text-white">Connect & Create</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            The creative collaboration platform where Contributors post gigs and Talent applies. 
            Build your portfolio with Showcases. Free to start, subscription-based.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-preset-500 rounded-xl overflow-hidden transition-all hover:scale-105"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-preset-400 to-preset-600"></span>
                  <span className="relative">Go to Dashboard</span>
                </a>
                <a
                  href="/gigs/create"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-preset-600 dark:text-preset-400 bg-white dark:bg-gray-800 rounded-xl border-2 border-preset-200 dark:border-preset-800 hover:border-preset-300 dark:hover:border-preset-600 transition-all"
                >
                  Create a Gig
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signup"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-preset-500 rounded-xl overflow-hidden transition-all hover:scale-105"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-preset-400 to-preset-600"></span>
                  <span className="relative">Start Creating for Free</span>
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-preset-600 dark:text-preset-400 bg-white dark:bg-gray-800 rounded-xl border-2 border-preset-200 dark:border-preset-800 hover:border-preset-300 dark:hover:border-preset-600 transition-all"
                >
                  Learn More
                </a>
              </>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-preset-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-preset-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to <span className="text-gradient">Create</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From finding the perfect creative partner to showcasing your best work, 
              Preset has all the tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post & Browse Gigs</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Contributors post creative gigs with beautiful moodboards. Talent browses and applies to projects they love.
              </p>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">In-App Showcases</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Build your portfolio with Showcases created from completed shoots. Keep all your best work in one place.
              </p>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Safe & Trusted</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built-in safety features including release forms, content moderation, and secure messaging for peace of mind.
              </p>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Beautiful Moodboards</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create stunning moodboards with AI-powered tags and color palettes. Make your gigs stand out and inspire.
              </p>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cross-Platform</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access Preset on web, iOS, and Android with a consistent, beautiful experience across all devices.
              </p>
            </div>

            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-preset-400 to-preset-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Smart Matching</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI-powered style matching connects you with the perfect creative partners based on your aesthetic preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-preset-500 to-preset-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Creating?
          </h2>
          <p className="text-xl text-preset-100 mb-8">
            Join thousands of creative professionals already using Preset. 
            Free to start, with powerful features to grow your creative business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-preset-600 bg-white rounded-xl hover:shadow-xl transition-all hover:scale-105"
                >
                  Go to Dashboard
                </a>
                <a
                  href="/gigs"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-xl hover:bg-white hover:text-preset-600 transition-all"
                >
                  Browse Gigs →
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-preset-600 bg-white rounded-xl hover:shadow-xl transition-all hover:scale-105"
                >
                  Sign Up for Free
                </a>
                <a
                  href="/auth/signin"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white rounded-xl hover:bg-white hover:text-preset-600 transition-all"
                >
                  Sign In →
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image src="/logo.svg" alt="Preset" width={24} height={24} className="w-6 h-6" />
              <span className="font-bold text-lg text-preset-600 dark:text-preset-400">Preset</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 Preset. Connecting creatives worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}