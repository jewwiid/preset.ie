'use client'

import Link from 'next/link';

export default function ConnectingSection() {
  return (
    <section className="py-16 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">CONNECT WITH</h2>
        </div>

        <div className="relative space-y-8">
          {/* Top row - left to right */}
          <div className="flex animate-scroll-left gap-8 lg:gap-12">
            {/* First set */}
            <div className="flex gap-8 lg:gap-12 shrink-0">
              <Link href="/photographers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">PHOTOGRAPHERS</Link>
              <Link href="/videographers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">VIDEOGRAPHERS</Link>
              <Link href="/freelancers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">FREELANCERS</Link>
              <Link href="/creative-directors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CREATIVE DIRECTORS</Link>
              <Link href="/brand-managers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">BRAND MANAGERS</Link>
              <Link href="/content-creators" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CONTENT CREATORS</Link>
              <Link href="/art-directors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ART DIRECTORS</Link>
              <Link href="/agencies" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">AGENCIES</Link>
              <Link href="/entrepreneurs" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ENTREPRENEURS</Link>
              <Link href="/influencers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">INFLUENCERS</Link>
              <Link href="/marketing-teams" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MARKETING TEAMS</Link>
              <Link href="/social-media-managers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">SOCIAL MEDIA MANAGERS</Link>
            </div>

            {/* Duplicate set for seamless loop */}
            <div className="flex gap-8 lg:gap-12 shrink-0">
              <div className="text-center">
                <Link href="/photographers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">PHOTOGRAPHERS</Link>
              </div>
              <div className="text-center">
                <Link href="/videographers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">VIDEOGRAPHERS</Link>
              </div>
              <div className="text-center">
                <Link href="/freelancers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">FREELANCERS</Link>
              </div>
              <div className="text-center">
                <Link href="/creative-directors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CREATIVE DIRECTORS</Link>
              </div>
              <div className="text-center">
                <Link href="/brand-managers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">BRAND MANAGERS</Link>
              </div>
              <div className="text-center">
                <Link href="/content-creators" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CONTENT CREATORS</Link>
              </div>
              <div className="text-center">
                <Link href="/art-directors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ART DIRECTORS</Link>
              </div>
              <div className="text-center">
                <Link href="/agencies" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">AGENCIES</Link>
              </div>
              <div className="text-center">
                <Link href="/entrepreneurs" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ENTREPRENEURS</Link>
              </div>
              <div className="text-center">
                <Link href="/influencers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">INFLUENCERS</Link>
              </div>
              <div className="text-center">
                <Link href="/marketing-teams" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MARKETING TEAMS</Link>
              </div>
              <div className="text-center">
                <Link href="/social-media-managers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">SOCIAL MEDIA MANAGERS</Link>
              </div>
            </div>
          </div>

          {/* Bottom row - right to left */}
          <div className="flex animate-scroll-right gap-8 lg:gap-12">
            {/* First set */}
            <div className="flex gap-8 lg:gap-12 shrink-0">
              <Link href="/studios" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">STUDIOS</Link>
              <Link href="/models" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MODELS</Link>
              <Link href="/makeup-artists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MAKEUP ARTISTS</Link>
              <Link href="/hair-stylists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">HAIR STYLISTS</Link>
              <Link href="/fashion-stylists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">FASHION STYLISTS</Link>
              <Link href="/producers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">PRODUCERS</Link>
              <Link href="/designers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">DESIGNERS</Link>
              <Link href="/artists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ARTISTS</Link>
              <Link href="/editors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">EDITORS</Link>
              <Link href="/writers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">WRITERS</Link>
              <Link href="/cinematographers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CINEMATOGRAPHERS</Link>
              <Link href="/directors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">DIRECTORS</Link>
              <Link href="/contractors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CONTRACTORS</Link>
              <Link href="/actors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ACTORS</Link>
              <Link href="/musicians" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MUSICIANS</Link>
            </div>

            {/* Duplicate set for seamless loop */}
            <div className="flex gap-8 lg:gap-12 shrink-0">
              <div className="text-center">
                <Link href="/studios" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">STUDIOS</Link>
              </div>
              <div className="text-center">
                <Link href="/models" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MODELS</Link>
              </div>
              <div className="text-center">
                <Link href="/makeup-artists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MAKEUP ARTISTS</Link>
              </div>
              <div className="text-center">
                <Link href="/hair-stylists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">HAIR STYLISTS</Link>
              </div>
              <div className="text-center">
                <Link href="/fashion-stylists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">FASHION STYLISTS</Link>
              </div>
              <div className="text-center">
                <Link href="/producers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">PRODUCERS</Link>
              </div>
              <div className="text-center">
                <Link href="/designers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">DESIGNERS</Link>
              </div>
              <div className="text-center">
                <Link href="/artists" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ARTISTS</Link>
              </div>
              <div className="text-center">
                <Link href="/editors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">EDITORS</Link>
              </div>
              <div className="text-center">
                <Link href="/writers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">WRITERS</Link>
              </div>
              <div className="text-center">
                <Link href="/cinematographers" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CINEMATOGRAPHERS</Link>
              </div>
              <div className="text-center">
                <Link href="/directors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">DIRECTORS</Link>
              </div>
              <div className="text-center">
                <Link href="/contractors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">CONTRACTORS</Link>
              </div>
              <div className="text-center">
                <Link href="/actors" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">ACTORS</Link>
              </div>
              <div className="text-center">
                <Link href="/musicians" className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc hover:text-primary transition-colors cursor-pointer">MUSICIANS</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
