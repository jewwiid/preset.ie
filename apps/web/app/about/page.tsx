'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Camera, 
  Sparkles, 
  Shield, 
  Star, 
  ArrowRight,
  CheckCircle,
  Heart,
  MessageCircle,
  Image,
  Zap
} from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Preset
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connecting creatives worldwide through a subscription-based platform that eliminates 
              transaction friction and keeps everything inside the app.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* What is Preset */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">What is Preset?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Preset is a subscription-based, cross-platform creative collaboration app that connects 
              Contributors (photographers/videographers/cinematographers) with Talent (creative partners) 
              for professional shoots.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>For Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Post gigs with detailed requirements, review applications, book talent, and build your portfolio through showcases.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>For Talent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse gigs, apply with your profile, message contributors, and build your portfolio through completed collaborations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>For the Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Safe collaboration with built-in safety measures, professional standards, and AI-powered tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Core User Flows */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our streamlined workflow makes creative collaboration simple and efficient.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <CardTitle className="text-lg">Create Gig</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contributors post detailed gigs with requirements, moodboards, and compensation details.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <CardTitle className="text-lg">Apply & Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Talent applies with their profile and communicates through per-gig chat threads.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <CardTitle className="text-lg">Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Both parties participate in the creative session with clear expectations and safety guidelines.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">4</span>
                </div>
                <CardTitle className="text-lg">Showcase & Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create mutual showcases and review each other to build reputation in the community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Business Model */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              No per-gig payments. Just predictable monthly subscriptions that scale with your needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-center">Free</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">€0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Basic profile</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">3 applications/month (Talent)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">2 gigs/month (Contributors)</span>
                      </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="relative border-primary">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-center">Plus</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">€9-12</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Unlimited applications/gigs</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Advanced analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Verification badge</span>
                      </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-center">Pro</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">€19-24</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Everything in Plus</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Priority visibility</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm">Early feature access</span>
                      </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Safety & Trust */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">Safety & Trust</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We prioritize user safety and trust above all else with comprehensive safety measures.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Email and phone verification required, with optional ID verification for enhanced trust.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <MessageCircle className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">In-App Chat Only</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Initial communication through platform only with message monitoring and rate limiting.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Star className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Review System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Mutual review system with ratings and tags to build reputation and trust in the community.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Heart className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Content Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  EXIF data stripping, private storage, and clear usage rights for all content.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

            {/* Call to Action */}
            <section className="text-center">
              <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Join the Creative Community?
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start connecting with creatives worldwide. Build your portfolio, find collaborators, 
              and grow your creative career with Preset.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/gigs">
                  Browse Gigs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/subscription">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
