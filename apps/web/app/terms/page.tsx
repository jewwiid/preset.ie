'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertTriangle, Users, Camera, Star, CreditCard, Ban, Eye } from 'lucide-react'
import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-card border-b border-border py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Introduction */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
          <p className="text-muted-foreground mb-4">
            These Terms of Service ("Terms") govern your use of Preset ("we," "us," or "our"), a creative collaboration platform that connects Contributors (photographers/videographers/cinematographers) with Talent (creative partners) for professional shoots.
          </p>
          <p className="text-muted-foreground">
            By accessing or using Preset, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the service.
          </p>
        </section>

        {/* Acceptance of Terms */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Acceptance of Terms</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                By creating an account, accessing, or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. These Terms constitute a legally binding agreement between you and Preset.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Description of Service */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Description of Service</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Creative Collaboration Platform</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Preset is a subscription-based platform that facilitates professional creative collaborations. Our service includes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                  <li>Gig posting and application management</li>
                  <li>User profiles and portfolio showcases</li>
                  <li>In-app messaging and collaboration tools</li>
                  <li>Review and rating system</li>
                  <li>Subscription-based access tiers</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Contributors</h4>
                    <p className="text-sm text-muted-foreground">
                      Photographers, videographers, and cinematographers who post gigs and hire talent for creative projects.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Talent</h4>
                    <p className="text-sm text-muted-foreground">
                      Creative professionals who apply to gigs and participate in collaborative projects.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User Accounts */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">User Accounts</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>You must be at least 18 years old to create an account</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining the security of your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>One account per person - multiple accounts are prohibited</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Keep your profile information current and accurate</li>
                  <li>Use a professional and respectful tone in all communications</li>
                  <li>Honor your commitments to gigs and collaborations</li>
                  <li>Respect intellectual property rights</li>
                  <li>Follow all applicable laws and regulations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Acceptable Use */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Acceptable Use</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Permitted Uses</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Posting legitimate gig opportunities</li>
                  <li>Applying to relevant gigs as talent</li>
                  <li>Building professional portfolios and showcases</li>
                  <li>Communicating professionally with other users</li>
                  <li>Providing honest reviews and feedback</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-destructive" />
                  <CardTitle className="text-lg">Prohibited Uses</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Posting fake or misleading gig information</li>
                  <li>Harassment, abuse, or discrimination</li>
                  <li>Spam, unsolicited messages, or promotional content</li>
                  <li>Violation of intellectual property rights</li>
                  <li>Illegal activities or content</li>
                  <li>Attempting to circumvent platform fees or restrictions</li>
                  <li>Creating multiple accounts</li>
                  <li>Sharing personal contact information outside the platform</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Content and Intellectual Property */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Content and Intellectual Property</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You retain ownership of all content you upload to Preset, including photos, videos, text, and other materials. However, by using our service, you grant us certain rights:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>License to display your content on the platform</li>
                  <li>License to use your content for platform promotion (with permission)</li>
                  <li>License to store and process your content</li>
                  <li>License to create thumbnails and previews</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mutual Showcases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  When creating mutual showcases, both parties must consent to the use of their content. This includes the right to display the collaborative work in portfolios and promotional materials.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All platform features, design, and functionality are owned by Preset and protected by intellectual property laws. You may not copy, modify, or distribute our platform content without permission.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Subscription and Payments */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Subscription and Payments</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Subscription Tiers</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground">Free Tier</h4>
                    <p className="text-sm text-muted-foreground">Limited applications and gig postings</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Plus Tier (€9-12/month)</h4>
                    <p className="text-sm text-muted-foreground">Unlimited applications and advanced features</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Pro Tier (€19-24/month)</h4>
                    <p className="text-sm text-muted-foreground">Priority visibility and premium features</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Subscriptions are billed monthly in advance</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We may change subscription prices with 30 days notice</li>
                  <li>Failed payments may result in service suspension</li>
                  <li>You can cancel your subscription at any time</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">No Per-Gig Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Preset operates on a subscription model. We do not process payments between users for individual gigs. All financial arrangements between Contributors and Talent are handled outside the platform and are the responsibility of the parties involved.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Privacy and Safety */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Privacy and Safety</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Privacy Protection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Initial communication must occur within the platform</li>
                  <li>Personal contact information should not be shared publicly</li>
                  <li>All communications are monitored for safety</li>
                  <li>EXIF data is automatically stripped from uploaded images</li>
                  <li>Content is stored securely and privately</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Safety Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Meet in public places for initial collaborations</li>
                  <li>Verify identities through our verification system</li>
                  <li>Report any suspicious or inappropriate behavior</li>
                  <li>Respect professional boundaries</li>
                  <li>Follow all applicable safety regulations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We reserve the right to review, moderate, and remove content that violates our terms or community guidelines. This includes inappropriate content, spam, or material that infringes on others' rights.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Termination */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Termination</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Either party may terminate this agreement at any time:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>You may delete your account at any time</li>
                <li>We may suspend or terminate accounts that violate these terms</li>
                <li>Termination does not affect rights and obligations that have already accrued</li>
                <li>Upon termination, your right to use the service ceases immediately</li>
                <li>We may retain certain information as required by law</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Disclaimers and Limitations */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Disclaimers and Limitations</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <CardTitle className="text-lg">Service Availability</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We strive to provide reliable service, but we cannot guarantee uninterrupted access. The service is provided "as is" without warranties of any kind.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Preset facilitates connections between users but is not responsible for the quality, safety, or legality of gigs, collaborations, or user interactions. Users interact at their own risk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, Preset shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes through:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Email notifications</li>
                <li>In-app notifications</li>
                <li>Updates to this page</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Continued use of the service after changes constitutes acceptance of the new Terms.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with Irish law. Any disputes arising from these Terms or your use of the service shall be subject to the exclusive jurisdiction of the Irish courts.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
          
          <Card>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  <strong>Email:</strong> <a href="mailto:legal@preset.ie" className="text-primary hover:underline">legal@preset.ie</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Support:</strong> <a href="mailto:support@preset.ie" className="text-primary hover:underline">support@preset.ie</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Address:</strong> Preset, Creative Collaboration Platform
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
