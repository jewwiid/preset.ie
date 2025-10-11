'use client';

interface WhatYouCanDoSectionProps {
  isLoggedIn: boolean;
}

export default function WhatYouCanDoSection({ isLoggedIn }: WhatYouCanDoSectionProps) {
  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">What You Can Do</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover amazing features that help you create, collaborate, and grow your creative career
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-6">1</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Generate AI Content</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Create stunning images and videos with AI-powered presets and treatments. Experiment with different styles and bring your ideas to life.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-6">2</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Connect & Collaborate</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Browse creative gigs, find talented collaborators, and build your professional network. Message, shortlist, and work with the best creatives.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-6">3</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">Build Your Portfolio</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Showcase your work with smart moodboards and collaborative showcases. Get discovered by brands and clients worldwide.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <a
            href={isLoggedIn ? "/dashboard" : "/auth/signup"}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            Get Started Today
          </a>
        </div>
      </div>
    </section>
  );
}
